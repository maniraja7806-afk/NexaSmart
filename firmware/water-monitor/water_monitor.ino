/*
 * ============================================================================
 * NexaSmart IoT Firmware: Water Management & Leak Protection Node
 * Hardware: ESP32 + Ultrasonic HC-SR04P (Tank Level) + Flow Sensor (YF-S201)
 *           + Water Leak Probe + Relay Module (Pump Control)
 * Pinout:
 *   Ultrasonic Trig --> GPIO 5
 *   Ultrasonic Echo --> GPIO 18 (Using 3.3V tolerant sensor)
 *   Flow Sensor Pulse-> GPIO 19 (Hardware interrupt)
 *   Leak Probe ADC  --> GPIO 35 (ADC1_CH7)
 *   Pump Relay Pin  --> GPIO 33 (Active LOW)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_wtr_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-WTR-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-PUMP-ROOM";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_FLOW 19
#define PIN_LEAK 35
#define PIN_PUMP 33

const float TANK_DEPTH_CM = 200.0; // 2 meters depth tank
volatile unsigned long flowPulseCount = 0;
float totalLiters = 0.0;
bool pumpState = false;
bool leakDetected = false;

char topicTelemetry[128];
char topicStatus[128];
char topicCommand[128];
char topicAck[128];

WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long lastTelemetry = 0;
unsigned long sequenceCounter = 0;

void IRAM_ATTR pulseCounter() {
  flowPulseCount++;
}

void setPump(bool state) {
  // Interlock check: never allow pump ON if leak is detected
  if (state && leakDetected) {
    pumpState = false;
    digitalWrite(PIN_PUMP, HIGH);
    return;
  }
  pumpState = state;
  digitalWrite(PIN_PUMP, pumpState ? LOW : HIGH);
}

float measureTankPercent() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~5m)
  if (duration == 0) return -1; // Echo timeout
  float distanceCm = (duration * 0.0343) / 2.0;

  // Level is inverted from distance to sensor at top of tank
  float waterDepthCm = constrain(TANK_DEPTH_CM - distanceCm, 0.0, TANK_DEPTH_CM);
  return (waterDepthCm / TANK_DEPTH_CM) * 100.0;
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, length)) return;

  const char* cmdId = doc["commandId"];
  const char* act   = doc["action"];

  StaticJsonDocument<256> ack;
  ack["commandId"]  = cmdId;
  ack["deviceId"]   = DEVICE_ID;
  ack["executedAt"] = millis();

  if (strcmp(act, "SET_PUMP") == 0) {
    int val = doc["value"];
    if (val == 1 && leakDetected) {
      ack["status"] = "REJECTED_SAFETY_INTERLOCK";
      ack["errorMessage"] = "Cannot start pump while leak is detected!";
    } else {
      setPump(val == 1);
      ack["status"] = "SUCCESS";
      ack["state"]["pumpState"] = pumpState;
    }
  } else if (strcmp(act, "EMERGENCY_SHUTDOWN") == 0) {
    setPump(false);
    ack["status"] = "SUCCESS";
    ack["state"]["pumpState"] = false;
  } else {
    ack["status"] = "UNSUPPORTED_COMMAND";
  }

  char ackBuf[256];
  serializeJson(ack, ackBuf);
  mqttClient.publish(topicAck, ackBuf);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_FLOW, INPUT_PULLUP);
  pinMode(PIN_LEAK, INPUT);
  pinMode(PIN_PUMP, OUTPUT);
  setPump(false);

  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), pulseCounter, FALLING);

  snprintf(topicTelemetry, sizeof(topicTelemetry), "nexasmart/%s/%s/%s/telemetry", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicStatus,    sizeof(topicStatus),    "nexasmart/%s/%s/%s/status",    BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicCommand,   sizeof(topicCommand),   "nexasmart/%s/%s/%s/command",   BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicAck,       sizeof(topicAck),       "nexasmart/%s/%s/%s/ack",       BUILDING_ID, ROOM_ID, DEVICE_ID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) WiFi.reconnect();
  if (!mqttClient.connected()) {
    StaticJsonDocument<128> lwt;
    lwt["deviceId"] = DEVICE_ID;
    lwt["status"]   = "OFFLINE";
    char lwtBuf[128];
    serializeJson(lwt, lwtBuf);
    if (mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS, topicStatus, 1, true, lwtBuf)) {
      mqttClient.subscribe(topicCommand, 1);
    }
  }
  mqttClient.loop();

  // Check water leak analog probe (threshold < 2000 means moisture conduction)
  int leakRaw = analogRead(PIN_LEAK);
  leakDetected = (leakRaw < 2000);
  if (leakDetected && pumpState) {
    // Immediate hardware shutdown on leak
    setPump(false);
  }

  unsigned long now = millis();
  if (now - lastTelemetry >= 3000) {
    lastTelemetry = now;

    // Calculate flow rate (7.5 pulses per second = 1 L/min for YF-S201)
    noInterrupts();
    unsigned long pulses = flowPulseCount;
    flowPulseCount = 0;
    interrupts();

    float flowRateLpm = (pulses / 7.5) / 3.0; // 3-second window
    totalLiters += (pulses / 450.0);

    float tankLevel = measureTankPercent();

    StaticJsonDocument<384> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["tankLevelPercent"] = round(tankLevel * 10.0) / 10.0;
    m["flowRateLpm"]      = round(flowRateLpm * 10.0) / 10.0;
    m["totalVolumeLiters"]= round(totalLiters * 10.0) / 10.0;
    m["leakDetected"]     = leakDetected;
    m["pumpState"]        = pumpState;

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

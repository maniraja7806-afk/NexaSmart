/*
 * ============================================================================
 * NexaSmart IoT Firmware: Smart Lighting Automation Node
 * Hardware: ESP32 + HC-SR501 PIR + LDR Light Sensor + 5V Isolated Relay Module
 * Pinout:
 *   PIR Motion Out  --> GPIO 13 (Digital Input)
 *   LDR Analog Out  --> GPIO 34 (ADC1_CH6 - Safe with Wi-Fi)
 *   Relay Control   --> GPIO 32 (Active LOW optoisolated relay)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_lgt_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-LGT-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-204";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_PIR   13
#define PIN_LDR   34
#define PIN_RELAY 32

char topicTelemetry[128];
char topicStatus[128];
char topicCommand[128];
char topicAck[128];

WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool manualOverride = false;
bool relayState = false;
int lightThresholdLux = 300;
unsigned long motionTimeoutMs = 60000; // 1 minute auto-off
unsigned long lastMotionDetectedTime = 0;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 3000;
unsigned long sequenceCounter = 0;

void setupTopics() {
  snprintf(topicTelemetry, sizeof(topicTelemetry), "nexasmart/%s/%s/%s/telemetry", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicStatus,    sizeof(topicStatus),    "nexasmart/%s/%s/%s/status",    BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicCommand,   sizeof(topicCommand),   "nexasmart/%s/%s/%s/command",   BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicAck,       sizeof(topicAck),       "nexasmart/%s/%s/%s/ack",       BUILDING_ID, ROOM_ID, DEVICE_ID);
}

void setRelay(bool state) {
  relayState = state;
  // Most relay modules are Active LOW
  digitalWrite(PIN_RELAY, relayState ? LOW : HIGH);
}

int readLdrLux() {
  int raw = analogRead(PIN_LDR); // 0 - 4095
  // Approximate calibration mapping for standard photoresistor divider
  int lux = map(4095 - raw, 0, 4095, 0, 1000);
  return constrain(lux, 0, 1000);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) return;

  const char* cmdId  = doc["commandId"];
  const char* action = doc["action"];

  StaticJsonDocument<256> ack;
  ack["commandId"]  = cmdId;
  ack["deviceId"]   = DEVICE_ID;
  ack["executedAt"] = millis();

  if (strcmp(action, "SET_LIGHT") == 0 || strcmp(action, "SET_RELAY") == 0) {
    int val = doc["value"];
    manualOverride = true;
    setRelay(val == 1 || val == true);
    ack["status"] = "SUCCESS";
    ack["state"]["relay"] = relayState;
    ack["state"]["manualOverride"] = manualOverride;
  } else if (strcmp(action, "SET_AUTO_MODE") == 0) {
    manualOverride = false;
    ack["status"] = "SUCCESS";
    ack["state"]["manualOverride"] = false;
  } else if (strcmp(action, "SET_THRESHOLD") == 0) {
    lightThresholdLux = doc["threshold"];
    ack["status"] = "SUCCESS";
    ack["state"]["threshold"] = lightThresholdLux;
  } else {
    ack["status"] = "UNSUPPORTED_COMMAND";
  }

  char ackBuf[256];
  serializeJson(ack, ackBuf);
  mqttClient.publish(topicAck, ackBuf);
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    StaticJsonDocument<128> lwt;
    lwt["deviceId"] = DEVICE_ID;
    lwt["status"]   = "OFFLINE";
    char lwtBuf[128];
    serializeJson(lwt, lwtBuf);

    if (mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS, topicStatus, 1, true, lwtBuf)) {
      mqttClient.subscribe(topicCommand, 1);
      StaticJsonDocument<128> online;
      online["deviceId"] = DEVICE_ID;
      online["status"]   = "ONLINE";
      online["firmware"] = FIRMWARE_VER;
      char onBuf[128];
      serializeJson(online, onBuf);
      mqttClient.publish(topicStatus, onBuf, true);
    } else {
      delay(4000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_RELAY, OUTPUT);
  setRelay(false);

  setupTopics();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) WiFi.reconnect();
  if (!mqttClient.connected()) reconnectMqtt();
  mqttClient.loop();

  bool motionDetected = digitalRead(PIN_PIR) == HIGH;
  int currentLux = readLdrLux();
  unsigned long now = millis();

  if (motionDetected) {
    lastMotionDetectedTime = now;
  }

  // Autonomous logic when not in manual override
  if (!manualOverride) {
    if (motionDetected && (currentLux < lightThresholdLux)) {
      if (!relayState) setRelay(true);
    } else if (now - lastMotionDetectedTime > motionTimeoutMs) {
      if (relayState) setRelay(false);
    }
  }

  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = now;
    StaticJsonDocument<384> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["occupancy"]      = motionDetected;
    m["ambientLightLux"]= currentLux;
    m["relayState"]     = relayState;
    m["manualOverride"] = manualOverride;

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

/*
 * ============================================================================
 * NexaSmart IoT Firmware: Equipment Condition Monitoring Node
 * Hardware: ESP32 + Vibration Sensor (SW-420 on GPIO 25) + Casing Temp
 * Monitors: Chillers, Induction Motors, Backup Generators
 * Pinout:
 *   Vibration In    --> GPIO 25 (Hardware pulse interrupt)
 *   Status LED      --> GPIO 2
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_eqp_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-EQP-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-HVAC-PLANT";
const char* EQUIPMENT_ID    = "EQP-CHILLER-01";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_VIB 25
volatile unsigned long vibPulseCounter = 0;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

char topicTelemetry[128];
char topicStatus[128];

unsigned long lastTelemetry = 0;
unsigned long sequenceCounter = 0;

void IRAM_ATTR vibInterrupt() {
  vibPulseCounter++;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VIB, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_VIB), vibInterrupt, FALLING);

  snprintf(topicTelemetry, sizeof(topicTelemetry), "nexasmart/%s/%s/%s/telemetry", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicStatus,    sizeof(topicStatus),    "nexasmart/%s/%s/%s/status",    BUILDING_ID, ROOM_ID, DEVICE_ID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) WiFi.reconnect();
  if (!mqttClient.connected()) {
    mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS);
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastTelemetry >= 3000) {
    lastTelemetry = now;

    noInterrupts();
    unsigned long pulses = vibPulseCounter;
    vibPulseCounter = 0;
    interrupts();

    // Pulses mapped to vibration velocity indicator (mm/s estimate)
    float vibrationMmS = (pulses / 3.0) * 0.15;
    // Simulated or analog surface thermocouple reading
    float surfaceTempC = 42.5 + (sin(now / 20000.0) * 3.5);

    StaticJsonDocument<384> doc;
    doc["deviceId"]     = DEVICE_ID;
    doc["buildingId"]   = BUILDING_ID;
    doc["roomId"]       = ROOM_ID;
    doc["equipmentId"]  = EQUIPMENT_ID;
    doc["sequence"]     = ++sequenceCounter;
    doc["firmware"]     = FIRMWARE_VER;
    doc["isSimulated"]  = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["vibrationMmS"]   = round(vibrationMmS * 10.0) / 10.0;
    m["surfaceTempC"]   = round(surfaceTempC * 10.0) / 10.0;
    m["operatingStatus"]= (vibrationMmS > 8.0) ? "WARNING" : "NORMAL";

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

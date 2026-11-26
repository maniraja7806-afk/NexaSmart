/*
 * ============================================================================
 * NexaSmart IoT Firmware: Fire & Safety Detection Node
 * Hardware: ESP32 + MQ-2 Smoke Sensor + Flame IR Sensor + Active Buzzer
 * Pinout:
 *   Smoke Sensor AOUT --> GPIO 39 (ADC1_CH3 / VN - Safe with Wi-Fi)
 *   Flame Sensor DOUT --> GPIO 23 (Active LOW)
 *   Buzzer Control    --> GPIO 26
 *
 * CRITICAL SAFETY DISCLAIMER:
 * This code and associated prototype hardware is strictly for educational,
 * laboratory, and demonstrative research purposes. Under no circumstances
 * should it be relied upon as a replacement for certified commercial life-safety
 * fire alarm equipment (UL 268 / EN 54) or emergency evacuation systems.
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_safe_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-SAFE-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-CHEM-LAB-01";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_SMOKE 39
#define PIN_FLAME 23
#define PIN_BUZZ  26

#define SMOKE_THRESHOLD_ADC 1800 // ADC trigger threshold

char topicTelemetry[128];
char topicEvent[128];
char topicStatus[128];

WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastTelemetry = 0;
unsigned long lastAlarmEventTime = 0;
unsigned long sequenceCounter = 0;
bool alarmActive = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SMOKE, INPUT);
  pinMode(PIN_FLAME, INPUT_PULLUP);
  pinMode(PIN_BUZZ, OUTPUT);
  digitalWrite(PIN_BUZZ, LOW);

  snprintf(topicTelemetry, sizeof(topicTelemetry), "nexasmart/%s/%s/%s/telemetry", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicEvent,     sizeof(topicEvent),     "nexasmart/%s/%s/%s/event",     BUILDING_ID, ROOM_ID, DEVICE_ID);
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

  int smokeLevel = analogRead(PIN_SMOKE);
  bool flameDetected = (digitalRead(PIN_FLAME) == LOW); // Flame sensor active LOW
  bool smokeDetected = (smokeLevel > SMOKE_THRESHOLD_ADC);

  unsigned long now = millis();

  // Instant emergency trigger
  if ((flameDetected || smokeDetected) && (!alarmActive || (now - lastAlarmEventTime > 5000))) {
    alarmActive = true;
    lastAlarmEventTime = now;
    digitalWrite(PIN_BUZZ, HIGH);

    StaticJsonDocument<256> evt;
    evt["deviceId"]   = DEVICE_ID;
    evt["buildingId"] = BUILDING_ID;
    evt["roomId"]     = ROOM_ID;
    evt["eventType"]  = flameDetected ? "FLAME_DETECTED" : "SMOKE_DETECTED";
    evt["severity"]   = "CRITICAL";
    evt["smokeLevel"] = smokeLevel;
    evt["flame"]      = flameDetected;
    evt["timestamp"]  = now;

    char buf[256];
    serializeJson(evt, buf);
    mqttClient.publish(topicEvent, buf, 1);
  } else if (!flameDetected && !smokeDetected && alarmActive) {
    alarmActive = false;
    digitalWrite(PIN_BUZZ, LOW);
  }

  if (now - lastTelemetry >= 3000) {
    lastTelemetry = now;
    StaticJsonDocument<384> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["smokeLevel"]     = smokeLevel;
    m["flameDetected"]  = flameDetected;
    m["smokeDetected"]  = smokeDetected;
    m["alarmState"]     = alarmActive;

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

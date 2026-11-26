/*
 * ============================================================================
 * NexaSmart IoT Firmware: Smart Parking Bay Detection Node
 * Hardware: ESP32 + HC-SR04P Ultrasonic Sensor + Dual LED (Red/Green)
 * Pinout:
 *   Trig Pin       --> GPIO 5
 *   Echo Pin       --> GPIO 18
 *   Green LED      --> GPIO 14 (Available)
 *   Red LED        --> GPIO 27 (Occupied)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_prk_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-PRK-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "LOT-A";
const char* SLOT_NUMBER     = "A-101";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_TRIG 5
#define PIN_ECHO 18
#define LED_GRN  14
#define LED_RED  27

char topicTelemetry[128];
char topicStatus[128];

WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool isOccupied = false;
unsigned long lastTelemetry = 0;
unsigned long sequenceCounter = 0;

float measureDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 25000); // 25ms
  if (duration == 0) return 999.0;
  return (duration * 0.0343) / 2.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(LED_GRN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  digitalWrite(LED_GRN, HIGH);
  digitalWrite(LED_RED, LOW);

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

  float distance = measureDistanceCm();
  // Threshold: vehicle present if distance < 120 cm
  bool occupiedNow = (distance > 5.0 && distance < 120.0);

  if (occupiedNow != isOccupied) {
    isOccupied = occupiedNow;
    digitalWrite(LED_RED, isOccupied ? HIGH : LOW);
    digitalWrite(LED_GRN, isOccupied ? LOW : HIGH);
    lastTelemetry = 0; // Force immediate broadcast on change
  }

  unsigned long now = millis();
  if (now - lastTelemetry >= 4000) {
    lastTelemetry = now;
    StaticJsonDocument<256> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["slotNumber"]  = SLOT_NUMBER;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["status"]      = isOccupied ? "Occupied" : "Available";
    m["distanceCm"]  = round(distance * 10.0) / 10.0;

    char buf[256];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

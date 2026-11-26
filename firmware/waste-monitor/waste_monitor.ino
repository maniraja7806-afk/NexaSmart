/*
 * ============================================================================
 * NexaSmart IoT Firmware: Smart Waste Bin Monitoring Node
 * Hardware: ESP32 + HC-SR04P Ultrasonic Sensor mounted on bin lid
 * Pinout:
 *   Trig Pin       --> GPIO 5
 *   Echo Pin       --> GPIO 18
 *   Alert LED      --> GPIO 2
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_wst_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-WST-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "CORRIDOR-2F";
const char* BIN_ID          = "BIN-201";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_TRIG 5
#define PIN_ECHO 18
#define LED_PIN  2

const float BIN_DEPTH_CM = 100.0; // 1-meter tall waste bin
const float FILL_ALERT_THRESHOLD = 85.0; // 85% full

WiFiClient espClient;
PubSubClient mqttClient(espClient);

char topicTelemetry[128];
char topicStatus[128];
unsigned long lastTelemetry = 0;
unsigned long sequenceCounter = 0;

float measureDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return BIN_DEPTH_CM;
  return (duration * 0.0343) / 2.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(LED_PIN, OUTPUT);

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
  if (now - lastTelemetry >= 5000) {
    lastTelemetry = now;

    float distance = measureDistanceCm();
    float fillHeight = constrain(BIN_DEPTH_CM - distance, 0.0, BIN_DEPTH_CM);
    float fillPercent = (fillHeight / BIN_DEPTH_CM) * 100.0;
    bool needsCollection = (fillPercent >= FILL_ALERT_THRESHOLD);

    digitalWrite(LED_PIN, needsCollection ? HIGH : LOW);

    StaticJsonDocument<384> doc;
    doc["deviceId"]        = DEVICE_ID;
    doc["buildingId"]      = BUILDING_ID;
    doc["roomId"]          = ROOM_ID;
    doc["binId"]           = BIN_ID;
    doc["sequence"]        = ++sequenceCounter;
    doc["firmware"]        = FIRMWARE_VER;
    doc["isSimulated"]     = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["fillLevelPercent"] = round(fillPercent * 10.0) / 10.0;
    m["needsCollection"]  = needsCollection;
    m["distanceCm"]       = round(distance * 10.0) / 10.0;

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

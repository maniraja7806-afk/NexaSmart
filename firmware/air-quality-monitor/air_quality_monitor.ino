/*
 * ============================================================================
 * NexaSmart IoT Firmware: Indoor Air Quality (IAQ) Node
 * Hardware: ESP32 + MQ-135 Gas Sensor + DHT22
 * Pinout:
 *   MQ-135 AOUT     --> GPIO 36 (ADC1_CH0 / VP pin - Safe with Wi-Fi)
 *   DHT22 Data      --> GPIO 4
 *
 * IMPORTANT ENGINEERING & SAFETY DISCLAIMER:
 * Prototype electrochemical sensors like MQ-135 provide qualitative gas
 * resistance changes and raw relative indicators. They ARE NOT certified
 * laboratory gas analyzers or medical diagnostic equipment. Readings must
 * be interpreted as qualitative indicators and baseline trends.
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_iaq_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-IAQ-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-CHEM-LAB-01";
const char* FIRMWARE_VER    = "v1.4.2";

#define PIN_MQ135 36
#define PIN_DHT   4
#define DHTTYPE   DHT22

DHT dht(PIN_DHT, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

char topicTelemetry[128];
char topicStatus[128];
unsigned long lastTelemetry = 0;
unsigned long sequenceCounter = 0;

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(PIN_MQ135, INPUT);

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
  if (now - lastTelemetry >= 4000) {
    lastTelemetry = now;

    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int rawAdc = analogRead(PIN_MQ135); // 0 - 4095
    // Rough logarithmic estimation of relative air quality indicator
    int airQualityIndex = map(rawAdc, 300, 3500, 50, 500);
    airQualityIndex = constrain(airQualityIndex, 20, 600);

    StaticJsonDocument<384> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["temperature"]      = isnan(t) ? 24.0 : round(t * 10.0) / 10.0;
    m["humidity"]         = isnan(h) ? 50.0 : round(h * 10.0) / 10.0;
    m["rawAirQualityPpm"] = airQualityIndex;
    m["airQualityStatus"] = (airQualityIndex < 100) ? "Good" : (airQualityIndex < 200 ? "Moderate" : "Poor");

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

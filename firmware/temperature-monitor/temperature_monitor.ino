/*
 * ============================================================================
 * NexaSmart IoT Firmware: Environmental & Temperature/Humidity Monitor
 * Hardware: ESP32 + DHT22 (AM2302) Sensor
 * Pinout:
 *   DHT22 Data Pin  --> GPIO 4 (Requires 4.7k pull-up resistor to 3.3V)
 *   Status LED      --> GPIO 2 (Built-in Blue LED for network heartbeat)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Wi-Fi & MQTT Credentials
const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100"; // Or Mosquitto IP / FQDN
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_env_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

// Identification & Hierarchy
const char* DEVICE_ID       = "DEV-ESP32-ENV-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-204";
const char* FIRMWARE_VER    = "v1.4.2";

// MQTT Topics
char topicTelemetry[128];
char topicStatus[128];
char topicCommand[128];
char topicAck[128];

// Sensor Configuration
#define DHTPIN 4
#define DHTTYPE DHT22
#define LED_PIN 2

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 5000; // 5 seconds non-blocking
unsigned long sequenceCounter = 0;

void setupTopics() {
  snprintf(topicTelemetry, sizeof(topicTelemetry), "nexasmart/%s/%s/%s/telemetry", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicStatus,    sizeof(topicStatus),    "nexasmart/%s/%s/%s/status",    BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicCommand,   sizeof(topicCommand),   "nexasmart/%s/%s/%s/command",   BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicAck,       sizeof(topicAck),       "nexasmart/%s/%s/%s/ack",       BUILDING_ID, ROOM_ID, DEVICE_ID);
}

void setupWiFi() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  digitalWrite(LED_PIN, HIGH);
  Serial.println("\nWiFi connected! IP Address: ");
  Serial.println(WiFi.localIP());
}

void publishStatus(const char* state) {
  StaticJsonDocument<256> doc;
  doc["deviceId"]      = DEVICE_ID;
  doc["status"]        = state;
  doc["ip"]            = WiFi.localIP().toString();
  doc["mac"]           = WiFi.macAddress();
  doc["rssi"]          = WiFi.RSSI();
  doc["uptimeSeconds"] = millis() / 1000;
  doc["firmware"]      = FIRMWARE_VER;
  doc["isSimulated"]   = false;

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(topicStatus, buffer, true); // Retained
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("Command received on topic: ");
  Serial.println(topic);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.println("Failed to parse command JSON");
    return;
  }

  const char* cmdId  = doc["commandId"];
  const char* action = doc["action"];

  StaticJsonDocument<256> ackDoc;
  ackDoc["commandId"]  = cmdId;
  ackDoc["deviceId"]   = DEVICE_ID;
  ackDoc["executedAt"] = millis();

  if (strcmp(action, "PING") == 0) {
    ackDoc["status"] = "SUCCESS";
    ackDoc["data"]["rssi"] = WiFi.RSSI();
  } else if (strcmp(action, "REBOOT") == 0) {
    ackDoc["status"] = "SUCCESS";
    char ackBuf[256];
    serializeJson(ackDoc, ackBuf);
    mqttClient.publish(topicAck, ackBuf);
    delay(500);
    ESP.restart();
    return;
  } else {
    ackDoc["status"] = "UNSUPPORTED_COMMAND";
  }

  char ackBuf[256];
  serializeJson(ackDoc, ackBuf);
  mqttClient.publish(topicAck, ackBuf);
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Setup Last Will and Testament (LWT)
    StaticJsonDocument<128> lwtDoc;
    lwtDoc["deviceId"] = DEVICE_ID;
    lwtDoc["status"]   = "OFFLINE";
    char lwtBuffer[128];
    serializeJson(lwtDoc, lwtBuffer);

    if (mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS, topicStatus, 1, true, lwtBuffer)) {
      Serial.println("connected!");
      publishStatus("ONLINE");
      mqttClient.subscribe(topicCommand, 1);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setupTopics();
  setupWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println("DHT sensor read failure!");
      return;
    }

    StaticJsonDocument<384> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject metrics = doc.createNestedObject("metrics");
    metrics["temperature"] = round(t * 10.0) / 10.0;
    metrics["humidity"]    = round(h * 10.0) / 10.0;

    char buffer[384];
    serializeJson(doc, buffer);
    mqttClient.publish(topicTelemetry, buffer);
    Serial.print("Published: ");
    Serial.println(buffer);
  }
}

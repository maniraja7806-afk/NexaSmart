/*
 * ============================================================================
 * NexaSmart IoT Firmware: Electrical Energy & Power Quality Node
 * Hardware: ESP32 + PZEM-004T v3.0 (AC Energy Monitor via Hardware UART2)
 * Pinout:
 *   PZEM TX  --> ESP32 GPIO 16 (RX2)
 *   PZEM RX  --> ESP32 GPIO 17 (TX2)
 *   PZEM 5V  --> 5V Rail
 *   PZEM GND --> Common Ground
 * Safety:
 *   Current transformer (CT) clipped around LIVE wire only.
 *   DO NOT touch high voltage terminals!
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_pwr_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-PWR-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-PANEL-01";
const char* FIRMWARE_VER    = "v1.4.2";

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

char topicTelemetry[128];
char topicStatus[128];
char topicCommand[128];
char topicAck[128];

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 2000; // 2 seconds
unsigned long sequenceCounter = 0;

void setupTopics() {
  snprintf(topicTelemetry, sizeof(topicTelemetry), "nexasmart/%s/%s/%s/telemetry", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicStatus,    sizeof(topicStatus),    "nexasmart/%s/%s/%s/status",    BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicCommand,   sizeof(topicCommand),   "nexasmart/%s/%s/%s/command",   BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicAck,       sizeof(topicAck),       "nexasmart/%s/%s/%s/ack",       BUILDING_ID, ROOM_ID, DEVICE_ID);
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

  if (strcmp(act, "RESET_ENERGY") == 0) {
    pzem.resetEnergy();
    ack["status"] = "SUCCESS";
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

  unsigned long now = millis();
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = now;

    float voltage   = pzem.voltage();
    float current   = pzem.current();
    float power     = pzem.power();
    float energy    = pzem.energy();
    float frequency = pzem.frequency();
    float pf        = pzem.pf();

    if (isnan(voltage)) {
      Serial.println("Error reading PZEM module");
      return;
    }

    StaticJsonDocument<384> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["buildingId"]  = BUILDING_ID;
    doc["roomId"]      = ROOM_ID;
    doc["sequence"]    = ++sequenceCounter;
    doc["firmware"]    = FIRMWARE_VER;
    doc["isSimulated"] = false;

    JsonObject m = doc.createNestedObject("metrics");
    m["voltage"]       = round(voltage * 10.0) / 10.0;
    m["current"]       = round(current * 100.0) / 100.0;
    m["activePowerKw"] = round((power / 1000.0) * 1000.0) / 1000.0;
    m["energyKwh"]     = round(energy * 100.0) / 100.0;
    m["frequency"]     = round(frequency * 10.0) / 10.0;
    m["powerFactor"]   = round(pf * 100.0) / 100.0;

    char buf[384];
    serializeJson(doc, buf);
    mqttClient.publish(topicTelemetry, buf);
  }
}

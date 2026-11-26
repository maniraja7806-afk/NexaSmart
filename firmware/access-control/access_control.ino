/*
 * ============================================================================
 * NexaSmart IoT Firmware: RFID Campus Access Control Node
 * Hardware: ESP32 + MFRC522 RFID Reader (SPI) + Solenoid Lock Relay + Buzzer
 * Pinout:
 *   RC522 SCK   --> GPIO 18
 *   RC522 MISO  --> GPIO 19
 *   RC522 MOSI  --> GPIO 23
 *   RC522 SS/SDA--> GPIO 21
 *   RC522 RST   --> GPIO 22
 *   Lock Relay  --> GPIO 32
 *   Buzzer Pin  --> GPIO 26
 * Note: RC522 operates strictly at 3.3V! Connecting to 5V will destroy the IC.
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

const char* WIFI_SSID       = "NexaSmart_IoT_WiFi";
const char* WIFI_PASSWORD   = "SecureCampusKey2026";
const char* MQTT_SERVER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "device_acc_01";
const char* MQTT_PASS       = "DeviceSecretKey2026";

const char* DEVICE_ID       = "DEV-ESP32-ACC-01";
const char* BUILDING_ID     = "BLD-ENG-01";
const char* ROOM_ID         = "RM-MAIN-ENTRANCE";
const char* FIRMWARE_VER    = "v1.4.2";

#define SS_PIN  21
#define RST_PIN 22
#define PIN_LOCK 32
#define PIN_BUZZER 26

MFRC522 rfid(SS_PIN, RST_PIN);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

char topicEvent[128];
char topicCommand[128];
char topicAck[128];
char topicStatus[128];

unsigned long unlockUntilTime = 0;

void beep(int ms) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(ms);
  digitalWrite(PIN_BUZZER, LOW);
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

  if (strcmp(act, "UNLOCK_DOOR") == 0) {
    int durationSec = doc.containsKey("durationSeconds") ? doc["durationSeconds"] : 5;
    digitalWrite(PIN_LOCK, LOW); // Active Low Unlock
    unlockUntilTime = millis() + (durationSec * 1000);
    beep(100);
    ack["status"] = "SUCCESS";
    ack["state"]["unlocked"] = true;
  } else {
    ack["status"] = "UNSUPPORTED_COMMAND";
  }

  char ackBuf[256];
  serializeJson(ack, ackBuf);
  mqttClient.publish(topicAck, ackBuf);
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(PIN_LOCK, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LOCK, HIGH); // Locked
  digitalWrite(PIN_BUZZER, LOW);

  snprintf(topicEvent,   sizeof(topicEvent),   "nexasmart/%s/%s/%s/event",   BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicCommand, sizeof(topicCommand), "nexasmart/%s/%s/%s/command", BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicAck,     sizeof(topicAck),     "nexasmart/%s/%s/%s/ack",     BUILDING_ID, ROOM_ID, DEVICE_ID);
  snprintf(topicStatus,  sizeof(topicStatus),  "nexasmart/%s/%s/%s/status",  BUILDING_ID, ROOM_ID, DEVICE_ID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) WiFi.reconnect();
  if (!mqttClient.connected()) {
    mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS);
    mqttClient.subscribe(topicCommand, 1);
  }
  mqttClient.loop();

  // Relock auto-timer
  if (unlockUntilTime > 0 && millis() > unlockUntilTime) {
    digitalWrite(PIN_LOCK, HIGH); // Locked
    unlockUntilTime = 0;
  }

  // Look for new RFID card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Format Card UID hex
  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i > 0) uidStr += ":";
    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  rfid.PICC_HaltA();

  beep(50); // Feedback beep

  StaticJsonDocument<256> evt;
  evt["deviceId"]   = DEVICE_ID;
  evt["buildingId"] = BUILDING_ID;
  evt["roomId"]     = ROOM_ID;
  evt["eventType"]  = "RFID_TAP";
  evt["cardUid"]    = uidStr;
  evt["timestamp"]  = millis();

  char buf[256];
  serializeJson(evt, buf);
  mqttClient.publish(topicEvent, buf, 1);
  Serial.print("RFID Tapped: ");
  Serial.println(uidStr);
}

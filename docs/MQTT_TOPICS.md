# NexaSmart – MQTT Topic Taxonomy & Payload Specification

## 1. Topic Hierarchy Pattern

All NexaSmart MQTT communication follows the standard hierarchical namespace:

```
nexasmart/{buildingId}/{roomId}/{deviceId}/{channel}
```

Where:
- `buildingId`: Unique alphanumeric identifier of the building (e.g. `BLD-ENG-01`).
- `roomId`: Unique alphanumeric identifier of the floor/room/zone (e.g. `RM-204` or `PARK-LOT-A`).
- `deviceId`: Unique physical or simulated device MAC / Serial string (e.g. `DEV-ESP32-PWR-01`).
- `channel`: One of `telemetry`, `status`, `command`, `ack`, or `event`.

---

## 2. Channels and Payloads

### 2.1 Telemetry (`/telemetry`)
Published by devices periodically with measured physical data.
- **Direction**: Device -> Broker -> Backend
- **QoS**: 1 (At least once)
- **Retain**: false

**Sample JSON Payload:**
```json
{
  "deviceId": "DEV-ESP32-ENV-01",
  "buildingId": "BLD-ENG-01",
  "roomId": "RM-204",
  "timestamp": "2026-11-18T15:40:00.000Z",
  "sequence": 14205,
  "firmware": "v1.4.2",
  "isSimulated": false,
  "metrics": {
    "temperature": 23.4,
    "humidity": 52.8,
    "occupancy": true,
    "ambientLightLux": 340,
    "rawAirQualityPpm": 182
  }
}
```

### 2.2 Device Status & Heartbeat (`/status`)
Published by devices upon boot, every 60s as keepalive, and via MQTT Last Will and Testament (LWT).
- **Direction**: Device -> Broker -> Backend
- **QoS**: 1
- **Retain**: true

**Sample JSON Payload:**
```json
{
  "deviceId": "DEV-ESP32-ENV-01",
  "status": "ONLINE",
  "ip": "192.168.1.120",
  "mac": "24:6F:28:B1:C2:A4",
  "rssi": -58,
  "uptimeSeconds": 86420,
  "freeHeapBytes": 184320,
  "timestamp": "2026-11-18T15:40:00.000Z"
}
```

### 2.3 Remote Commands (`/command`)
Published by backend to trigger physical device actuation.
- **Direction**: Backend -> Broker -> Device
- **QoS**: 1
- **Retain**: false

**Sample JSON Payload:**
```json
{
  "commandId": "cmd_7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "deviceId": "DEV-ESP32-LGT-01",
  "action": "SET_RELAY",
  "target": "RELAY_CH1",
  "value": 1,
  "issuedBy": "usr_facility_mgr_01",
  "issuedAt": "2026-11-18T15:40:02.100Z"
}
```

### 2.4 Command Acknowledgement (`/ack`)
Published by device immediately after verifying and completing command execution.
- **Direction**: Device -> Broker -> Backend
- **QoS**: 1
- **Retain**: false

**Sample JSON Payload:**
```json
{
  "commandId": "cmd_7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "deviceId": "DEV-ESP32-LGT-01",
  "status": "SUCCESS",
  "executedAt": "2026-11-18T15:40:02.340Z",
  "currentState": {
    "relay1": true
  },
  "errorMessage": null
}
```

### 2.5 Real-Time Critical Events (`/event`)
Published asynchronously when instantaneous safety or access thresholds trip (e.g. smoke detected, RFID tap, water leak contact).
- **Direction**: Device -> Broker -> Backend
- **QoS**: 1 or 2
- **Retain**: false

**Sample JSON Payload (RFID Tap):**
```json
{
  "deviceId": "DEV-ESP32-ACC-01",
  "eventType": "RFID_TAP",
  "severity": "INFO",
  "timestamp": "2026-11-18T15:40:05.112Z",
  "data": {
    "cardUid": "B4:F2:18:9A",
    "readerZone": "DOOR_ENTRY",
    "tamperDetected": false
  }
}
```

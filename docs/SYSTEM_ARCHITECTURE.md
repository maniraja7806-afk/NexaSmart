# NexaSmart – System Architecture & Design Specification

## 1. Executive Architecture Summary

NexaSmart is an enterprise-grade IoT-based smart campus and building management platform. It coordinates multi-tenant hierarchical spatial entities (Campus -> Buildings -> Floors -> Rooms/Zones) with physical IoT sensor telemetry, bidirectional device control, automation rules, alert dispatching, and analytics.

```
+-------------------------------------------------------------------------------+
|                             Physical IoT Layer                                |
|  [ESP32 Telemetry]   [PZEM-004T]   [DHT22]   [PIR/LDR]   [Ultrasonic/Flow]     |
|  [MQ-135 IAQ]        [Smoke/Flame] [RC522]   [Vibration] [Relay / Actuators] |
+-------------------------------------------------------------------------------+
                                      |
                         MQTT Protocol (TLS / MQTTS)
                                      v
+-------------------------------------------------------------------------------+
|                             Broker & Network Layer                            |
|       Eclipse Mosquitto (External) / Aedes MQTT Broker (Embedded Engine)      |
|               Topic Routing: nexasmart/{bldg}/{room}/{device}/#              |
+-------------------------------------------------------------------------------+
                                      |
                           Bidirectional TCP / QoS 1
                                      v
+-------------------------------------------------------------------------------+
|                            Backend Ingestion Layer                            |
|    - Node.js & TypeScript REST API (Express v4/v5)                            |
|    - MQTT Ingestion Service (Telemetry validator, Dedup, Sequence checks)     |
|    - Automation Rules Evaluation Engine (Real-time trigger execution)         |
|    - Device Status Tracker & Heartbeat Watchdog (Offline detection)           |
|    - Command Execution & Strict ACK Verification Manager                      |
|    - WebSocket (Socket.IO) Real-time Telemetry & Alert Broadcasts             |
+-------------------------------------------------------------------------------+
                 |                                              |
      Mongoose ODM (UTC, Indexed)                  Full-Duplex WS & REST API
                 v                                              v
+---------------------------------+            +--------------------------------+
|       Data Persistence Layer    |            |       Frontend Presentation    |
| - MongoDB Atlas / Local MongoDB |            | - React 18/19 + Vite + TS      |
| - Time-series Telemetry Tables  |            | - Tailwind CSS Design System   |
| - Relational Hierarchy & RBAC   |            | - Lucide + Framer + Recharts   |
| - Audit, Alerts, Work Orders    |            | - Strict Hardware vs Sim Badges|
+---------------------------------+            +--------------------------------+
```

---

## 2. Communication & Transport Pipeline

### 2.1 Sensor Telemetry Ingestion
1. Sensors sample real-world physical values according to their calibrated sampling windows (e.g. DHT22 every 5s, PZEM every 2s, PIR interrupts).
2. The ESP32 collects, packages, and signs the JSON payload with a sequence number and hardware timestamp.
3. The payload is published to `nexasmart/{buildingId}/{roomId}/{deviceId}/telemetry` with MQTT QoS 1.
4. The Backend MQTT subscriber validates payload schema via Zod, checks against sequence numbers to filter out duplicate network packets, updates device `lastSeenAt`, and dispatches the validated reading to:
   - MongoDB historical telemetry collection (indexed by `{ deviceId: 1, timestamp: -1 }`).
   - Active automation rules evaluator (in-memory condition matching).
   - Socket.IO cluster room `building:{buildingId}` and `device:{deviceId}` for sub-100ms UI reactivity.

### 2.2 Remote Device Control & Strict ACK Verification
1. Authorized user triggers an actuator action (e.g., turn relay off, open parking gate, toggle pump).
2. Backend checks RBAC authorization and device maintenance status. If device is in maintenance or user lacks permission, command is denied.
3. Backend generates a unique `commandId` (UUID v4), persists status `PENDING` in `DeviceCommand` collection.
4. Backend publishes command JSON to `nexasmart/{buildingId}/{roomId}/{deviceId}/command`.
5. Device receives command, verifies syntax, executes GPIO switch, and responds on `nexasmart/{buildingId}/{roomId}/{deviceId}/ack` with `{ commandId, status: "SUCCESS", executedAt, state }`.
6. Only upon receiving this ACK does the backend transition the command to `EXECUTED` and push the confirmed state to connected dashboards. If a timeout occurs (5 seconds), command is marked `TIMEOUT_FAILED`.

---

## 3. Security, Multi-Tenancy & RBAC

The system enforces 9 discrete user roles with granular permission matrices:
- **Super Admin**: Unrestricted system administration, global configs, user provisioning.
- **Campus Administrator**: Multi-building facility governance, reports, global alerts.
- **Facility Manager**: Daily building/equipment operations, automation tuning, manual overrides.
- **Security Officer**: Access control records, RFID enrollment, fire/intrusion alerts.
- **Maintenance Technician**: Work orders, physical fault resolutions, maintenance status toggle.
- **Energy Manager**: Peak power analytics, energy tariffs, consumption audits.
- **Water Manager**: Reservoir capacity, flow analytics, pump schedules, leak mitigation.
- **Department Administrator**: Local zone/classroom utilization and department telemetry.
- **Viewer**: Read-only observation of permitted telemetry without actuation rights.

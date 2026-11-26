# NexaSmart – Smart Campus and Building Management System

![NexaSmart Architecture](https://img.shields.io/badge/Platform-ESP32%20%7C%20Node.js%20%7C%20React-blue)
![License](https://img.shields.io/badge/License-MIT-emerald)
![MQTT](https://img.shields.io/badge/Protocol-MQTT%20QoS1%20%7C%20Socket.IO-indigo)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)

A complete, production-grade, full-stack IoT platform designed to connect multiple buildings, floors, rooms, and IoT physical sensor nodes to a centralized web application. The platform provides real-time sensor telemetry ingestion, bidirectional device command actuation with strict hardware acknowledgement verification, rule-based automation, full alert lifecycles, and role-based access control.

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [Main Features](#4-main-features)
5. [IoT Modules](#5-iot-modules)
6. [Hardware Components & Estimated Prototype Requirements](#6-hardware-components--estimated-prototype-requirements)
7. [Technology Stack](#7-technology-stack)
8. [System Architecture](#8-system-architecture)
9. [IoT Data Flow](#9-iot-data-flow)
10. [MQTT Topic Documentation](#10-mqtt-topic-documentation)
11. [Database Design](#11-database-design)
12. [API Documentation](#12-api-documentation)
13. [Hardware Wiring & Pin Mapping](#13-hardware-wiring--pin-mapping)
14. [ESP32 Firmware Setup](#14-esp32-firmware-setup)
15. [MQTT Broker Setup](#15-mqtt-broker-setup)
16. [MongoDB Atlas Setup](#16-mongodb-atlas-setup)
17. [Environment Variables](#17-environment-variables)
18. [Frontend Installation](#18-frontend-installation)
19. [Backend Installation](#19-backend-installation)
20. [Simulator Instructions](#20-simulator-instructions)
21. [Demo Accounts (9 RBAC Roles)](#21-demo-accounts-9-rbac-roles)
22. [Screenshots & UI Previews](#22-screenshots--ui-previews)
23. [Testing](#23-testing)
24. [Deployment](#24-deployment)
25. [Security Considerations](#25-security-considerations)
26. [Hardware Safety Notes](#26-hardware-safety-notes)
27. [Known Limitations](#27-known-limitations)
28. [Future Scope](#28-future-scope)
29. [Contribution Guidelines](#29-contribution-guidelines)
30. [License](#30-license)

---

## 1. Project Introduction

**NexaSmart** is an enterprise IoT platform built for universities, schools, commercial campuses, and smart buildings. It bridges embedded sensor hardware (ESP32 microcontrollers, current transformer modules, ultrasonic sensors, environmental air quality sensors, and optical flame probes) to a modern full-stack web application.

---

## 2. Problem Statement

Modern campus facilities suffer from fragmented, disconnected building management systems:
- Electricity and water meters are read manually or siloed in proprietary vendor software.
- Classrooms remain air-conditioned and illuminated when unoccupied, driving up carbon emissions and electrical costs.
- Facility managers lack unified real-time visibility across physical buildings, leading to delayed responses to water leaks, chiller over-vibration, or dustbin overflows.
- Prototype dashboards often lack bidirectional control, fail to verify whether physical actuators actually completed an instruction, and lack multi-tenant governance.

---

## 3. Project Objectives

- **Hierarchical Governance:** Model campus spatial infrastructure down from Campus Zones &rarr; Buildings &rarr; Floors &rarr; Rooms & Actuator Nodes.
- **Real-Time Telemetry:** Stream telemetry via MQTT (QoS 1) and Socket.IO with sub-100ms UI reactivity.
- **Strict Command Acknowledgement:** Ensure a device command is only displayed as successful when the physical hardware returns a cryptographically valid acknowledgement payload (`/ack`).
- **Automation Engine:** Empower managers to set event-driven rules (e.g. PIR occupancy + LDR lux &rarr; Relay ON) with anti-flapping protection.
- **Role-Based Security:** Enforce 9 discrete RBAC roles, preventing unauthorized personnel and viewers from toggling relays or pumps.
- **Hardware Simulation:** Provide a built-in IoT simulator that uses the identical message pipeline as real ESP32s, allowing development, demonstration, and automated test execution.

---

## 4. Main Features

- **Multi-Building Spatial Navigator:** Interactive floor plan layouts with classroom occupancy indicators.
- **Live Device Directory:** Filterable by status (Online, Offline, Warning, Error, Maintenance) with distinction between physical hardware and simulated nodes.
- **Remote Actuation Console:** Web controls for relays, booster pumps, and lock solenoids with live timeout watchdog.
- **Dynamic Tariff & Cost Engine:** Computes real-time electrical power expenses ($/kWh) and water usage ($/L).
- **Incident & Alert Lifecycle:** Complete states (`New` &rarr; `Acknowledged` &rarr; `In Progress` &rarr; `Resolved` &rarr; `Closed`).
- **Preventative Work Orders:** Maintenance ticket generation, parts tracking, technician assignment, and cost reporting.

---

## 5. IoT Modules

1. **Device Management:** Full lifecycle registration, credential rotation, and maintenance status tracking.
2. **Smart Energy Management:** PZEM-004T live voltage, current, active power kW, kWh accumulation, power factor, and frequency.
3. **Smart Lighting Automation:** PIR occupancy + LDR ambient illumination autonomous switching with manual override.
4. **Smart Classroom Monitoring:** DHT22 temperature, humidity, and room utilization tracking.
5. **Indoor Air Quality (IAQ):** MQ-135 qualitative air quality index with calibration and medical disclaimers.
6. **Water Management:** Ultrasonic reservoir depth, YF-S201 flow meter, moisture leak detection, and pump interlocks.
7. **Fire and Safety:** MQ-2 smoke density, optical flame detection, siren alarms, and incident logging.
8. **Smart Parking:** Ultrasonic vehicle presence detection with real-time bay allocation (Available, Occupied, Reserved, Out of Service).
9. **RFID Access Control:** MFRC522 contactless badge events, zone clearance logs, and security denial alerts.
10. **Smart Waste Management:** Dustbin fill percentage monitoring with threshold collection requests.
11. **Equipment Condition Monitoring:** Industrial motor/chiller casing temperature and vibration velocity (mm/s).
12. **Alerts & Notifications:** Automatic threshold tripping across 10 categories with in-app notification dispatch.
13. **Automation Rules Engine:** Multi-condition threshold matching with execution audit trails.
14. **Maintenance Hub:** Preventive work orders, replacement parts tracking, and technician assignment.
15. **Reports & Analytics:** Filterable by date, building, and zone with instant CSV exports.

---

## 6. Hardware Components & Estimated Prototype Requirements

| Component | Function | Operating Voltage |
|---|---|---|
| **ESP32 NodeMCU / DevKit V1** | Core IoT Microcontroller (Wi-Fi + BLE) | 3.3V / 5V USB |
| **DHT22 (AM2302)** | High-accuracy temperature and humidity | 3.3V – 5V |
| **HC-SR501 / AM312** | Passive Infrared (PIR) motion detection | 3.3V – 5V |
| **LDR Photoresistor Module** | Ambient light illumination (Lux) | 3.3V (ADC1) |
| **PZEM-004T v3.0** | AC single-phase voltage, current, active power | 5V TTL / 230VAC CT |
| **HC-SR04P / RCWL-1601** | 3.3V tolerant ultrasonic distance sensor | 3.3V |
| **YF-S201 Water Flow Sensor** | Hall-effect liquid pulse accumulator | 5V |
| **Moisture Resistance Probe** | Liquid leak and spill detection | 3.3V (ADC1) |
| **MQ-135** | Qualitative air quality / gas resistance | 5V Heater / 3.3V ADC |
| **MQ-2** | Smoke, LPG, and flammable gas detection | 5V Heater / 3.3V ADC |
| **IR Flame Sensor** | Optical photodiode open-flame detection | 3.3V |
| **MFRC522** | 13.56MHz RFID Card / Keyfob Reader | 3.3V strictly (SPI) |
| **SW-420** | Mechanical vibration velocity / pulse sensor | 3.3V |
| **Optoisolated Relay Module** | 250VAC/10A rated actuator switch | 5V Coil / 3.3V Trigger |
| **Active Buzzer & LEDs** | Audible and visual alarm indicators | 3.3V |

---

## 7. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Framer Motion, Axios, Socket.IO Client.
- **Backend:** Node.js, Express.js, TypeScript, Mongoose ODM, Socket.IO, MQTT Client, Embedded Aedes Broker, JWT, bcryptjs, Zod.
- **Database:** MongoDB Atlas / Local MongoDB (with standby memory fallback).
- **Embedded IoT:** ESP32 C++ (Arduino IDE / PlatformIO), Eclipse Mosquitto, PubSubClient, ArduinoJson.

---

## 8. System Architecture

```
+-------------------------------------------------------------------------------+
|                             Physical IoT Layer                                |
|  [ESP32 Nodes]  [DHT22]  [PZEM-004T]  [PIR/LDR]  [Ultrasonic]  [Relay Module] |
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
|    - Telemetry Ingestion, Deduplication & Validation Pipeline                 |
|    - Automation Rules Evaluation Engine                                       |
|    - Strict Command Acknowledgement Manager                                   |
|    - Full-Duplex Socket.IO WebSocket Streaming Cluster                        |
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

## 9. IoT Data Flow

1. **Telemetry Sampling:** Sensors poll physical values every 2-5 seconds non-blocking.
2. **Packet Packaging:** ESP32 serializes JSON with deviceId, buildingCode, sequence counter, and UTC timestamp.
3. **MQTT Publication:** Published to `nexasmart/{buildingId}/{roomId}/{deviceId}/telemetry` with QoS 1.
4. **Backend Ingestion:** Backend validates payload via Zod, checks against sequence numbers to filter duplicate packets, updates device document, evaluates active automation rules, and stores historical time-series readings.
5. **WebSocket Push:** Broadcasts updates over Socket.IO to connected browser clients in sub-100ms.
6. **Actuator Execution & ACK:** Commands published to `.../command` remain `SENT` until the physical device executes the pin change and returns a verified JSON payload on `.../ack`.

---

## 10. MQTT Topic Documentation

Standard topic namespace:
```
nexasmart/{buildingId}/{roomId}/{deviceId}/{channel}
```

- **`.../telemetry`:** Device &rarr; Server. Periodic sensor metrics.
- **`.../status`:** Device &rarr; Server. Heartbeat keepalive and MQTT Last Will and Testament (LWT).
- **`.../command`:** Server &rarr; Device. Actuator instructions (`SET_RELAY`, `SET_PUMP`, `UNLOCK_DOOR`).
- **`.../ack`:** Device &rarr; Server. Command completion verification.
- **`.../event`:** Device &rarr; Server. Instant critical events (e.g. RFID badge tap or flame trigger).

---

## 11. Database Design

26+ Mongoose Schemas organized for high throughput:
- `User`, `Building`, `Floor`, `Room`, `Device`, `DeviceTelemetry`, `DeviceCommand`
- Specialized Readings: `EnergyReading`, `WaterReading`, `EnvironmentReading`, `ParkingSlot`, `AccessRecord`, `SafetyIncident`, `WasteBin`, `Equipment`
- Operations: `Alert`, `AutomationRule`, `AutomationExecution`, `MaintenanceRequest`, `Notification`, `AuditLog`.

---

## 12. API Documentation

Base URL: `/api/v1`

- `POST /auth/login` – Authenticate with email/password; returns JWT access & refresh tokens.
- `GET /buildings` – List campus buildings and floor hierarchies.
- `GET /devices` – Paginated list of registered nodes with filters (`type`, `status`, `isSimulated`).
- `POST /devices/:id/command` – Issue remote actuation command with mandatory ACK tracking.
- `GET /energy/live` – Real-time PZEM electrical metrics (V, I, kW, kWh, PF, Hz).
- `GET /lighting/status` & `PATCH /lighting/override` – Lighting relays and manual overrides.
- `GET /water/overview` & `POST /water/pump-control` – Reservoir level and pump commands.
- `GET /safety/incidents` & `POST /safety/incidents/:id/acknowledge` – Fire safety alarm acknowledgement.
- `GET /parking/slots` – Live parking bay grid.
- `GET /automation` & `POST /automation` – Automation rules and execution logs.
- `GET /alerts` & `PATCH /alerts/:id/status` – Alert center status advancement.
- `GET /reports` – Time-series aggregates and export.
- `POST /simulator/start|pause|reset|inject-fault` – IoT hardware simulator controls.

---

## 13. Hardware Wiring & Pin Mapping

Refer to the [Hardware Setup Documentation](docs/HARDWARE_SETUP.md) for schematic diagrams, pull-up resistor specifications, and ADC1 Wi-Fi conflict avoidance notes.

---

## 14. ESP32 Firmware Setup

Example compilable C++ Arduino/PlatformIO sketches are available in the `firmware/` directory:
- `firmware/temperature-monitor/` – DHT22 environmental monitoring.
- `firmware/smart-lighting/` – PIR + LDR autonomous relay lighting.
- `firmware/energy-monitor/` – PZEM-004T UART2 AC power metering.
- `firmware/water-monitor/` – Ultrasonic depth, water flow, and leak protection.
- `firmware/parking-monitor/` – Ultrasonic parking bay sensor.
- `firmware/access-control/` – MFRC522 SPI RFID badge reader.
- `firmware/equipment-monitor/` – SW-420 vibration & thermal condition monitoring.
- `firmware/air-quality-monitor/` – MQ-135 qualitative air quality index.
- `firmware/waste-monitor/` – Dustbin ultrasonic capacity monitor.
- `firmware/fire-safety-monitor/` – MQ-2 smoke and optical flame detector.

---

## 15. MQTT Broker Setup

NexaSmart supports both external Mosquitto instances and its built-in embedded Aedes broker:

### Using Docker Mosquitto:
```bash
docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 eclipse-mosquitto:2.0
```

### Using Built-In Broker:
Set `EMBEDDED_MQTT=true` in `.env`. The backend will automatically host an MQTT broker on TCP port 1883 with zero external configuration required.

---

## 16. MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist your IP address.
3. Obtain your connection URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/nexasmart?retryWrites=true&w=majority
   ```
4. Paste the URI into `backend/.env` under `MONGODB_URI`.

---

## 17. Environment Variables

Create `.env` in the project root or `backend/.env`:
```ini
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/nexasmart
JWT_SECRET=nexasmart_super_secret_jwt_key_development_2026_xyz
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=nexasmart_refresh_token_secret_key_development_2026_abc
JWT_REFRESH_EXPIRES_IN=30d
EMBEDDED_MQTT=true
MQTT_BROKER_PORT=1883
MQTT_BROKER_URL=mqtt://localhost:1883
ELECTRICITY_RATE_PER_KWH=0.15
WATER_RATE_PER_LITER=0.002
SIMULATOR_ENABLED=true
SIMULATOR_INTERVAL_MS=3000
```

---

## 18. Frontend Installation

```bash
cd frontend
npm install
npm run dev
```
Access the UI at `http://localhost:5173`.

---

## 19. Backend Installation

```bash
cd backend
npm install
npm run dev
```
API server starts on `http://localhost:5000/api/v1`.

To seed demo records and accounts:
```bash
cd backend
npx tsx src/scripts/seed.ts
```

---

## 20. Simulator Instructions

1. Start the backend with `npm run dev`. The simulator initializes automatically.
2. In the web dashboard header, use the **Simulator Widget** to Pause, Resume, or Reset baseline values.
3. Navigate to **System Settings** to inject incident scenarios:
   - *Inject Water Leak* &rarr; trips the mechanical leak sensor and tests pump lockout.
   - *Inject Fire Alarm* &rarr; trips the smoke sensor and triggers siren alarms.
   - *Inject Motor Vibration* &rarr; simulates high vibration (>8 mm/s) and auto-generates work orders.

---

## 21. Demo Accounts (9 RBAC Roles)

All demo accounts use password: `Password123!`

| Role | Email Address | Primary Responsibilities |
|---|---|---|
| **Super Admin** | `superadmin@nexasmart.io` | Unrestricted system governance, user provisioning |
| **Campus Administrator** | `campusadmin@nexasmart.io` | Spatial buildings, floor plans, global alerts |
| **Facility Manager** | `facility@nexasmart.io` | Building conditions, device controls, automation rules |
| **Security Officer** | `security@nexasmart.io` | RFID access logs, security incidents, safety alarms |
| **Maintenance Technician**| `technician@nexasmart.io` | Work orders, parts logs, maintenance status toggle |
| **Energy Manager** | `energy@nexasmart.io` | PZEM power analytics, tariffs, electrical audits |
| **Water Manager** | `water@nexasmart.io` | Reservoir depth, flow meters, pump controls |
| **Department Admin** | `department@nexasmart.io` | Classroom utilization and departmental telemetry |
| **Viewer** | `viewer@nexasmart.io` | Read-only observation (**Actuation Strictly Prohibited**) |

*Note: The login page includes a 1-click role switcher to instantly test any of these roles without typing credentials.*

---

## 22. Screenshots & UI Previews

- **Executive Operations Center:** Real-time KPI stat cards, active power demand curves, and live event dispatching.
- **Spatial Classroom Floor Plan:** Floor level toggles with status indicators (Occupied, Available, Maintenance, Warning).
- **Device Management Console:** Filterable device directory with real hardware vs simulated badges and remote command panels.
- **Smart Energy Dashboard:** AC voltage, current, active power kW, kWh accumulation, power factor, and cost estimation.
- **Water Management Console:** Visual reservoir depth column, leak detection alerts, and interlocked pump switches.

---

## 23. Testing

Run the automated Vitest test suite covering auth, RBAC permissions, command timeouts, and health endpoints:

```bash
cd backend
npm test
```

Test Results:
```
✓ tests/api.test.ts (5 tests)
Test Files  1 passed (1)
Tests       5 passed (5)
```

---

## 24. Deployment

### Using Docker Compose:
```bash
docker-compose up --build -d
```
Spins up:
- Mosquitto MQTT Broker on `1883`
- MongoDB on `27017`
- NexaSmart Node.js API on `5000`
- NexaSmart React UI on `80`

---

## 25. Security Considerations

- **Strict JWT Token Verification:** All REST endpoints and WebSocket handshakes require signed JWTs.
- **Role Enforcement at Backend:** Viewers attempting to POST `/devices/:id/command` are rejected with HTTP 403.
- **Credential Segregation:** MQTT passwords and database secrets are never exposed to the frontend.
- **Sanitized Inputs:** Request schemas validated using Zod.

---

## 26. Hardware Safety Notes

> [!WARNING]
> Measuring or switching 110V/230V AC mains electricity requires certified galvanic isolation, properly rated enclosures, flame-retardant terminal blocks, and qualified supervision. Never connect AC mains directly to breadboards.

> [!IMPORTANT]
> NexaSmart and prototype sensor modules are educational prototypes. They must never replace certified life-safety fire alarms (UL 268/EN 54) or certified emergency egress door release hardware.

---

## 27. Known Limitations

- Optical flame and MQ-2 smoke modules are sensitive to drafts and ambient lighting variations.
- Electrochemical gas sensors (MQ-135) require a 24-hour pre-heating burn-in period before raw resistance readings stabilize.
- ESP32 ADC2 channels are inoperable while Wi-Fi radio is active; all analog sensors must be connected strictly to ADC1 (GPIOs 32–39).

---

## 28. Future Scope

- Integration with LoRaWAN gateways for ultra-long-range campus sensor deployment.
- BACnet/IP and Modbus TCP bridging for legacy enterprise HVAC chillers.
- Automated generation of printable QR code asset tags for rapid technician maintenance scanning.

---

## 29. Contribution Guidelines

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/new-module`.
3. Verify all tests pass: `npm test`.
4. Ensure TypeScript compiles cleanly: `npx tsc --noEmit`.
5. Submit a pull request with a clear description of the IoT hardware or software changes.

---

## 30. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

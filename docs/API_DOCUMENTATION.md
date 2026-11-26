# NexaSmart – REST API Specification (`/api/v1`)

All endpoints are prefixed with `/api/v1`. Authentication is performed via `Authorization: Bearer <JWT_ACCESS_TOKEN>`.

## 1. Authentication & Identity (`/auth`)
- `POST /auth/login` – Authenticate with email/password; returns JWT access token, refresh token, user profile, role & permissions.
- `POST /auth/register` – Register new user account (Super Admin only or initial setup).
- `POST /auth/refresh` – Rotate and refresh expired access token using refresh token.
- `POST /auth/forgot-password` – Issue password reset token.
- `POST /auth/reset-password` – Reset password using validated reset token.
- `GET /auth/me` – Retrieve currently authenticated session identity.
- `POST /auth/logout` – Invalidate active session / refresh token.

## 2. Spatial Infrastructure
- `GET /buildings` – List buildings with filter & summary statistics.
- `POST /buildings` – Create building (Super Admin, Campus Admin).
- `GET /buildings/:id` – Retrieve building details, floor plans, total devices.
- `PATCH /buildings/:id` – Update building metadata.
- `DELETE /buildings/:id` – Archive/delete building.
- `GET /floors` – List floors by building.
- `POST /floors` – Create floor level.
- `GET /rooms` – List rooms by building/floor.
- `POST /rooms` – Create room or functional zone.

## 3. Device Management (`/devices`)
- `GET /devices` – Paginated list with filters (`buildingId`, `roomId`, `type`, `status`, `isSimulated`).
- `POST /devices` – Register physical or simulated device.
- `GET /devices/:id` – Retrieve device record, sensor config, live metrics, maintenance log.
- `PATCH /devices/:id` – Update device info, maintenance status, thresholds.
- `DELETE /devices/:id` – Decommission device.
- `POST /devices/:id/command` – Issue remote actuation command with synchronous/asynchronous ACK tracking.
- `POST /devices/:id/rotate-key` – Rotate device MQTT credentials.

## 4. Telemetry & Sensor Analytics
- `GET /telemetry/latest` – Current readings across all active nodes.
- `GET /telemetry/history` – Time-series range query (`deviceId`, `from`, `to`, `resolution`).
- `GET /energy/live` – Real-time electrical measurements (V, I, kW, kWh, PF, Hz).
- `GET /energy/analytics` – Aggregated energy consumption by building, floor, room.
- `GET /lighting/status` – Lighting state and occupancy overview.
- `PATCH /lighting/override` – Override lighting schedule / manual relay switch.
- `GET /environment/overview` – IAQ, temperature, humidity metrics across campus.
- `GET /water/overview` – Water tank levels, pump states, leak detection indicators.
- `POST /water/pump-control` – Turn water pump ON/OFF with safety checks.
- `GET /safety/incidents` – Fire and emergency alarm events with acknowledgment flow.
- `POST /safety/incidents/:id/acknowledge` – Acknowledge emergency event.
- `GET /parking/slots` – Live parking slot status (Available, Occupied, Reserved, Out of Service).
- `PATCH /parking/slots/:id` – Update parking slot state/reservation.
- `GET /access-control/records` – RFID tap history with granted/denied audit trail.
- `POST /access-control/cards` – Register and associate RFID badge with personnel.
- `GET /waste/bins` – Dustbin fill levels, high-capacity alerts.
- `GET /equipment/overview` – Industrial pumps/generators with temperature & vibration telemetry.

## 5. Automation, Alerts, Maintenance & Simulator
- `GET /automation` – List automation rules.
- `POST /automation` – Create rule (trigger, sensor, condition, threshold, action).
- `PATCH /automation/:id` – Toggle or modify rule.
- `GET /alerts` – Query active and historical alerts (`New`, `Acknowledged`, `Resolved`, etc.).
- `PATCH /alerts/:id/status` – Advance alert lifecycle.
- `GET /maintenance` – Work orders and preventative maintenance tickets.
- `POST /maintenance` – Generate maintenance request.
- `PATCH /maintenance/:id` – Assign technician, update parts/cost, close order.
- `GET /reports/export` – Export aggregated metrics to CSV/PDF format.
- `GET /simulator/status` – Simulator daemon state.
- `POST /simulator/start` – Start virtual device simulator.
- `POST /simulator/pause` – Pause simulator.
- `POST /simulator/reset` – Reset simulator to standard initial readings.
- `POST /simulator/inject-fault` – Inject abnormal sensor value (e.g. smoke leak or overheating motor).

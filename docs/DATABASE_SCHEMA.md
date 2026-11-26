# NexaSmart – Database Schema & Mongoose Data Models

The database models are structured for high-throughput time-series sensor ingestion, spatial hierarchy integrity, and comprehensive auditability.

```
       +-------------------+
       |     Building      |
       +---------+---------+
                 | 1:N
                 v
       +-------------------+
       |       Floor       |
       +---------+---------+
                 | 1:N
                 v
       +-------------------+
       |       Room        |
       +---------+---------+
                 | 1:N
                 v
       +-------------------+       1:N      +-----------------------+
       |      Device       +--------------->+    DeviceTelemetry    |
       +---------+---------+                +-----------------------+
                 | 1:N                                  |
                 v                                      v
       +-------------------+                +-----------------------+
       |   DeviceCommand   |                | Specialized Readings  |
       |  (Strict ACK log) |                | - EnergyReading       |
       +-------------------+                | - WaterReading        |
                                            | - EnvironmentReading  |
                                            | - OccupancyReading    |
                                            | - ParkingSlot         |
                                            | - WasteBin            |
                                            | - Equipment           |
                                            +-----------------------+
```

## Schema Entities Summary

1. **User**: Credentials (bcrypt), name, email, role (`Super Admin`, `Campus Administrator`, etc.), active state, lastLogin.
2. **Role & Permission**: Role definitions and granular resource access keys.
3. **Building**: Code, name, campus zone, total floors, coordinates, managerId.
4. **Floor**: BuildingId, floorNumber, floorName, floorPlanUrl.
5. **Room**: FloorId, buildingId, roomNumber, name, type (Classroom, Lab, Office, Plant Room, Parking).
6. **Device**: DeviceId (unique), buildingId, floorId, roomId, type, macAddress, ipAddress, firmwareVersion, status (`Online`, `Offline`, `Warning`, `Error`, `Maintenance`), isSimulated, lastSeenAt, maintenanceStatus, sensorConfig.
7. **DeviceCredential**: DeviceId, mqttUsername, passwordHash, clientCertificateFingerprint, tokenRotationDate.
8. **DeviceTelemetry**: DeviceId, buildingId, roomId, timestamp (UTC), sequence, rawPayload, indexed on `{ deviceId: 1, timestamp: -1 }`.
9. **DeviceCommand**: CommandId, deviceId, action, target, value, status (`PENDING`, `ACKNOWLEDGED`, `EXECUTED`, `FAILED`, `TIMEOUT`), issuedBy, issuedAt, executedAt, ackPayload.
10. **DeviceStatus**: Historical log of online/offline status changes and watchdog heartbeats.
11. **EnergyReading**: DeviceId, buildingId, roomId, voltage, current, activePowerKw, energyKwh, frequency, powerFactor, estimatedCost, timestamp.
12. **WaterReading**: DeviceId, tankLevelPercent, flowRateLpm, totalVolumeLiters, leakDetected, pumpState, timestamp.
13. **EnvironmentReading**: DeviceId, temperature, humidity, rawAirQualityPpm, lightLux, occupancyDetected, timestamp.
14. **OccupancyReading**: RoomId, occupied, headCountEstimate, timestamp.
15. **ParkingSlot**: SlotId, buildingId, floorId, slotNumber, slotType (Standard, EV, Accessible), status (`Available`, `Occupied`, `Reserved`, `OutOfService`), lastChangedAt.
16. **AccessRecord**: CardUid, userId, deviceId, zoneName, accessGranted, denialReason, timestamp.
17. **SafetyIncident**: IncidentId, buildingId, roomId, eventType (`SMOKE`, `FLAME`, `HIGH_TEMP`, `GAS`), severity (`WARNING`, `CRITICAL`), acknowledged, acknowledgedBy, acknowledgedAt, incidentNotes, timestamp.
18. **WasteBin**: BinId, buildingId, floorId, locationDesc, fillLevelPercent, thresholdPercent, needsCollection, lastEmptiedAt.
19. **Equipment**: EquipmentId, name, type (`PUMP`, `MOTOR`, `GENERATOR`, `HVAC`), buildingId, roomId, operatingStatus, temperature, vibrationMmS, lastServiceDate, nextServiceDue.
20. **Alert**: AlertId, deviceId, buildingId, roomId, category, severity, description, status (`New`, `Acknowledged`, `Assigned`, `In Progress`, `Resolved`, `Closed`), resolvedAt, resolvedBy.
21. **AutomationRule**: Name, buildingId, roomId, sensorType, condition (`GT`, `LT`, `EQ`, `BETWEEN`), threshold, action (`RELAY_ON`, `RELAY_OFF`, `NOTIFY`, `TRIGGER_BUZZER`), durationSeconds, schedule, isEnabled.
22. **AutomationExecution**: RuleId, triggeredAt, triggerReading, actionExecuted, executionSuccess.
23. **MaintenanceRequest**: RequestId, title, description, priority, status (`Open`, `Assigned`, `In Progress`, `Waiting for Parts`, `Completed`, `Cancelled`), assignedToUserId, buildingId, roomId, equipmentId, estimatedCost, actualCost.
24. **MaintenanceAssignment**: WorkOrderId, technicianId, assignedDate, notes.
25. **Notification**: RecipientUserId, title, message, category, isRead, createdAt.
26. **AuditLog**: UserId, userEmail, action, resource, resourceId, ipAddress, userAgent, details, timestamp.

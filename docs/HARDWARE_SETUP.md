# NexaSmart – Hardware Setup, Pin Mapping & Safety Guidelines

## 1. Safety & Engineering Protocols

> [!WARNING]
> **MAINS VOLTAGE SAFETY WARNING**
> Measuring or switching 110V/230V AC mains electricity requires certified galvanic isolation, properly rated enclosures, flame-retardant terminal blocks, and supervision by a licensed electrician.
> **DO NOT connect 230V AC mains wires directly to breadboards or exposed ESP32 GPIOs.**
> For energy monitoring, use current transformer (CT) clamps connected to a PZEM-004T module with optocoupled communication.
> For relay switching, use optoisolated relay modules rated at 250VAC/10A with flyback diodes and proper creepage distance on the PCB.

> [!IMPORTANT]
> **LIFE-SAFETY & EMERGENCY DISCLAIMER**
> NexaSmart and prototype sensor modules (MQ-2, MQ-135, generic flame sensors, and RC522 RFID) are designed for educational demonstrations, research, and non-critical facility monitoring.
> They **must never replace** certified life-safety fire alarm systems (e.g. UL 268 / EN 54), life-safety gas detectors, or certified access control / emergency egress hardware.

---

## 2. Sensor & Module Pin-Mapping Table

| Module / Sensor | Recommended Operating Voltage | ESP32 Interface Type | ESP32 Recommended GPIO | Signal Conditioning / Extra Components |
|---|---|---|---|---|
| **DHT22 (AM2302)** | 3.3V – 5.0V | Single-Wire Digital | `GPIO 4` | 4.7kΩ pull-up resistor between VCC and Data |
| **PIR Motion (HC-SR501 / AM312)** | 3.3V – 5.0V | Digital Input | `GPIO 13` | Set potentiometer for 3s trigger timeout |
| **LDR Light Sensor Module** | 3.3V | Analog Input (ADC1) | `GPIO 34` (ADC1_CH6) | Use ADC1 pins only when Wi-Fi is active! |
| **PZEM-004T v3.0 Energy Monitor** | 5V (Board) / Mains (CT) | Hardware UART2 | `GPIO 16` (RX2), `GPIO 17` (TX2) | Connect via optocoupled TTL UART |
| **Ultrasonic Distance (HC-SR04P / RCWL-1601)** | 3.3V | Digital Pulse (Echo/Trig)| Trig: `GPIO 5`, Echo: `GPIO 18` | Use 3.3V compatible sensor model (HC-SR04P) or voltage divider |
| **Water Leak Sensor** | 3.3V | Digital / Analog (ADC1) | `GPIO 35` (ADC1_CH7) | Gold-plated corrosion-resistant probe |
| **Water Flow Sensor (YF-S201)** | 5V | Hardware Interrupt | `GPIO 19` | 10kΩ pull-up; Hall-effect pulse counter |
| **MQ-135 Air Quality Sensor** | 5V (Heater), 3.3V (ADC) | Analog Input (ADC1) | `GPIO 36` (VP / ADC1_CH0) | Requires 24h burn-in; use voltage divider on AOUT if 5V |
| **MQ-2 Smoke Sensor** | 5V (Heater), 3.3V (ADC) | Analog / Digital | `GPIO 39` (VN / ADC1_CH3) | Dual threshold comparator (DO) or ADC (AO) |
| **Flame Sensor (IR photodiode)** | 3.3V | Digital / Analog | `GPIO 23` | Active LOW comparator output |
| **RC522 RFID Reader** | 3.3V | SPI Bus | SCK: `GPIO 18`, MISO: `GPIO 19`, MOSI: `GPIO 23`, SDA/SS: `GPIO 21`, RST: `GPIO 22` | Pure 3.3V logic; 5V will damage RC522 |
| **SW-420 Vibration Sensor** | 3.3V | Digital Interrupt | `GPIO 25` | Hardware debounce / Schmitt trigger |
| **Active Buzzer** | 3.3V | Digital Output | `GPIO 26` | NPN transistor (2N2222) driver with 1kΩ base resistor |
| **Status LEDs (RGB / Bi-color)** | 3.3V | Digital / PWM (LEDC) | Red: `GPIO 27`, Green: `GPIO 14`, Blue: `GPIO 12` | 220Ω series current-limiting resistors |
| **Relay Channel (Optoisolated)** | 5V (Coil) / 3.3V (Control)| Digital Output | `GPIO 32`, `GPIO 33` | Optoisolated low-level trigger relay board |
| **Servo Motor (SG90)** | 5V (Power) / 3.3V (PWM) | PWM Output (LEDC) | `GPIO 15` | External 5V 1A power rail with common GND |

---

## 3. Wi-Fi & ADC Notes for ESP32

1. **ADC2 Conflict with Wi-Fi:** When the ESP32 activates its Wi-Fi radio, `ADC2` (GPIOs 0, 2, 4, 12, 13, 14, 15, 25, 26, 27) cannot be used for analog reads. Therefore, all analog sensors (LDR, MQ-135, MQ-2, Water probe) are pinned strictly to `ADC1` (`GPIO 32` - `GPIO 39`).
2. **Bootstrapping Pins:** Avoid pulling `GPIO 0`, `GPIO 2`, or `GPIO 15` to unexpected levels during boot, as these determine the ESP32 boot mode.

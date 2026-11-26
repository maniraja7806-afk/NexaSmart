import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, ShieldAlert, Zap, Network, Radio } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white py-12 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Platform Overview
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          NexaSmart – System Architecture & Engineering Specifications
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-3xl">
          Complete hardware wiring diagrams, pin-mappings, MQTT telemetry schemas, electrical isolation rules, and educational prototype safety boundaries.
        </p>

        {/* Safety Warnings */}
        <div className="mt-8 space-y-4">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex gap-4">
            <Zap className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold text-amber-300 block text-sm mb-1">Mains Electricity Safety & Galvanic Isolation</span>
              Connecting 110V/230V AC mains electricity directly to breadboards or exposed ESP32 GPIOs is strictly hazardous and prohibited. Energy monitoring modules (such as PZEM-004T) must use current transformer (CT) clamps and optoisolated TTL UART lines. Relays controlling AC loads must have rated optocouplers and creepage slots.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-4">
            <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200/90 leading-relaxed">
              <span className="font-bold text-rose-300 block text-sm mb-1">Prototype Life-Safety & Fire Alarm Disclaimer</span>
              NexaSmart, along with prototype MQ-135, MQ-2, flame sensors, and RC522 RFID readers, is developed for research, educational demonstrations, and building management telemetry. It does not replace statutory commercial fire detection systems (UL 268/EN 54) or emergency egress hardware.
            </div>
          </div>
        </div>

        {/* Pin Mapping Matrix */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">ESP32 Hardware Pin-Mapping Table</h2>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-700 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Sensor / Module</th>
                    <th className="px-4 py-3">Operating Voltage</th>
                    <th className="px-4 py-3">Interface Type</th>
                    <th className="px-4 py-3">Recommended GPIO</th>
                    <th className="px-4 py-3">Conditioning / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">DHT22 Temp & Humidity</td>
                    <td className="px-4 py-3">3.3V – 5V</td>
                    <td className="px-4 py-3">Single-Wire Digital</td>
                    <td className="px-4 py-3 font-mono text-blue-400">GPIO 4</td>
                    <td className="px-4 py-3">4.7kΩ pull-up to 3.3V</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">HC-SR501 PIR Motion</td>
                    <td className="px-4 py-3">3.3V – 5V</td>
                    <td className="px-4 py-3">Digital Input</td>
                    <td className="px-4 py-3 font-mono text-blue-400">GPIO 13</td>
                    <td className="px-4 py-3">3s pulse timeout setting</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">LDR Light Sensor</td>
                    <td className="px-4 py-3">3.3V</td>
                    <td className="px-4 py-3">Analog Input</td>
                    <td className="px-4 py-3 font-mono text-blue-400">GPIO 34 (ADC1)</td>
                    <td className="px-4 py-3">Safe with Wi-Fi on ADC1</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">PZEM-004T Energy Meter</td>
                    <td className="px-4 py-3">5V (Logic) / 230V (CT)</td>
                    <td className="px-4 py-3">UART2 (TTL)</td>
                    <td className="px-4 py-3 font-mono text-blue-400">RX2: 16, TX2: 17</td>
                    <td className="px-4 py-3">Optocoupled serial isolation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Ultrasonic HC-SR04P</td>
                    <td className="px-4 py-3">3.3V</td>
                    <td className="px-4 py-3">Pulse Timing</td>
                    <td className="px-4 py-3 font-mono text-blue-400">Trig: 5, Echo: 18</td>
                    <td className="px-4 py-3">Use 3.3V version to avoid GPIO damage</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">YF-S201 Water Flow</td>
                    <td className="px-4 py-3">5V</td>
                    <td className="px-4 py-3">Hardware Interrupt</td>
                    <td className="px-4 py-3 font-mono text-blue-400">GPIO 19</td>
                    <td className="px-4 py-3">Hall effect pulse accumulator</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">RC522 RFID Reader</td>
                    <td className="px-4 py-3">3.3V Only!</td>
                    <td className="px-4 py-3">SPI Bus</td>
                    <td className="px-4 py-3 font-mono text-blue-400">SCK: 18, MISO: 19, MOSI: 23, SS: 21, RST: 22</td>
                    <td className="px-4 py-3">Never connect to 5V power</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Optoisolated Relay Module</td>
                    <td className="px-4 py-3">5V Coil / 3.3V Logic</td>
                    <td className="px-4 py-3">Active LOW Output</td>
                    <td className="px-4 py-3 font-mono text-blue-400">GPIO 32, GPIO 33</td>
                    <td className="px-4 py-3">Transistor driver & flyback diode</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MQTT Topics */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Network className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">MQTT Topic Taxonomy & Payloads</h2>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-xs text-slate-300 space-y-4">
            <p>Topics adhere to the standard hierarchy: <code className="text-blue-300 font-mono">nexasmart/&#123;buildingId&#125;/&#123;roomId&#125;/&#123;deviceId&#125;/&#123;channel&#125;</code></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="font-mono text-cyan-400 font-bold block mb-1">.../telemetry</span>
                Periodic JSON payload with sequence, UTC timestamp, firmware version, and sensor metrics.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="font-mono text-cyan-400 font-bold block mb-1">.../command</span>
                Backend-issued actuator target, value, and UUID commandId.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="font-mono text-cyan-400 font-bold block mb-1">.../ack</span>
                Mandatory device execution confirmation. Commands remain pending until ACK arrives.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="font-mono text-cyan-400 font-bold block mb-1">.../status</span>
                Retained keepalive heartbeat and MQTT Last Will and Testament (LWT) for offline detection.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Zap,
  Activity,
  Droplets,
  ShieldAlert,
  ArrowRight,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800 px-6 lg:px-12 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            N
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">NexaSmart</span>
            <span className="block text-[10px] text-blue-400 font-mono tracking-wider uppercase font-semibold">
              IoT Campus Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/about"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block"
          >
            Hardware Specs
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all border border-slate-700"
          >
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            Open Console
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <Radio className="h-3.5 w-3.5 animate-pulse text-blue-400" />
          Real-Time MQTT Telemetry & ESP32 Embedded Architecture
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Next-Generation Smart Campus & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Building Management</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Connect physical ESP32 nodes, PZEM energy meters, environmental IAQ arrays, ultrasonic reservoirs, and RFID access gates to a centralized telemetry engine with strict command acknowledgements and 9-role RBAC governance.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            Launch Live Operations Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            Role-Based Demo Access
          </Link>
        </div>
      </section>

      {/* Modules Feature Grid */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 text-center mb-3">
          15 Production-Grade IoT Modules
        </h2>
        <p className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
          Modular, Extensible Physical Computing Pipeline
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Smart Energy & PZEM-004T',
              desc: 'Continuous RMS AC voltage, current, active power kW, kWh accumulation, power factor, and configured tariff cost estimation.',
            },
            {
              icon: Activity,
              title: 'Smart Lighting & PIR/LDR',
              desc: 'Autonomous ambient illumination and motion detection with relay control, scheduling, and manual web overrides.',
            },
            {
              icon: Droplets,
              title: 'Water & Leak Protection',
              desc: 'Ultrasonic reservoir depth calculation, YF-S201 flow meter, moisture leak detection, and interlocked pump relay.',
            },
            {
              icon: ShieldAlert,
              title: 'Fire & Safety Node',
              desc: 'MQ-2 smoke and flame IR detection, high temperature monitoring, emergency acknowledgement workflows, and siren output.',
            },
            {
              icon: Building2,
              title: 'Multi-Building Hierarchy',
              desc: 'Spatial mapping across campus zones, multi-floor levels, classrooms, laboratories, and mechanical utility rooms.',
            },
            {
              icon: Sliders,
              title: 'Automation & Rule Engine',
              desc: 'Configurable multi-condition thresholds triggering physical actuators with execution audit trails and anti-flapping.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl hover:border-blue-500/40 transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800 text-center">
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700 rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Dual Hardware & Simulator Support
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl mx-auto">
            Test against physical ESP32 microcontrollers over Wi-Fi and Mosquitto, or activate the built-in software simulator to generate realistic sensor oscillations and inject fault scenarios.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Strict Command ACKs</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 9 Enterprise RBAC Roles</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Socket.IO Sub-100ms Feeds</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Hardware Safety Interlocks</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>NexaSmart – Enterprise IoT Campus and Building Management System &copy; 2026. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-slate-600">Educational IoT research prototype. Complies with electrical safety and hardware isolation standards.</p>
      </footer>
    </div>
  );
};

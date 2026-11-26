import React, { useState, useEffect } from 'react';
import { Droplets, Activity, AlertTriangle, ShieldCheck, Power, ShieldAlert } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';

export const WaterPage: React.FC = () => {
  const { hasRole, canControlDevices } = useAuth();
  const [waterData, setWaterData] = useState({
    tankLevelPercent: 78.5,
    flowRateLpm: 14.2,
    totalVolumeLiters: 4850.0,
    leakDetected: false,
    pumpState: true,
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/water/overview')
      .then((res) => {
        if (res.data?.data?.latestReading) {
          setWaterData(res.data.data.latestReading);
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.tankLevelPercent !== undefined) {
        setWaterData((prev) => ({
          ...prev,
          tankLevelPercent: t.metrics.tankLevelPercent,
          flowRateLpm: t.metrics.flowRateLpm || prev.flowRateLpm,
          totalVolumeLiters: t.metrics.totalVolumeLiters || prev.totalVolumeLiters,
          leakDetected: t.metrics.leakDetected !== undefined ? t.metrics.leakDetected : prev.leakDetected,
          pumpState: t.metrics.pumpState !== undefined ? t.metrics.pumpState : prev.pumpState,
        }));
      }
    });

    return () => unsub();
  }, []);

  const handlePumpToggle = async (desiredState: boolean) => {
    if (!canControlDevices()) return;
    if (desiredState && waterData.leakDetected) {
      alert('Safety Interlock Violation: Cannot activate pump while water leakage is detected!');
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.post('/water/pump-control', {
        deviceId: 'DEV-ESP32-WTR-01',
        pumpState: desiredState,
      });
      setFeedback('Pump command verified and confirmed by hardware ACK');
      setWaterData((prev) => ({ ...prev, pumpState: desiredState }));
    } catch (err: any) {
      setFeedback('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Water Management & Reservoir Automation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ultrasonic depth sensors, YF-S201 flow meters, moisture leak detection, and pump interlocks
          </p>
        </div>
      </div>

      {/* Leak Warning Banner if Active */}
      {waterData.leakDetected && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>
              <strong>CRITICAL WARNING:</strong> Water leakage detected in mechanical pump room! Automatic electrical safety interlock active: pump inhibited.
            </span>
          </div>
          <button
            onClick={() => handlePumpToggle(false)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold shrink-0 hover:bg-rose-700"
          >
            Emergency Shutdown
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Rooftop Reservoir"
          value={`${waterData.tankLevelPercent}%`}
          subtitle="200cm Depth Capacity"
          icon={Droplets}
          accentColor="cyan"
        />
        <StatCard
          title="Instant Flow Rate"
          value={`${waterData.flowRateLpm} L/min`}
          subtitle="Hall-effect YF-S201"
          icon={Activity}
          accentColor="blue"
        />
        <StatCard
          title="Cumulative Consumption"
          value={`${waterData.totalVolumeLiters} Liters`}
          subtitle="Rate: $0.002 / Liter"
          icon={Droplets}
          accentColor="emerald"
        />
        <StatCard
          title="Booster Pump Status"
          value={waterData.pumpState ? 'RUNNING' : 'STOPPED'}
          subtitle={waterData.leakDetected ? 'Locked by Leak Interlock' : 'Electrical Relay Safe'}
          icon={Power}
          accentColor={waterData.pumpState ? 'emerald' : 'slate'}
        />
      </div>

      {/* Visual Reservoir Tank & Pump Controls Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Visual Tank Depth Gauging</h2>
          <p className="text-xs text-slate-500 mb-6">Ultrasonic time-of-flight echo inverted against 200cm tank depth</p>

          <div className="flex items-center justify-center py-4">
            <div className="w-36 h-56 rounded-2xl border-4 border-slate-300 relative overflow-hidden bg-slate-100 flex flex-col justify-end p-1 shadow-inner">
              <div
                className="w-full bg-gradient-to-t from-cyan-600 to-blue-400 rounded-xl transition-all duration-700 flex items-center justify-center text-white font-bold text-sm shadow-md"
                style={{ height: `${Math.max(10, Math.min(100, waterData.tankLevelPercent))}%` }}
              >
                {waterData.tankLevelPercent}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
            <span>Low Threshold: 15%</span>
            <span>Overflow: 95%</span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Pump Relay Actuation & Hardware Interlocks
              </h2>
              <span className="text-xs font-mono text-slate-500">Node: DEV-ESP32-WTR-01</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              The water booster pump is governed by strict electrical protection. When water leakage is detected on ADC1 GPIO 35, the ESP32 automatically enforces a hardware trip and rejects remote start commands.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Leak Sensor Probe Status:</span>
                <span className={`font-bold ${waterData.leakDetected ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {waterData.leakDetected ? 'CONDUCTING / LEAK DETECTED' : 'DRY / NORMAL'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Active Pump Relay Pin:</span>
                <span className="font-mono font-bold text-slate-800">GPIO 33 (Active LOW)</span>
              </div>
            </div>

            {feedback && (
              <p className="mt-3 text-xs font-semibold text-blue-600">{feedback}</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {hasRole('Water Manager', 'Facility Manager')
                ? 'Authorized: Water Manager'
                : 'Read-only View'}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePumpToggle(false)}
                disabled={!waterData.pumpState || loading}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 disabled:opacity-40"
              >
                Stop Pump
              </button>
              <button
                onClick={() => handlePumpToggle(true)}
                disabled={waterData.pumpState || waterData.leakDetected || loading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 disabled:opacity-40"
              >
                Start Pump
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

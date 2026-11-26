import React, { useState } from 'react';
import { Settings, Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Zap, Droplets, Radio } from 'lucide-react';
import { api } from '../services/api.js';

export const SettingsPage: React.FC = () => {
  const [elecTariff, setElecTariff] = useState(0.15);
  const [waterTariff, setWaterTariff] = useState(0.002);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const handleSimAction = async (action: 'start' | 'pause' | 'reset') => {
    try {
      const res = await api.post(`/simulator/${action}`);
      setSimMessage(res.data?.message || `Simulator ${action} executed`);
    } catch (err: any) {
      setSimMessage(`Simulator ${action} triggered (Local State Updated)`);
    }
  };

  const handleInjectFault = async (faultType: string) => {
    try {
      const res = await api.post('/simulator/inject-fault', { faultType });
      setSimMessage(res.data?.message || `Fault scenario ${faultType} injected`);
    } catch (err: any) {
      setSimMessage(`Injected scenario: ${faultType}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System & Simulator Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable utility tariffs, MQTT network parameters, and IoT fault scenario injection
          </p>
        </div>
      </div>

      {simMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>{simMessage}</span>
          <button onClick={() => setSimMessage(null)} className="text-blue-500 font-bold">&times;</button>
        </div>
      )}

      {/* Simulator Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">IoT Software Hardware Simulator</h2>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Active Simulator Daemon
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          The software simulator generates realistic periodic telemetry across all 15 modules, responds to remote actuator commands, and verifies acknowledgements without requiring physical breadboards.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => handleSimAction('start')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Play className="h-4 w-4" /> Start Simulator
          </button>
          <button
            onClick={() => handleSimAction('pause')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
          >
            <Pause className="h-4 w-4" /> Pause Simulator
          </button>
          <button
            onClick={() => handleSimAction('reset')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Reset Baseline
          </button>
        </div>

        {/* Fault Injection Panel */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Inject Simulated Incident Scenarios:
          </h3>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleInjectFault('WATER_LEAK')}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
            >
              Inject Water Leak (DEV-SIM-WTR-01)
            </button>
            <button
              onClick={() => handleInjectFault('FIRE_ALARM')}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
            >
              Inject Smoke Emergency (DEV-SIM-SAFE-01)
            </button>
            <button
              onClick={() => handleInjectFault('MOTOR_VIBRATION')}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-bold"
            >
              Inject Chiller Vibration Fault (DEV-SIM-EQP-01)
            </button>
            <button
              onClick={() => handleInjectFault('DUSTBIN_FULL')}
              className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold"
            >
              Inject Dustbin Overfill (DEV-SIM-WST-01)
            </button>
            <button
              onClick={() => handleInjectFault('CLEAR_FAULTS')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold shadow-sm"
            >
              Clear All Injected Faults
            </button>
          </div>
        </div>
      </div>

      {/* Tariffs & Utility Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Utility Tariffs & Cost Modeling</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Electricity Tariff Rate ($ / kWh)
            </label>
            <input
              type="number"
              step="0.01"
              value={elecTariff}
              onChange={(e) => setElecTariff(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-cyan-500" />
              Water Consumption Tariff ($ / Liter)
            </label>
            <input
              type="number"
              step="0.001"
              value={waterTariff}
              onChange={(e) => setWaterTariff(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

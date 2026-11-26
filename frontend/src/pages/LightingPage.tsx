import React, { useState, useEffect } from 'react';
import { Lightbulb, Sun, Users, Clock, Sliders, ToggleLeft, ToggleRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';

export const LightingPage: React.FC = () => {
  const { canControlDevices } = useAuth();
  const [lightingNodes, setLightingNodes] = useState<any[]>([
    {
      deviceId: 'DEV-ESP32-LGT-01',
      name: 'Classroom 204 Lighting Node',
      room: 'RM-204',
      building: 'BLD-ENG-01',
      occupancy: true,
      ambientLightLux: 280,
      thresholdLux: 300,
      relayState: true,
      manualOverride: false,
      autoOffTimeoutSec: 60,
    },
    {
      deviceId: 'DEV-ESP32-LGT-02',
      name: 'Seminar Hall 202 Lighting Node',
      room: 'RM-202',
      building: 'BLD-ENG-01',
      occupancy: false,
      ambientLightLux: 520,
      thresholdLux: 300,
      relayState: false,
      manualOverride: false,
      autoOffTimeoutSec: 60,
    },
  ]);

  const [loadingDevice, setLoadingDevice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.relayState !== undefined || t.metrics?.occupancy !== undefined) {
        setLightingNodes((prev) =>
          prev.map((node) => {
            if (node.deviceId === t.deviceId) {
              return {
                ...node,
                ...(t.metrics.relayState !== undefined && { relayState: t.metrics.relayState }),
                ...(t.metrics.occupancy !== undefined && { occupancy: t.metrics.occupancy }),
                ...(t.metrics.ambientLightLux !== undefined && { ambientLightLux: t.metrics.ambientLightLux }),
                ...(t.metrics.manualOverride !== undefined && { manualOverride: t.metrics.manualOverride }),
              };
            }
            return node;
          })
        );
      }
    });

    return () => unsub();
  }, []);

  const handleToggleLighting = async (node: any) => {
    if (!canControlDevices()) return;
    setLoadingDevice(node.deviceId);
    try {
      await api.patch('/lighting/override', {
        deviceId: node.deviceId,
        state: !node.relayState,
      });

      // Optimistic update confirmed upon ACK
      setLightingNodes((prev) =>
        prev.map((n) => (n.deviceId === node.deviceId ? { ...n, relayState: !n.relayState, manualOverride: true } : n))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to toggle light');
    } finally {
      setLoadingDevice(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Smart Lighting Automation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PIR occupancy triggers, LDR photoresistor thresholds, and optoisolated relay controls
          </p>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sliders className="h-5 w-5 text-blue-600 shrink-0" />
          <span>
            <strong>Autonomous Logic Engine:</strong> IF Motion Detected (PIR) AND Ambient Light &lt; 300 Lux &rarr; Switch Light ON. If no occupancy for 60s &rarr; Switch Light OFF.
          </span>
        </div>
        <span className="font-bold text-blue-700 bg-white px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
          Auto Mode Active
        </span>
      </div>

      {/* Lighting Nodes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lightingNodes.map((node) => (
          <div
            key={node.deviceId}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                  {node.deviceId}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    node.relayState
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Lightbulb className={`h-3.5 w-3.5 ${node.relayState ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  {node.relayState ? 'Light Active (ON)' : 'Light Inactive (OFF)'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">{node.name}</h2>
              <p className="text-xs text-slate-500 mb-4">{node.building} &bull; Zone: {node.room}</p>

              {/* Sensor State Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="text-slate-400 text-[11px] block">PIR Motion:</span>
                    <span className="font-bold text-slate-900">
                      {node.occupancy ? 'Motion Detected' : 'No Motion'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <div>
                    <span className="text-slate-400 text-[11px] block">LDR Light Level:</span>
                    <span className="font-bold text-slate-900">
                      {node.ambientLightLux} Lux (Threshold: {node.thresholdLux} Lx)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                <span>Timeout: {node.autoOffTimeoutSec}s no-occupancy</span>
                <span className={`font-semibold ${node.manualOverride ? 'text-amber-600' : 'text-slate-400'}`}>
                  {node.manualOverride ? 'Manual Override Engaged' : 'Autonomous Schedule'}
                </span>
              </div>
            </div>

            {/* Actuation Control Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {canControlDevices() ? 'Authorized Relays' : 'Viewer Mode (Read-only)'}
              </span>
              <button
                type="button"
                onClick={() => handleToggleLighting(node)}
                disabled={!canControlDevices() || loadingDevice === node.deviceId}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 ${
                  node.relayState
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {loadingDevice === node.deviceId
                  ? 'Awaiting ACK...'
                  : node.relayState
                  ? 'Turn Light OFF'
                  : 'Turn Light ON'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Flame, Wind, AlertTriangle, CheckCircle2, BellRing, ShieldCheck } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';

export const SafetyPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([
    {
      _id: 'inc_1',
      incidentId: 'INC-FIRE-901',
      buildingCode: 'BLD-SCI-01',
      roomNumber: 'LAB-101',
      eventType: 'SMOKE',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      sensorReading: 2150,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [safetyMetrics, setSafetyMetrics] = useState({
    smokeLevel: 420,
    smokeDetected: false,
    flameDetected: false,
    alarmActive: false,
  });

  useEffect(() => {
    api
      .get('/safety/incidents')
      .then((res) => {
        if (res.data?.data?.incidents) {
          setIncidents(res.data.data.incidents);
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.smokeLevel !== undefined) {
        setSafetyMetrics({
          smokeLevel: t.metrics.smokeLevel,
          smokeDetected: !!t.metrics.smokeDetected,
          flameDetected: !!t.metrics.flameDetected,
          alarmActive: !!t.metrics.alarmState,
        });
      }
    });

    return () => unsub();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.post(`/safety/incidents/${id}/acknowledge`);
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === id ? { ...inc, status: 'ACKNOWLEDGED', acknowledged: true } : inc))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge incident');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fire & Life-Safety Incident Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MQ-2 smoke density, optical flame detection, thermal triggers, and emergency siren state
          </p>
        </div>
      </div>

      {/* Safety Disclaimer */}
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-900 block text-sm mb-0.5">Statutory Life-Safety Prototype Disclaimer</span>
          This platform is an educational IoT engineering prototype. It does not replace certified building fire alarm systems (e.g. UL 268 / EN 54) or certified emergency notification systems. Never use prototype hardware for life-safety critical actions.
        </div>
      </div>

      {/* Live Safety Nodes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Smoke Sensor Level"
          value={`${safetyMetrics.smokeLevel} ADC`}
          subtitle="Trigger Threshold: 1800 ADC"
          icon={Wind}
          accentColor={safetyMetrics.smokeDetected ? 'rose' : 'slate'}
        />
        <StatCard
          title="Flame Optical Status"
          value={safetyMetrics.flameDetected ? 'FLAME SENSE' : 'CLEAR'}
          subtitle="IR Photodiode DOUT"
          icon={Flame}
          accentColor={safetyMetrics.flameDetected ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Audible Siren Relay"
          value={safetyMetrics.alarmActive ? 'SIREN ACTIVE' : 'SILENT'}
          subtitle="Buzzer Pin GPIO 26"
          icon={BellRing}
          accentColor={safetyMetrics.alarmActive ? 'rose' : 'blue'}
        />
        <StatCard
          title="Safety Incidents"
          value={incidents.filter((i) => i.status === 'ACTIVE').length}
          subtitle="Requiring Acknowledgement"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* Incident Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Emergency Incident Event Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Incident ID</th>
                <th className="px-4 py-3">Building & Zone</th>
                <th className="px-4 py-3">Event Classification</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {incidents.map((inc) => (
                <tr key={inc._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{inc.incidentId}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-blue-600">{inc.buildingCode}</span> &bull; {inc.roomNumber}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{inc.eventType} DETECTED</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inc.status === 'ACTIVE' && hasRole('Security Officer', 'Facility Manager') ? (
                      <button
                        onClick={() => handleAcknowledge(inc._id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm"
                      >
                        Acknowledge Event
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium">Logged & Acknowledged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

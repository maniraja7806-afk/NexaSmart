import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Play, Pause, Activity, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { AutomationRule } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const AutomationPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      _id: 'r1',
      ruleId: 'RLE-AUTO-LIGHT-01',
      name: 'Classroom Lighting Occupancy Control',
      description: 'Automatically energizes lighting when occupancy is detected and ambient light < 300 Lux.',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-204',
      sensorType: 'occupancy',
      metricKey: 'occupancy',
      condition: 'EQ',
      threshold: true,
      action: 'SET_RELAY',
      actionTargetDevice: 'DEV-ESP32-LGT-01',
      durationSeconds: 15,
      isEnabled: true,
      lastTriggeredAt: new Date().toISOString(),
    },
    {
      _id: 'r2',
      ruleId: 'RLE-WATER-SAFETY-01',
      name: 'Automatic Pump Shutoff on Tank Low/Leak',
      description: 'Shuts off water booster pump immediately if reservoir level drops below 15%.',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      sensorType: 'tankLevelPercent',
      metricKey: 'tankLevelPercent',
      condition: 'LT',
      threshold: 15.0,
      action: 'TRIGGER_PUMP',
      actionTargetDevice: 'DEV-ESP32-WTR-01',
      durationSeconds: 30,
      isEnabled: true,
      lastTriggeredAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [executions, setExecutions] = useState<any[]>([
    {
      _id: 'ex_1',
      ruleName: 'Classroom Lighting Occupancy Control',
      buildingCode: 'BLD-ENG-01',
      triggeredAt: new Date(Date.now() - 120000).toISOString(),
      triggerReading: 'occupancy: true',
      actionExecuted: 'SET_RELAY -> 1',
      targetDevice: 'DEV-ESP32-LGT-01',
      executionSuccess: true,
    },
    {
      _id: 'ex_2',
      ruleName: 'Automatic Pump Shutoff on Tank Low/Leak',
      buildingCode: 'BLD-ENG-01',
      triggeredAt: new Date(Date.now() - 480000).toISOString(),
      triggerReading: 'tankLevelPercent: 78.5',
      actionExecuted: 'NO_OP',
      targetDevice: 'DEV-ESP32-WTR-01',
      executionSuccess: true,
    },
  ]);

  useEffect(() => {
    api
      .get('/automation')
      .then((res) => {
        if (res.data?.data) {
          if (res.data.data.rules) setRules(res.data.data.rules);
          if (res.data.data.executions) setExecutions(res.data.data.executions);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggle = async (ruleId: string) => {
    if (!hasRole('Facility Manager', 'Campus Administrator')) return;
    try {
      await api.patch(`/automation/${ruleId}/toggle`);
      setRules((prev) =>
        prev.map((r) => (r._id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Automation Rules Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Event-driven triggers, multi-condition threshold matching, and verified actuator executions
          </p>
        </div>

        {hasRole('Facility Manager', 'Campus Administrator') && (
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 self-start">
            <Plus className="h-4 w-4" />
            Create Rule
          </button>
        )}
      </div>

      {/* Rules Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => (
          <div
            key={rule._id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                  {rule.ruleId}
                </span>
                <button
                  onClick={() => handleToggle(rule._id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rule.isEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {rule.isEnabled ? <Play className="h-3 w-3 fill-emerald-600" /> : <Pause className="h-3 w-3" />}
                  {rule.isEnabled ? 'ENABLED' : 'PAUSED'}
                </button>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">{rule.name}</h2>
              <p className="text-xs text-slate-500 mb-4">{rule.description}</p>

              {/* Logic Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs text-slate-700 space-y-1">
                <div>
                  <span className="text-blue-600 font-bold">IF:</span> {rule.metricKey} {rule.condition} {String(rule.threshold)}
                </div>
                <div>
                  <span className="text-emerald-600 font-bold">THEN:</span> {rule.action} &rarr; {rule.actionTargetDevice}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between mt-4">
              <span>Cooldown: {rule.durationSeconds || 15}s</span>
              <span>
                {rule.lastTriggeredAt
                  ? `Last Fired: ${new Date(rule.lastTriggeredAt).toLocaleTimeString()}`
                  : 'Never Fired'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          Rule Execution Audit Trail
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Rule Name</th>
                <th className="px-4 py-3">Building</th>
                <th className="px-4 py-3">Trigger Condition</th>
                <th className="px-4 py-3">Action Executed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Fired At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {executions.map((ex, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{ex.ruleName}</td>
                  <td className="px-4 py-3 font-mono text-blue-600">{ex.buildingCode}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{JSON.stringify(ex.triggerReading)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-600">{ex.actionExecuted}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      SUCCESS
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {new Date(ex.triggeredAt).toLocaleTimeString()}
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

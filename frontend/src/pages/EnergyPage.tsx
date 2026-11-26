import React, { useState, useEffect } from 'react';
import { Zap, DollarSign, Activity, Gauge, TrendingUp, BarChart3 } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const EnergyPage: React.FC = () => {
  const [energyData, setEnergyData] = useState({
    voltage: 230.5,
    current: 18.4,
    activePowerKw: 4.24,
    energyKwh: 1420.5,
    frequency: 50.0,
    powerFactor: 0.95,
    tariff: 0.15,
  });

  const [history, setHistory] = useState<any[]>([
    { time: '10:00', voltage: 231, current: 16.2, power: 3.7 },
    { time: '11:00', voltage: 230, current: 18.1, power: 4.1 },
    { time: '12:00', voltage: 229, current: 22.4, power: 5.1 },
    { time: '13:00', voltage: 230, current: 20.8, power: 4.7 },
    { time: '14:00', voltage: 231, current: 23.5, power: 5.4 },
    { time: '15:00', voltage: 230, current: 18.4, power: 4.2 },
  ]);

  useEffect(() => {
    api
      .get('/energy/live')
      .then((res) => {
        if (res.data?.data) {
          const recent = res.data.data.recentReadings;
          if (recent && recent.length > 0) {
            const latest = recent[recent.length - 1];
            setEnergyData((prev) => ({
              ...prev,
              voltage: latest.voltage,
              current: latest.current,
              activePowerKw: latest.activePowerKw,
              energyKwh: latest.energyKwh,
              frequency: latest.frequency || 50.0,
              powerFactor: latest.powerFactor || 0.95,
              tariff: res.data.data.tariffPerKwh || 0.15,
            }));
          }
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.activePowerKw !== undefined) {
        setEnergyData((prev) => ({
          ...prev,
          voltage: t.metrics.voltage || prev.voltage,
          current: t.metrics.current || prev.current,
          activePowerKw: t.metrics.activePowerKw,
          energyKwh: t.metrics.energyKwh || prev.energyKwh,
          frequency: t.metrics.frequency || prev.frequency,
          powerFactor: t.metrics.powerFactor || prev.powerFactor,
        }));

        setHistory((prev) => [
          ...prev.slice(1),
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            voltage: t.metrics.voltage || 230,
            current: t.metrics.current || 18,
            power: t.metrics.activePowerKw,
          },
        ]);
      }
    });

    return () => unsub();
  }, []);

  const estimatedCost = Math.round(energyData.energyKwh * energyData.tariff * 100) / 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Smart Energy Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PZEM-004T AC metrics, power quality analysis, and real-time electricity tariff cost models
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 self-start">
          <DollarSign className="h-4 w-4 text-amber-600" />
          Tariff Rate: ${energyData.tariff} / kWh
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="AC Voltage"
          value={`${energyData.voltage} V`}
          subtitle="RMS 230V Nominal"
          icon={Activity}
          accentColor="blue"
        />
        <StatCard
          title="AC Current"
          value={`${energyData.current} A`}
          subtitle="CT Sensor Clamped"
          icon={Gauge}
          accentColor="indigo"
        />
        <StatCard
          title="Active Power"
          value={`${energyData.activePowerKw} kW`}
          subtitle="Real Load Demand"
          icon={Zap}
          accentColor="amber"
        />
        <StatCard
          title="Total Energy"
          value={`${energyData.energyKwh} kWh`}
          subtitle="Meter Register Total"
          icon={TrendingUp}
          accentColor="emerald"
        />
        <StatCard
          title="Power Factor"
          value={`${energyData.powerFactor}`}
          subtitle={`${energyData.frequency} Hz Grid`}
          icon={Gauge}
          accentColor="cyan"
        />
        <StatCard
          title="Estimated Cost"
          value={`$${estimatedCost}`}
          subtitle="Current Billing Period"
          icon={DollarSign}
          accentColor="amber"
        />
      </div>

      {/* Energy Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Live Active Power Draw (kW)
              </h2>
              <p className="text-xs text-slate-500">PZEM-004T High Frequency Stream</p>
            </div>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {energyData.activePowerKw} kW
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  name="Power (kW)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                RMS Current vs Voltage Stability
              </h2>
              <p className="text-xs text-slate-500">Voltage Sag & Surge Monitoring</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 font-mono">
              {energyData.voltage}V &bull; {energyData.current}A
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Current (A)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="voltage"
                  name="Voltage (V)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

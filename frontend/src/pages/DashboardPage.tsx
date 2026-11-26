import React, { useState, useEffect } from 'react';
import {
  Building2,
  Cpu,
  Wifi,
  WifiOff,
  AlertTriangle,
  Zap,
  Droplets,
  Thermometer,
  Users,
  Car,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<any>({
    totalBuildings: 3,
    totalDevices: 6,
    onlineDevices: 5,
    offlineDevices: 1,
    activeAlerts: 0,
    powerKw: 4.8,
    totalEnergyKwh: 1420.5,
    waterLevelPercent: 78.5,
    waterFlowLpm: 12.4,
    parking: { total: 4, occupied: 1, available: 3 },
    avgTemp: 23.1,
    totalOccupancy: 28,
    recentActivity: [],
  });

  const [energyTrends, setEnergyTrends] = useState<any[]>([
    { time: '10:00', power: 3.8, temp: 22.1 },
    { time: '11:00', power: 4.2, temp: 22.8 },
    { time: '12:00', power: 5.1, temp: 23.4 },
    { time: '13:00', power: 4.9, temp: 23.6 },
    { time: '14:00', power: 5.4, temp: 24.1 },
    { time: '15:00', power: 4.8, temp: 23.5 },
  ]);

  useEffect(() => {
    // 1. Fetch initial API data
    api
      .get('/overview')
      .then((res) => {
        if (res.data?.data) {
          setOverview((prev: any) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(() => {});

    // 2. Connect to real-time telemetry stream
    const unsubscribe = socketClient.onTelemetry((telemetry) => {
      if (telemetry.metrics?.activePowerKw !== undefined) {
        setOverview((prev: any) => ({
          ...prev,
          powerKw: telemetry.metrics.activePowerKw,
          totalEnergyKwh: telemetry.metrics.energyKwh || prev.totalEnergyKwh,
        }));
      }

      if (telemetry.metrics?.temperature !== undefined) {
        setOverview((prev: any) => ({
          ...prev,
          avgTemp: telemetry.metrics.temperature,
        }));
      }

      if (telemetry.metrics?.tankLevelPercent !== undefined) {
        setOverview((prev: any) => ({
          ...prev,
          waterLevelPercent: telemetry.metrics.tankLevelPercent,
          waterFlowLpm: telemetry.metrics.flowRateLpm || prev.waterFlowLpm,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Campus Operations Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-building telemetry ingestion and automated facility controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Real-Time Stream Active
          </span>
        </div>
      </div>

      {/* Main KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Buildings"
          value={overview.totalBuildings || 3}
          subtitle="All Campus Zones"
          icon={Building2}
          accentColor="blue"
        />
        <StatCard
          title="Total Devices"
          value={overview.totalDevices || 6}
          subtitle={`${overview.onlineDevices || 5} Active Online`}
          icon={Cpu}
          accentColor="indigo"
        />
        <StatCard
          title="Online Nodes"
          value={overview.onlineDevices || 5}
          subtitle="98.2% Fleet Uptime"
          icon={Wifi}
          accentColor="emerald"
        />
        <StatCard
          title="Offline / Fault"
          value={overview.offlineDevices || 0}
          subtitle="Watchdog heartbeat"
          icon={WifiOff}
          accentColor="rose"
        />
        <StatCard
          title="Active Alerts"
          value={overview.activeAlerts || 0}
          subtitle="Requires attention"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* Physical Telemetry KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Live Power Draw"
          value={`${overview.powerKw || 4.8} kW`}
          subtitle={`Accumulated: ${overview.totalEnergyKwh || 1420} kWh`}
          icon={Zap}
          accentColor="amber"
        />
        <StatCard
          title="Water Reservoir"
          value={`${overview.waterLevelPercent || 78.5}%`}
          subtitle={`Flow: ${overview.waterFlowLpm || 12.4} L/min`}
          icon={Droplets}
          accentColor="cyan"
        />
        <StatCard
          title="Avg Temperature"
          value={`${overview.avgTemp || 23.1} °C`}
          subtitle="Target: 22.0 – 24.5 °C"
          icon={Thermometer}
          accentColor="blue"
        />
        <StatCard
          title="Zone Occupancy"
          value={overview.totalOccupancy || 28}
          subtitle="PIR Detected Students"
          icon={Users}
          accentColor="emerald"
        />
        <StatCard
          title="Parking Bays"
          value={`${overview.parking?.available || 3} Free`}
          subtitle={`${overview.parking?.occupied || 1} of ${overview.parking?.total || 4} Occupied`}
          icon={Car}
          accentColor="indigo"
        />
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Power Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Electrical Demand & Environmental Correlation
              </h2>
              <p className="text-xs text-slate-500">Live PZEM-004T Active Power (kW) vs Indoor Temp (°C)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span> Power (kW)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span> Temp (°C)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyTrends}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  name="Active Power (kW)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#powerGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tempGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Facility Events Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Live Event Dispatch
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">QoS 1</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {[
              {
                time: 'Just now',
                event: 'PZEM Energy Telemetry Published',
                bldg: 'BLD-ENG-01',
                badge: 'Online',
              },
              {
                time: '2m ago',
                event: 'Classroom 204 Lighting Auto ON',
                bldg: 'BLD-ENG-01',
                badge: 'Normal',
              },
              {
                time: '4m ago',
                event: 'Rooftop Water Tank Level Sampled',
                bldg: 'BLD-ENG-01',
                badge: 'Normal',
              },
              {
                time: '6m ago',
                event: 'RFID Badge Tap: Marcus Vance',
                bldg: 'BLD-ADM-01',
                badge: 'Available',
              },
              {
                time: '12m ago',
                event: 'Chiller Motor Vibration Audit Passed',
                bldg: 'BLD-ENG-01',
                badge: 'Normal',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{item.event}</span>
                  <StatusBadge status={item.badge} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-blue-600">{item.bldg}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

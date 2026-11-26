import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Wind, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
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

export const EnvironmentPage: React.FC = () => {
  const [envData, setEnvData] = useState({
    temperature: 23.4,
    humidity: 50.2,
    rawAirQualityPpm: 92,
    status: 'Good',
  });

  const [history, setHistory] = useState<any[]>([
    { time: '10:00', temp: 22.4, humid: 48, iaq: 80 },
    { time: '11:00', temp: 23.1, humid: 49, iaq: 85 },
    { time: '12:00', temp: 23.8, humid: 52, iaq: 95 },
    { time: '13:00', temp: 24.2, humid: 51, iaq: 98 },
    { time: '14:00', temp: 23.6, humid: 50, iaq: 90 },
    { time: '15:00', temp: 23.4, humid: 50, iaq: 92 },
  ]);

  useEffect(() => {
    api
      .get('/environment/overview')
      .then((res) => {
        if (res.data?.data) {
          const hist = res.data.data.history;
          if (hist && hist.length > 0) {
            const latest = hist[hist.length - 1];
            setEnvData({
              temperature: latest.temperature,
              humidity: latest.humidity,
              rawAirQualityPpm: latest.rawAirQualityPpm || 90,
              status: latest.rawAirQualityPpm > 180 ? 'Poor' : latest.rawAirQualityPpm > 120 ? 'Moderate' : 'Good',
            });
          }
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.temperature !== undefined) {
        const iaq = t.metrics.rawAirQualityPpm || envData.rawAirQualityPpm;
        setEnvData({
          temperature: t.metrics.temperature,
          humidity: t.metrics.humidity || envData.humidity,
          rawAirQualityPpm: iaq,
          status: iaq > 180 ? 'Poor' : iaq > 120 ? 'Moderate' : 'Good',
        });

        setHistory((prev) => [
          ...prev.slice(1),
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temp: t.metrics.temperature,
            humid: t.metrics.humidity || 50,
            iaq,
          },
        ]);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Indoor Air Quality & Environmental Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            DHT22 temperature & humidity and MQ-135 qualitative air quality index
          </p>
        </div>
      </div>

      {/* Sensor Calibration & Medical Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950 block text-sm mb-0.5">Engineering & Calibration Notice</span>
          MQ-135 electrochemical sensors provide raw qualitative gas resistance trends. They are not certified laboratory-grade CO2 analyzers or clinical medical devices. Readings must not be interpreted as absolute pollutant concentrations or for medical diagnosis.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Ambient Temperature"
          value={`${envData.temperature} °C`}
          subtitle="Optimal: 21.0 – 24.5 °C"
          icon={Thermometer}
          accentColor="blue"
        />
        <StatCard
          title="Relative Humidity"
          value={`${envData.humidity} %`}
          subtitle="Comfort Zone: 40 – 60%"
          icon={Droplets}
          accentColor="cyan"
        />
        <StatCard
          title="Air Quality Indicator"
          value={`${envData.rawAirQualityPpm} PPM Index`}
          subtitle={`Status: ${envData.status}`}
          icon={Wind}
          accentColor={envData.status === 'Good' ? 'emerald' : 'amber'}
        />
      </div>

      {/* Historical Trend Charts */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Thermal & IAQ Trend Correlation
            </h2>
            <p className="text-xs text-slate-500">Continuous 5-second sampling window</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span> Temp (°C)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600">
              <span className="h-2 w-2 rounded-full bg-cyan-600"></span> Humidity (%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-600"></span> IAQ (Raw)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="iaqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                dataKey="temp"
                name="Temperature (°C)"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={0}
              />
              <Area
                type="monotone"
                dataKey="humid"
                name="Humidity (%)"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={0}
              />
              <Area
                type="monotone"
                dataKey="iaq"
                name="Air Quality Index"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#iaqGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

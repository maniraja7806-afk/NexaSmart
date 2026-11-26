import React, { useState, useEffect } from 'react';
import { Wrench, Activity, Thermometer, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';

export const EquipmentPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<any[]>([
    {
      _id: 'eq_1',
      equipmentId: 'EQP-CHILLER-01',
      name: 'Primary Centrifugal Water Chiller 350-Ton',
      type: 'CHILLER',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-HVAC-PLANT',
      operatingStatus: 'NORMAL',
      temperatureC: 38.4,
      vibrationMmS: 2.1,
      operatingHours: 1240,
    },
    {
      _id: 'eq_2',
      equipmentId: 'EQP-BOOSTER-PUMP-01',
      name: 'Domestic Water Booster Pump #1',
      type: 'PUMP',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      operatingStatus: 'NORMAL',
      temperatureC: 44.2,
      vibrationMmS: 1.8,
      operatingHours: 890,
    },
    {
      _id: 'eq_3',
      equipmentId: 'EQP-GEN-STANDBY-01',
      name: 'Campus Standby Diesel Generator 500kVA',
      type: 'GENERATOR',
      buildingCode: 'BLD-ADM-01',
      roomNumber: 'GEN-SUBSTATION',
      operatingStatus: 'NORMAL',
      temperatureC: 28.0,
      vibrationMmS: 0.8,
      operatingHours: 115,
    },
  ]);

  useEffect(() => {
    api
      .get('/equipment/overview')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setEquipmentList(res.data.data);
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.equipmentId) {
        setEquipmentList((prev) =>
          prev.map((eq) =>
            eq.equipmentId === t.metrics.equipmentId
              ? {
                  ...eq,
                  vibrationMmS: t.metrics.vibrationMmS || eq.vibrationMmS,
                  temperatureC: t.metrics.surfaceTempC || eq.temperatureC,
                  operatingStatus: t.metrics.operatingStatus || eq.operatingStatus,
                }
              : eq
          )
        );
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Equipment Condition & Vibration Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ISO 10816 vibration velocity (mm/s), surface temperature, and mechanical runtime
          </p>
        </div>
      </div>

      {/* Engineering Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950 block text-sm mb-0.5">Vibration Threshold & Analytics Protocol</span>
          Sensor readings reflect instant peak velocity indicators (mm/s). They provide operational anomaly alerting and do not constitute certified predictive remaining useful life (RUL) calculations without dedicated external spectral vibration analyzers.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monitored Heavy Assets"
          value={equipmentList.length}
          subtitle="Chillers, Pumps, Generators"
          icon={Wrench}
          accentColor="blue"
        />
        <StatCard
          title="Optimal Running State"
          value={equipmentList.filter((e) => e.operatingStatus === 'NORMAL').length}
          subtitle="Vibration &lt; 4.5 mm/s"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Attention / Warning"
          value={equipmentList.filter((e) => e.operatingStatus !== 'NORMAL').length}
          subtitle="High Vibration / Thermal"
          icon={AlertTriangle}
          accentColor="rose"
        />
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {equipmentList.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-md">
                  {item.equipmentId}
                </span>
                <StatusBadge status={item.operatingStatus} />
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">{item.name}</h2>
              <p className="text-xs text-slate-500 mb-4">{item.buildingCode} &bull; Zone: {item.roomNumber}</p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Activity className="h-3 w-3 text-blue-500" />
                    Vibration
                  </span>
                  <span className={`text-sm font-bold mt-0.5 block ${item.vibrationMmS > 8.0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {item.vibrationMmS} mm/s
                  </span>
                </div>
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Thermometer className="h-3 w-3 text-amber-500" />
                    Casing Temp
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {item.temperatureC} °C
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Operating Hours: {item.operatingHours}h</span>
              <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                View Log &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';

export const WastePage: React.FC = () => {
  const [bins, setBins] = useState<any[]>([
    {
      _id: 'bin_1',
      binId: 'BIN-201',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      locationDesc: 'Corridor 2F near Elevators',
      wasteType: 'Recyclable',
      fillLevelPercent: 54.0,
      thresholdPercent: 85,
      needsCollection: false,
    },
    {
      _id: 'bin_2',
      binId: 'BIN-101',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 1,
      locationDesc: 'Robotics Workshop Main Door',
      wasteType: 'General',
      fillLevelPercent: 88.0,
      thresholdPercent: 85,
      needsCollection: true,
      assignedStaff: 'Custodial Team Alpha',
    },
    {
      _id: 'bin_3',
      binId: 'BIN-SCI-01',
      buildingCode: 'BLD-SCI-01',
      floorNumber: 1,
      locationDesc: 'Chemistry Lab Waste Station',
      wasteType: 'Hazardous',
      fillLevelPercent: 32.0,
      thresholdPercent: 75,
      needsCollection: false,
    },
  ]);

  useEffect(() => {
    api
      .get('/waste/bins')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setBins(res.data.data);
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.fillLevelPercent !== undefined) {
        setBins((prev) =>
          prev.map((b) =>
            b.binId === t.metrics.binId
              ? {
                  ...b,
                  fillLevelPercent: t.metrics.fillLevelPercent,
                  needsCollection: t.metrics.fillLevelPercent >= b.thresholdPercent,
                }
              : b
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
            Smart Waste Management & Fill-Level Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ultrasonic depth sensors, capacity alarms, and custodial dispatch workflows
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monitored Dustbins"
          value={bins.length}
          subtitle="Campus Sensor Grid"
          icon={Trash2}
          accentColor="blue"
        />
        <StatCard
          title="Collection Requests"
          value={bins.filter((b) => b.needsCollection).length}
          subtitle="Capacity Exceeded (>85%)"
          icon={AlertTriangle}
          accentColor="rose"
        />
        <StatCard
          title="Normal Capacity"
          value={bins.filter((b) => !b.needsCollection).length}
          subtitle="Below Threshold"
          icon={CheckCircle2}
          accentColor="emerald"
        />
      </div>

      {/* Bins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bins.map((bin) => (
          <div
            key={bin._id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-md">
                  {bin.binId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    bin.needsCollection
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {bin.needsCollection ? 'COLLECTION REQUIRED' : 'NORMAL LEVEL'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">{bin.locationDesc}</h2>
              <p className="text-xs text-slate-500 mb-4">{bin.buildingCode} &bull; {bin.wasteType} Waste</p>

              {/* Visual Fill Gauge */}
              <div className="space-y-1.5 my-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Capacity Fill:</span>
                  <span className={bin.fillLevelPercent >= 85 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                    {bin.fillLevelPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      bin.fillLevelPercent >= 85
                        ? 'bg-rose-500'
                        : bin.fillLevelPercent >= 60
                        ? 'bg-amber-400'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, bin.fillLevelPercent)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Threshold: {bin.thresholdPercent}%</span>
              <span className="font-semibold text-slate-700">{bin.assignedStaff || 'Unassigned'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

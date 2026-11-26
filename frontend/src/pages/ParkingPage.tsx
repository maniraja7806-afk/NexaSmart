import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2, XCircle, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';

export const ParkingPage: React.FC = () => {
  const [slots, setSlots] = useState<any[]>([
    { _id: 's1', slotNumber: 'A-101', zone: 'Lot A', type: 'Standard', status: 'Occupied', distanceCm: 65.0 },
    { _id: 's2', slotNumber: 'A-102', zone: 'Lot A', type: 'EV Charging', status: 'Available', distanceCm: 250.0 },
    { _id: 's3', slotNumber: 'A-103', zone: 'Lot A', type: 'Accessible', status: 'Available', distanceCm: 240.0 },
    { _id: 's4', slotNumber: 'A-104', zone: 'Lot A', type: 'Faculty', status: 'Reserved', reservedFor: 'Dean of Engineering' },
    { _id: 's5', slotNumber: 'B-201', zone: 'Lot B', type: 'Standard', status: 'Available', distanceCm: 250.0 },
    { _id: 's6', slotNumber: 'B-202', zone: 'Lot B', type: 'Standard', status: 'OutOfService' },
  ]);

  useEffect(() => {
    api
      .get('/parking/slots')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setSlots(res.data.data);
        }
      })
      .catch(() => {});

    const unsub = socketClient.onTelemetry((t) => {
      if (t.metrics?.slotNumber) {
        setSlots((prev) =>
          prev.map((s) => (s.slotNumber === t.metrics.slotNumber ? { ...s, status: t.metrics.status, distanceCm: t.metrics.distanceCm } : s))
        );
      }
    });

    return () => unsub();
  }, []);

  const total = slots.length;
  const available = slots.filter((s) => s.status === 'Available').length;
  const occupied = slots.filter((s) => s.status === 'Occupied').length;
  const reserved = slots.filter((s) => s.status === 'Reserved').length;

  const getSlotStyle = (status: string) => {
    switch (status) {
      case 'Available':
        return 'border-emerald-300 bg-emerald-50 text-emerald-800';
      case 'Occupied':
        return 'border-rose-300 bg-rose-50 text-rose-800';
      case 'Reserved':
        return 'border-purple-300 bg-purple-50 text-purple-800';
      default:
        return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Smart Campus Parking Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ultrasonic vehicle presence detection, EV bays, and visual spatial occupancy grid
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Parking Bays"
          value={total}
          subtitle="Monitored by Ultrasonic"
          icon={Car}
          accentColor="blue"
        />
        <StatCard
          title="Available Slots"
          value={available}
          subtitle="Ready for Arrival"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Occupied Slots"
          value={occupied}
          subtitle="Currently Parked"
          icon={XCircle}
          accentColor="rose"
        />
        <StatCard
          title="Reserved / VIP"
          value={reserved}
          subtitle="Dedicated Faculty & EV"
          icon={Clock}
          accentColor="indigo"
        />
      </div>

      {/* Visual Parking Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-2">Visual Parking Bay Deck</h2>
        <p className="text-xs text-slate-500 mb-6">Real-time status based on ultrasonic reflection distance (&lt;120cm = Occupied)</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => (
            <div
              key={slot._id}
              className={`rounded-2xl border-2 p-5 shadow-sm transition-all ${getSlotStyle(slot.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-black px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-900">
                  {slot.slotNumber}
                </span>
                <StatusBadge status={slot.status} />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <Car className="h-4 w-4" />
                <span>{slot.type} Parking Bay</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">{slot.zone || 'Lot A'}</p>

              <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-center justify-between">
                <span>{slot.distanceCm ? `Distance: ${slot.distanceCm}cm` : 'Ultrasonic Active'}</span>
                {slot.reservedFor && <span className="font-semibold text-purple-700 truncate max-w-[120px]">{slot.reservedFor}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

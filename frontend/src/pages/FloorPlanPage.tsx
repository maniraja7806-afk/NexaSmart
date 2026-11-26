import React, { useState, useEffect } from 'react';
import {
  Layers,
  Thermometer,
  Droplets,
  Sun,
  Users,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Clock,
} from 'lucide-react';
import { Room } from '../types/index.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';

export const FloorPlanPage: React.FC = () => {
  const [selectedFloor, setSelectedFloor] = useState(2);
  const [rooms, setRooms] = useState<Room[]>([
    {
      _id: 'rm_201',
      buildingId: 'bld_1',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      roomNumber: 'RM-201',
      name: 'Signals & Systems Lecture Hall',
      type: 'Classroom',
      capacity: 60,
      currentOccupancy: false,
      occupancyCount: 0,
      currentTemperature: 21.8,
      currentHumidity: 44.0,
      currentLightLux: 150,
      lightingState: false,
      maintenanceStatus: 'NORMAL',
    },
    {
      _id: 'rm_202',
      buildingId: 'bld_1',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      roomNumber: 'RM-202',
      name: 'Advanced Computing Seminar Room',
      type: 'Classroom',
      capacity: 35,
      currentOccupancy: true,
      occupancyCount: 30,
      currentTemperature: 24.2,
      currentHumidity: 52.0,
      currentLightLux: 450,
      lightingState: true,
      maintenanceStatus: 'NORMAL',
    },
    {
      _id: 'rm_203',
      buildingId: 'bld_1',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      roomNumber: 'RM-203',
      name: 'Circuit Analysis Workshop Lab',
      type: 'Laboratory',
      capacity: 30,
      currentOccupancy: false,
      occupancyCount: 0,
      currentTemperature: 22.0,
      currentHumidity: 45.0,
      currentLightLux: 200,
      lightingState: false,
      maintenanceStatus: 'UNDER_MAINTENANCE',
    },
    {
      _id: 'rm_204',
      buildingId: 'bld_1',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      roomNumber: 'RM-204',
      name: 'IoT & Embedded Systems Smart Classroom',
      type: 'Classroom',
      capacity: 45,
      currentOccupancy: true,
      occupancyCount: 28,
      currentTemperature: 23.4,
      currentHumidity: 50.2,
      currentLightLux: 380,
      lightingState: true,
      maintenanceStatus: 'NORMAL',
    },
    {
      _id: 'rm_205',
      buildingId: 'bld_1',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      roomNumber: 'RM-205',
      name: 'Robotics Control Room',
      type: 'Laboratory',
      capacity: 20,
      currentOccupancy: true,
      occupancyCount: 8,
      currentTemperature: 33.2, // Warning temperature!
      currentHumidity: 65.0,
      currentLightLux: 520,
      lightingState: true,
      maintenanceStatus: 'NORMAL',
    },
    {
      _id: 'rm_206',
      buildingId: 'bld_1',
      buildingCode: 'BLD-ENG-01',
      floorNumber: 2,
      roomNumber: 'RM-206',
      name: 'Faculty Collaborative Lounge',
      type: 'Faculty Office',
      capacity: 15,
      currentOccupancy: false,
      occupancyCount: 0,
      currentTemperature: 22.5,
      currentHumidity: 46.0,
      currentLightLux: 280,
      lightingState: false,
      maintenanceStatus: 'NORMAL',
    },
  ]);

  useEffect(() => {
    // Listen for live sensor telemetry to update room conditions
    const unsub = socketClient.onTelemetry((t) => {
      if (t.roomNumber) {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.roomNumber === t.roomNumber) {
              return {
                ...r,
                ...(t.metrics.temperature !== undefined && { currentTemperature: t.metrics.temperature }),
                ...(t.metrics.humidity !== undefined && { currentHumidity: t.metrics.humidity }),
                ...(t.metrics.ambientLightLux !== undefined && { currentLightLux: t.metrics.ambientLightLux }),
                ...(t.metrics.occupancy !== undefined && { currentOccupancy: t.metrics.occupancy }),
                ...(t.metrics.relayState !== undefined && { lightingState: t.metrics.relayState }),
              };
            }
            return r;
          })
        );
      }
    });

    return () => unsub();
  }, []);

  const getRoomStatusDetails = (room: Room) => {
    if (room.maintenanceStatus === 'UNDER_MAINTENANCE') {
      return {
        label: 'Under Maintenance',
        color: 'border-purple-300 bg-purple-50 text-purple-700',
        badge: 'bg-purple-100 text-purple-800',
        icon: Wrench,
      };
    }
    if ((room.currentTemperature || 0) > 30.0) {
      return {
        label: 'Environmental Warning',
        color: 'border-amber-300 bg-amber-50 text-amber-800',
        badge: 'bg-amber-100 text-amber-800',
        icon: AlertTriangle,
      };
    }
    if (room.currentOccupancy) {
      return {
        label: 'Occupied',
        color: 'border-blue-300 bg-blue-50/50 text-blue-900',
        badge: 'bg-blue-100 text-blue-800',
        icon: Users,
      };
    }
    return {
      label: 'Available',
      color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800',
      icon: CheckCircle,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Classroom & Floor Plan Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial occupancy indicators, thermal mapping, and ambient lighting status
          </p>
        </div>

        {/* Floor Level Filter Tabs */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {[1, 2, 3, 4].map((fl) => (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFloor === fl
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Floor {fl}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Plan Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          Live Status Legend:
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Occupied Room
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Available Room
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Environmental Warning
          </span>
          <span className="flex items-center gap-1.5 text-purple-700">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span> Under Maintenance
          </span>
        </div>
      </div>

      {/* Visual Spatial Floor Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const status = getRoomStatusDetails(room);
          const StatusIcon = status.icon;

          return (
            <div
              key={room._id}
              className={`rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${status.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
                  {room.roomNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${status.badge}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">{room.name}</h2>
              <p className="text-xs text-slate-500 mb-4">{room.type} &bull; Capacity: {room.capacity}</p>

              {/* Live Sensor Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-200/60 text-center">
                <div>
                  <span className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Thermometer className="h-3 w-3 text-blue-500" />
                    Temp
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {room.currentTemperature}°C
                  </span>
                </div>
                <div>
                  <span className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Droplets className="h-3 w-3 text-cyan-500" />
                    Humidity
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {room.currentHumidity}%
                  </span>
                </div>
                <div>
                  <span className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Sun className="h-3 w-3 text-amber-500" />
                    Ambient
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {room.currentLightLux} Lx
                  </span>
                </div>
              </div>

              {/* Bottom State Details */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      room.lightingState ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  ></span>
                  Lights: {room.lightingState ? 'ON' : 'OFF'}
                </span>
                <span className="font-semibold text-slate-700">
                  {room.currentOccupancy ? `${room.occupancyCount} Occupants` : 'Empty'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

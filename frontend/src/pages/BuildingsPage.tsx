import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Layers, Users, Zap, Droplets } from 'lucide-react';
import { Building } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const BuildingsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/buildings')
      .then((res) => {
        if (res.data?.data) {
          setBuildings(res.data.data);
        }
      })
      .catch(() => {
        // Fallback default buildings
        setBuildings([
          {
            _id: 'bld_1',
            code: 'BLD-ENG-01',
            name: 'Engineering & Technology Complex',
            campusZone: 'North Sector',
            totalFloors: 4,
            totalRooms: 32,
            managerName: 'Elena Rostova',
            contactEmail: 'eng-facilities@nexasmart.io',
            electricityTariff: 0.15,
            waterTariff: 0.002,
          },
          {
            _id: 'bld_2',
            code: 'BLD-SCI-01',
            name: 'Science & Advanced Research Center',
            campusZone: 'East Sector',
            totalFloors: 3,
            totalRooms: 24,
            managerName: 'Elena Rostova',
            contactEmail: 'sci-facilities@nexasmart.io',
            electricityTariff: 0.16,
            waterTariff: 0.002,
          },
          {
            _id: 'bld_3',
            code: 'BLD-ADM-01',
            name: 'Administration & Student Services Tower',
            campusZone: 'Central Quad',
            totalFloors: 2,
            totalRooms: 14,
            managerName: 'Marcus Vance',
            contactEmail: 'admin-facilities@nexasmart.io',
            electricityTariff: 0.14,
            waterTariff: 0.002,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Campus Buildings & Infrastructure
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial governance across multi-tenant buildings, zones, and metering tariffs
          </p>
        </div>
        {hasRole('Campus Administrator') && (
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 self-start">
            <Plus className="h-4 w-4" />
            Register Building
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((b) => (
          <div
            key={b._id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                  {b.code}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {b.campusZone}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2">{b.name}</h2>

              <div className="grid grid-cols-2 gap-3 my-4 py-3 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>{b.totalFloors} Floor Levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>{b.totalRooms} Rooms/Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>${b.electricityTariff}/kWh Tariff</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  <span>${b.waterTariff}/L Tariff</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {b.managerName || 'Facility Manager'}
              </span>
              <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                View Floors &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

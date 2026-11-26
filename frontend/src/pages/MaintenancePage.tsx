import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, Clock, DollarSign, UserCheck, AlertTriangle } from 'lucide-react';
import { MaintenanceRequest } from '../types/index.js';
import { StatusBadge } from '../components/common/Badge.js';
import { StatCard } from '../components/common/StatCard.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const MaintenancePage: React.FC = () => {
  const { hasRole, canControlDevices } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([
    {
      _id: 'mr_1',
      requestId: 'MR-1001',
      title: 'PZEM Module Calibration Check',
      description: 'Verify current transformer CT ratio against calibrated bench meter.',
      priority: 'Medium',
      status: 'Assigned',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'PANEL-MAIN',
      deviceId: 'DEV-ESP32-PWR-01',
      reportedBy: 'energy@nexasmart.io',
      assignedToTechnicianName: 'Liam Chen',
      estimatedCost: 120,
      actualCost: 95,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'mr_2',
      requestId: 'MR-1002',
      title: 'Auto-generated: Water Leak Detected',
      description: 'Automated maintenance ticket created from alert ALT-WTR-01 in pump room.',
      priority: 'Critical',
      status: 'In Progress',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      deviceId: 'DEV-ESP32-WTR-01',
      reportedBy: 'SYSTEM_AUTOPILOT',
      assignedToTechnicianName: 'Liam Chen',
      estimatedCost: 250,
      actualCost: 180,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  useEffect(() => {
    api
      .get('/maintenance')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setRequests(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const totalCost = requests.reduce((acc, r) => acc + (r.actualCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Maintenance & Work Order Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preventative work orders, technician assignments, parts logs, and actual repair expense tracking
          </p>
        </div>

        {canControlDevices() && (
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 self-start">
            <Plus className="h-4 w-4" />
            New Work Order
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Active Work Orders"
          value={requests.length}
          subtitle="Physical Facility Tasks"
          icon={Wrench}
          accentColor="blue"
        />
        <StatCard
          title="In Progress"
          value={requests.filter((r) => r.status === 'In Progress').length}
          subtitle="Assigned to Technicians"
          icon={Clock}
          accentColor="amber"
        />
        <StatCard
          title="Completed Orders"
          value={requests.filter((r) => r.status === 'Completed').length}
          subtitle="Inspected and Signed off"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Total Maintenance Cost"
          value={`$${totalCost}`}
          subtitle="YTD Repair Expenses"
          icon={DollarSign}
          accentColor="indigo"
        />
      </div>

      {/* Maintenance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Facility Work Order Registry</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Work Order #</th>
                <th className="px-4 py-3">Task Title & Details</th>
                <th className="px-4 py-3">Building & Zone</th>
                <th className="px-4 py-3">Assigned Technician</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actual Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{req.requestId}</td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <span className="font-bold text-slate-900 block">{req.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{req.description}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-blue-600 font-bold">{req.buildingCode}</span> &bull; {req.roomNumber}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {req.assignedToTechnicianName || 'Unassigned'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        req.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : req.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                    ${req.actualCost || 0}
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

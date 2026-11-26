import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Filter, Check, X, ShieldAlert } from 'lucide-react';
import { Alert } from '../types/index.js';
import { StatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { socketClient } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';

export const AlertsPage: React.FC = () => {
  const { canControlDevices } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      _id: 'alt_1',
      alertId: 'ALT-WTR-01',
      deviceId: 'DEV-ESP32-WTR-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      category: 'WATER_LEAKAGE',
      severity: 'CRITICAL',
      title: 'Water Leak Detected',
      description: 'Moisture probe detected liquid contact on mechanical floor.',
      status: 'New',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'alt_2',
      alertId: 'ALT-ENV-01',
      deviceId: 'DEV-ESP32-ENV-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-205',
      category: 'TEMPERATURE_THRESHOLD',
      severity: 'MEDIUM',
      title: 'Elevated Room Temperature (33.2°C)',
      description: 'Zone RM-205 ambient temperature exceeded upper 32°C threshold.',
      status: 'Acknowledged',
      acknowledgedBy: 'facility@nexasmart.io',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  const [statusFilter, setStatusFilter] = useState('');

  const fetchAlerts = () => {
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    api
      .get('/alerts', { params })
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setAlerts(res.data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();

    const unsub = socketClient.onAlert((newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => unsub();
  }, [statusFilter]);

  const handleUpdateStatus = async (alertId: string, nextStatus: string) => {
    if (!canControlDevices()) return;
    try {
      await api.patch(`/alerts/${alertId}/status`, {
        status: nextStatus,
        resolutionNotes: `Status changed to ${nextStatus} via Alert Console`,
      });
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, status: nextStatus as any } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update alert');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Campus Alert & Incident Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle management: New &rarr; Acknowledged &rarr; In Progress &rarr; Resolved &rarr; Closed
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm self-start"
        >
          <option value="">All Alert Statuses</option>
          <option value="New">New</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Alert Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Building & Room</th>
                <th className="px-4 py-3">Incident Description</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {alerts.map((alert) => (
                <tr key={alert._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{alert.alertId}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {alert.category.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-blue-600 font-bold">{alert.buildingCode}</span> &bull; {alert.roomNumber}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <span className="font-bold text-slate-900 block">{alert.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{alert.description}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={alert.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {canControlDevices() ? (
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === 'New' && (
                          <button
                            onClick={() => handleUpdateStatus(alert._id, 'Acknowledged')}
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px]"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status === 'Acknowledged' && (
                          <button
                            onClick={() => handleUpdateStatus(alert._id, 'Resolved')}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {alert.status === 'Resolved' && (
                          <span className="text-[11px] text-slate-400 font-medium">Closed</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Read-only</span>
                    )}
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

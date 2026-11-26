import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Filter, Calendar, BarChart2 } from 'lucide-react';
import { api } from '../services/api.js';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('ENERGY');
  const [buildingFilter, setBuildingFilter] = useState('BLD-ENG-01');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-18');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports', {
        params: {
          reportType,
          buildingCode: buildingFilter,
          from: startDate,
          to: endDate,
        },
      });
      setReportData(res.data?.data);
    } catch (err) {
      console.warn('Report query error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, buildingFilter]);

  const handleDownloadCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Building,Value,Timestamp\n' +
      `Active Energy Total,${buildingFilter},1420.5 kWh,${new Date().toISOString()}\n` +
      `Water Reservoir Total,${buildingFilter},4850.0 Liters,${new Date().toISOString()}\n` +
      `Campus Device Fleet Uptime,${buildingFilter},98.2%,${new Date().toISOString()}\n` +
      `Work Orders Total Cost,${buildingFilter},$275.00,${new Date().toISOString()}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NexaSmart_${reportType}_Report_${buildingFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Campus Analytics & Reporting Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated time-series audit queries, historical resource consumption, and exportable data
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 self-start"
        >
          <Download className="h-4 w-4" />
          Export CSV Summary
        </button>
      </div>

      {/* Filter Parameters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Query Parameters & Filters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Category
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ENERGY">Energy Consumption & Tariffs</option>
              <option value="WATER">Water Resource & Consumption</option>
              <option value="UPTIME">Device Fleet Uptime & Heartbeats</option>
              <option value="ENVIRONMENT">Environmental IAQ Trends</option>
              <option value="OCCUPANCY">Classroom Space Utilization</option>
              <option value="MAINTENANCE">Facility Maintenance & Costs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Building
            </label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="BLD-ENG-01">Engineering Complex (BLD-ENG-01)</option>
              <option value="BLD-SCI-01">Science Center (BLD-SCI-01)</option>
              <option value="BLD-ADM-01">Administration Tower (BLD-ADM-01)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Energy Aggregate</h3>
          <p className="text-2xl font-bold text-slate-900">1,420.5 kWh</p>
          <p className="text-xs text-slate-500 mt-1">Total electricity billed at configured tariff</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-500">Estimated Cost:</span>
            <span className="font-bold text-slate-900">$213.08</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Water Consumption</h3>
          <p className="text-2xl font-bold text-slate-900">4,850.0 Liters</p>
          <p className="text-xs text-slate-500 mt-1">Cumulative flow through YF-S201 meters</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-500">Estimated Cost:</span>
            <span className="font-bold text-slate-900">$9.70</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Fleet Reliability</h3>
          <p className="text-2xl font-bold text-emerald-600">98.2% Uptime</p>
          <p className="text-xs text-slate-500 mt-1">Based on watchdog keepalive heartbeats</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-500">Offline Incidents:</span>
            <span className="font-bold text-slate-900">1 node</span>
          </div>
        </div>
      </div>
    </div>
  );
};

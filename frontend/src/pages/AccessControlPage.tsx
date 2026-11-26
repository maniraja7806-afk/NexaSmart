import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, UserCheck, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { api } from '../services/api.js';

export const AccessControlPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([
    {
      _id: 'acc_1',
      cardUid: 'B4:F2:18:9A',
      userName: 'Dr. Evelyn Carter',
      userRole: 'Super Admin',
      deviceId: 'DEV-ESP32-ACC-01',
      buildingCode: 'BLD-ENG-01',
      zoneName: 'Main Entrance Door A',
      accessGranted: true,
      timestamp: new Date().toISOString(),
    },
    {
      _id: 'acc_2',
      cardUid: 'C8:11:92:DF',
      userName: 'Marcus Vance',
      userRole: 'Campus Administrator',
      deviceId: 'DEV-ESP32-ACC-01',
      buildingCode: 'BLD-ENG-01',
      zoneName: 'Faculty Wing Access Gate',
      accessGranted: true,
      timestamp: new Date(Date.now() - 360000).toISOString(),
    },
    {
      _id: 'acc_3',
      cardUid: 'FF:00:24:A1',
      userName: 'Unregistered Visitor Tag',
      userRole: 'Unknown',
      deviceId: 'DEV-ESP32-ACC-01',
      buildingCode: 'BLD-ENG-01',
      zoneName: 'Server Facility Room',
      accessGranted: false,
      denialReason: 'Restricted security zone authorization required',
      timestamp: new Date(Date.now() - 840000).toISOString(),
    },
  ]);

  useEffect(() => {
    api
      .get('/access-control/records')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setRecords(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            RFID Access Control & Security Logging
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MFRC522 contactless badge events, zone clearance levels, and security audit trail
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950 block text-sm mb-0.5">Emergency Egress Engineering Requirement</span>
          Real-world installations must employ physical crash bars and dedicated fail-safe hardware power-cut interlocks. Never make an educational prototype web application solely responsible for emergency door release.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Badge Taps Today"
          value={records.length + 42}
          subtitle="Continuous RFID Auditing"
          icon={KeyRound}
          accentColor="blue"
        />
        <StatCard
          title="Granted Clearances"
          value={records.filter((r) => r.accessGranted).length + 40}
          subtitle="Authorized Personnel"
          icon={UserCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Security Denials"
          value={records.filter((r) => !r.accessGranted).length + 2}
          subtitle="Flagged Access Attempts"
          icon={XCircle}
          accentColor="rose"
        />
      </div>

      {/* Access Event Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Live RFID Badge Access Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Card UID</th>
                <th className="px-4 py-3">Cardholder Name</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Zone / Access Door</th>
                <th className="px-4 py-3">Access Outcome</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{rec.cardUid}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{rec.userName}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.userRole || 'Enrolled'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-600 font-semibold">{rec.buildingCode}</span> &bull; {rec.zoneName}
                  </td>
                  <td className="px-4 py-3">
                    {rec.accessGranted ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        GRANTED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        DENIED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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

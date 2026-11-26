import React from 'react';
import { Users, ShieldCheck, Mail, Building, Plus } from 'lucide-react';
import { DEMO_USERS } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            User Management & Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Governance of 9 system roles, administrative permissions, and zone authorizations
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Authorized Personnel Registry</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Personnel Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Permission Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(Object.keys(DEMO_USERS) as UserRole[]).map((role) => {
                const u = DEMO_USERS[role];
                return (
                  <tr key={role} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{u.email}</td>
                    <td className="px-4 py-3.5 text-slate-600">{u.dept}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {role === 'Super Admin'
                        ? 'Full Unrestricted System Governance'
                        : role === 'Viewer'
                        ? 'Read-Only (Control Prohibited)'
                        : `${role} Module Authority`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

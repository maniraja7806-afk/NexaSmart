import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, LogOut, ShieldCheck, Play, Pause, RotateCcw } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext.js';
import { UserRole } from '../../types/index.js';
import { api } from '../../services/api.js';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout, loginAsRole } = useAuth();
  const [simRunning, setSimRunning] = useState(true);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Check initial simulator status
    api.get('/simulator/status').then((res) => {
      if (res.data?.data) {
        setSimRunning(res.data.data.isRunning);
      }
    }).catch(() => {});

    // Fetch initial alerts count
    api.get('/alerts?status=New').then((res) => {
      if (res.data?.data) {
        setUnreadAlerts(res.data.data.slice(0, 5));
      }
    }).catch(() => {});
  }, []);

  const toggleSimulator = async () => {
    try {
      if (simRunning) {
        await api.post('/simulator/pause');
        setSimRunning(false);
      } else {
        await api.post('/simulator/start');
        setSimRunning(true);
      }
    } catch (err) {
      setSimRunning(!simRunning);
    }
  };

  const handleResetSimulator = async () => {
    try {
      await api.post('/simulator/reset');
      setSimRunning(true);
    } catch (err) {}
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search */}
        <div className="relative hidden md:block w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search buildings, rooms, devices..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulator Control Widget */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${simRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}
            ></span>
            Simulator
          </span>
          <button
            onClick={toggleSimulator}
            title={simRunning ? 'Pause Simulator' : 'Start Simulator'}
            className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
          >
            {simRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleResetSimulator}
            title="Reset Simulator Baseline"
            className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live Broker Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>MQTT Connected</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative"
          >
            <Bell className="h-5 w-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Active Notifications</span>
                <span className="text-[11px] text-blue-600 font-medium cursor-pointer">Mark all read</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {unreadAlerts.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">No unread alerts</p>
                ) : (
                  unreadAlerts.map((a: any, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-semibold text-slate-900">{a.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{a.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Role Switcher & User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-slate-900 leading-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold tracking-wide">
                <ShieldCheck className="h-3 w-3" />
                {user?.role || 'Super Admin'}
              </span>
            </div>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Switch Active Role (RBAC Demo)
                </p>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {(Object.keys(DEMO_USERS) as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      loginAsRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                      user?.role === r ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{r}</span>
                    {user?.role === r && <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

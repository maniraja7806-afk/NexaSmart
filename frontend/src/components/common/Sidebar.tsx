import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Cpu,
  Activity,
  Zap,
  Lightbulb,
  CloudSun,
  Droplets,
  ShieldAlert,
  Car,
  KeyRound,
  Wrench,
  Sliders,
  Bell,
  FileSpreadsheet,
  Users,
  Settings,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navSections = [
  {
    title: 'Core Management',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/buildings', label: 'Buildings', icon: Building2 },
      { to: '/floors-rooms', label: 'Floors & Rooms', icon: Layers },
      { to: '/devices', label: 'Device Management', icon: Cpu },
      { to: '/live', label: 'Live Monitoring', icon: Activity },
    ],
  },
  {
    title: 'IoT Subsystems',
    items: [
      { to: '/energy', label: 'Energy Management', icon: Zap },
      { to: '/lighting', label: 'Smart Lighting', icon: Lightbulb },
      { to: '/environment', label: 'Environment & IAQ', icon: CloudSun },
      { to: '/water', label: 'Water Management', icon: Droplets },
      { to: '/safety', label: 'Fire & Safety', icon: ShieldAlert },
      { to: '/parking', label: 'Smart Parking', icon: Car },
      { to: '/access-control', label: 'Access Control', icon: KeyRound },
      { to: '/waste', label: 'Waste Management', icon: Trash2 },
      { to: '/equipment', label: 'Equipment Health', icon: Wrench },
    ],
  },
  {
    title: 'Operations & Rules',
    items: [
      { to: '/automation', label: 'Automation Rules', icon: Sliders },
      { to: '/alerts', label: 'Alert Center', icon: Bell },
      { to: '/maintenance', label: 'Maintenance Hub', icon: Wrench },
      { to: '/reports', label: 'Reports & Analytics', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'User Management', icon: Users },
      { to: '/settings', label: 'System Settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg">
              N
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">NexaSmart</span>
              <span className="block text-[10px] text-blue-400 font-mono tracking-wider uppercase font-semibold">
                IoT Campus OS
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-[11px]">Broker: Mosquitto 1883</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">v1.4.2</span>
        </div>
      </aside>
    </>
  );
};

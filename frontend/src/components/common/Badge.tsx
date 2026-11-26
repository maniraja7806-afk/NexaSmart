import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variantStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const SimulatedBadge: React.FC<{ isSimulated?: boolean }> = ({ isSimulated }) => {
  if (isSimulated) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 tracking-wide">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
        SIMULATED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wide">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
      REAL HARDWARE
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'online':
    case 'available':
    case 'normal':
    case 'resolved':
    case 'completed':
      return <Badge variant="green">{status}</Badge>;
    case 'offline':
    case 'occupied':
    case 'critical':
    case 'fault':
    case 'error':
      return <Badge variant="red">{status}</Badge>;
    case 'warning':
    case 'needs_inspection':
    case 'acknowledged':
    case 'waiting for parts':
    case 'in progress':
      return <Badge variant="amber">{status}</Badge>;
    case 'reserved':
    case 'maintenance':
    case 'under_maintenance':
      return <Badge variant="purple">{status}</Badge>;
    default:
      return <Badge variant="slate">{status || 'Unknown'}</Badge>;
  }
};

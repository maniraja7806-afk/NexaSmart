import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCircle2 } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export const LoginPage: React.FC = () => {
  const { login, loginAsRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('superadmin@nexasmart.io');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await loginAsRole(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20">
          N
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
          NexaSmart Operations Portal
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Smart Campus & Building Management Telemetry Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorized Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="admin@nexasmart.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with Secure Credentials'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick RBAC Switcher for Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1-Click Role Switcher (9 RBAC Roles)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Select any role below to instantly load and test its backend permissions:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(DEMO_USERS) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleQuickRoleSelect(r)}
                  className="p-2 rounded-lg bg-slate-900/70 hover:bg-blue-600/20 border border-slate-700/80 hover:border-blue-500/50 text-left transition-all group"
                >
                  <span className="block text-xs font-bold text-white group-hover:text-blue-300 truncate">
                    {r}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                    {DEMO_USERS[r].dept}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Standard demo password across all accounts: <code className="text-slate-300 font-mono">Password123!</code></p>
        </div>
      </div>
    </div>
  );
};

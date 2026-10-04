import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import apiClient from '../../api/client';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@financeerp.com');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { company } = useCompanyProfile();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await apiClient.post('/auth/login', { email, password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-1 bg-[#072661] rounded-2xl border border-slate-700 shadow-xl mb-3">
            <img
              src="/brand/apple-touch-icon.png"
              alt="FinFlow Official Logo"
              className="h-16 w-16 rounded-xl object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">FinFlow</h1>
          <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold mt-1">
            Private Finance Management
          </p>

          {/* Dynamic Client Company Name */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold shadow-sm">
            <Building className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{company?.name || 'Sri Lakshmi Finance'}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Sign In to Dashboard</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your authorized operator credentials</p>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@financeerp.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
                />
              </div>
            </div>

            {/* Quick credentials switcher */}
            <div className="pt-1">
              <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Quick Demo Profiles:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@financeerp.com');
                    setPassword('Admin@123456');
                  }}
                  className="py-1 px-2 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-center border border-slate-700"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@financeerp.com');
                    setPassword('Manager@123456');
                  }}
                  className="py-1 px-2 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-center border border-slate-700"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@financeerp.com');
                    setPassword('Staff@123456');
                  }}
                  className="py-1 px-2 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-center border border-slate-700"
                >
                  Staff
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-glow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          FinFlow • Product by <span className="text-slate-300 font-bold">MSR Solutions</span>
        </p>
      </div>
    </div>
  );
};

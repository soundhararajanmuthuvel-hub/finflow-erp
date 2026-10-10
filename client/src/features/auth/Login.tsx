import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import apiClient from '../../api/client';
import { AccessibleInput, AccessibleButton } from '../../components/common/AccessibleComponents';

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
      } else {
        setError('Login failed: Invalid server response');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-2 bg-white rounded-2xl border border-slate-200 shadow-sm mb-3">
            <img
              src="/brand/apple-touch-icon.png"
              alt="FinFlow Official Logo"
              className="h-12 w-12 rounded-xl object-contain bg-[#072661] p-1"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            FinFlow
          </h1>
          <p className="text-xs sm:text-sm text-[#8B1A1A] font-bold tracking-wide mt-0.5">
            Private Finance Management
          </p>

          {/* Dynamic Client Company Name */}
          <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs sm:text-sm text-slate-700 font-semibold shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-[#8B1A1A] shrink-0" />
            <span>{company?.name || 'Sri Lakshmi Finance'}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-card-hover tamil-accent-top">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Operator Sign In</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Enter your registered operator credentials to access the ERP
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm font-medium"
            >
              <AlertCircle className="h-5 w-5 shrink-0 stroke-[2.2] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AccessibleInput
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@financeerp.com"
              icon={Mail}
              autoComplete="email"
            />

            <AccessibleInput
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              autoComplete="current-password"
            />

            {/* Quick credentials switcher */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Quick Demo Operator Profiles:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@financeerp.com');
                    setPassword('Admin@123456');
                  }}
                  className="py-1.5 px-2 text-xs sm:text-sm rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-center border border-slate-200 hover:border-[#8B1A1A]/40 shadow-2xs transition-all active:scale-95"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@financeerp.com');
                    setPassword('Manager@123456');
                  }}
                  className="py-1.5 px-2 text-xs sm:text-sm rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-center border border-slate-200 hover:border-[#8B1A1A]/40 shadow-2xs transition-all active:scale-95"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@financeerp.com');
                    setPassword('Staff@123456');
                  }}
                  className="py-1.5 px-2 text-xs sm:text-sm rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-center border border-slate-200 hover:border-[#8B1A1A]/40 shadow-2xs transition-all active:scale-95"
                >
                  Staff
                </button>
              </div>
            </div>

            <AccessibleButton
              type="submit"
              variant="primary"
              size="normal"
              icon={ArrowRight}
              iconPosition="right"
              isLoading={loading}
              className="w-full text-sm sm:text-base font-semibold shadow-sm mt-2"
            >
              Sign In to FinFlow
            </AccessibleButton>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            FinFlow • Private Finance Management
          </p>
          <p className="text-xs font-semibold text-slate-600">
            Product by <span className="text-[#8B1A1A]">MSR Solutions</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

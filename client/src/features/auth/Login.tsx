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
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-1.5 bg-white rounded-2xl border-2 border-[#D6CFC4] shadow-warm mb-3">
            <img
              src="/brand/apple-touch-icon.png"
              alt="FinFlow Official Logo"
              className="h-14 w-14 rounded-xl object-contain bg-[#072661] p-1"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            FinFlow
          </h1>
          <p className="text-xs sm:text-sm text-[#8B1A1A] font-extrabold mt-0.5">
            Private Finance Management
          </p>

          {/* Dynamic Client Company Name */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#D6CFC4] text-sm text-[#1A1A1A] font-bold shadow-sm">
            <Building2 className="h-4 w-4 text-[#8B1A1A] shrink-0" />
            <span>{company?.name || 'Sri Lakshmi Finance'}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-[#D6CFC4] rounded-2xl p-5 sm:p-8 shadow-warm-lg tamil-accent-top">
          <div className="mb-5 pb-3 border-b-2 border-[#EDE7DE]">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Operator Sign In</h2>
            <p className="text-sm text-[#52525B] mt-0.5 font-medium">
              Enter your registered operator credentials
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-[#FEE2E2] border-2 border-[#FECACA] flex items-start gap-2.5 text-[#B91C1C] text-sm font-bold"
            >
              <AlertCircle className="h-5 w-5 shrink-0 stroke-[2.3] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border-2 border-[#EDE7DE]">
              <p className="text-xs font-bold text-[#52525B] mb-2">
                Quick Demo Operator Profiles:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@financeerp.com');
                    setPassword('Admin@123456');
                  }}
                  className="py-2 px-2.5 text-sm rounded-lg bg-white hover:bg-[#FAF7F2] text-[#1A1A1A] font-bold text-center border-2 border-[#D6CFC4] hover:border-[#8B1A1A] shadow-sm transition-all"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@financeerp.com');
                    setPassword('Manager@123456');
                  }}
                  className="py-2 px-2.5 text-sm rounded-lg bg-white hover:bg-[#FAF7F2] text-[#1A1A1A] font-bold text-center border-2 border-[#D6CFC4] hover:border-[#8B1A1A] shadow-sm transition-all"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@financeerp.com');
                    setPassword('Staff@123456');
                  }}
                  className="py-2 px-2.5 text-sm rounded-lg bg-white hover:bg-[#FAF7F2] text-[#1A1A1A] font-bold text-center border-2 border-[#D6CFC4] hover:border-[#8B1A1A] shadow-sm transition-all"
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
              className="w-full text-base font-bold"
            >
              Sign In to FinFlow
            </AccessibleButton>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-base font-semibold text-[#52525B]">
            FinFlow • Private Finance Management
          </p>
          <p className="text-sm font-bold text-[#1A1A1A]">
            Product by <span className="text-[#8B1A1A]">MSR Solutions</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { Building2, Save, Users, CheckCircle2, AlertCircle, Globe, Mail, Phone, MapPin, CreditCard, Percent } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { company, updateCompany, isLoading } = useCompanyProfile();

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState('10.00');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setLegalName(company.legalName || '');
      setLogoUrl(company.logoUrl || '');
      setWebsite(company.website || '');
      setEmail(company.email || '');
      setPhone(company.phone || '');
      setAddress(company.address || '');
      setCity(company.city || '');
      setState(company.state || '');
      setPincode(company.pincode || '');
      setCurrencySymbol(company.currencySymbol || '₹');
      setDefaultCommissionRate(String(company.defaultCommissionRate || '10.00'));
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedSuccess(false);
    setIsSaving(true);

    try {
      await updateCompany({
        name,
        legalName,
        logoUrl,
        website,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        currencySymbol,
        defaultCommissionRate: Number(defaultCommissionRate),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update company profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Company Profile & System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure dynamic business branding, letterhead details, legal identifiers, and financial defaults
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs font-bold shadow-md">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Company profile updated successfully! All screens, statements, and schedules have updated with new branding.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs font-bold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Company Profile Form */}
      <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Company Branding & Letterhead</h3>
              <p className="text-xs text-slate-400">Dynamic source of truth used across all documents, exports, and dashboards</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Company Name (Brand / Display Name) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ABC Finance Solutions"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Legal Registered Entity Name
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. ABC Finance & Investments Pvt. Ltd."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Logo URL / Image Link
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Official Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.abcfinance.in"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Official Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@abcfinance.in"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Official Phone / Helpline
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Office / Operating Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Suite 402, Financial Commercial Complex, BKC"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              State & Pincode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="400051"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Currency Symbol
            </label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
              Standard Management Commission Default (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={defaultCommissionRate}
              onChange={(e) => setDefaultCommissionRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </form>

      {/* Operator Session Details */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Active Operator Session</h3>
            <p className="text-xs text-slate-400">Authenticated user identity and role authorizations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Operator Name</span>
            <p className="font-bold text-white mt-1">{user?.fullName}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Email Address</span>
            <p className="font-bold text-white mt-1">{user?.email}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Assigned Role</span>
            <p className="font-bold text-emerald-400 uppercase mt-1">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import {
  Building2,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Percent,
} from 'lucide-react';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleCard,
  AccessibleBanner,
} from '../../components/common/AccessibleComponents';
import { formatRole } from '../../utils/formatters';

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
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update company profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="pb-4 border-b-2 border-[#D6CFC4]">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#1A1A1A] tracking-tight">
          Company Profile & System Settings
        </h1>
        <p className="text-sm sm:text-base font-medium text-[#52525B] mt-1">
          Configure dynamic business branding, letterhead details, and financial parameters
        </p>
      </div>

      {savedSuccess && (
        <AccessibleBanner
          type="success"
          title="Company Profile Saved!"
          message="All letterheads, schedules, statement documents, and sidebars have been dynamically updated with your new company information."
        />
      )}

      {errorMsg && (
        <AccessibleBanner
          type="danger"
          title="Update Error"
          message={errorMsg}
        />
      )}

      {/* Company Profile Form */}
      <AccessibleCard withTopAccent className="p-4 sm:p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#EDE7DE] pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#FDF2F2] text-[#8B1A1A] border-2 border-[#F8CFCF] flex items-center justify-center font-bold shrink-0">
                <Building2 className="h-5 w-5 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] text-lg">
                  Company Branding & Letterhead
                </h3>
                <p className="text-sm text-[#52525B] font-medium">
                  Dynamic company name and contact info used across all official documents
                </p>
              </div>
            </div>
            <AccessibleButton
              type="submit"
              variant="primary"
              size="normal"
              icon={Save}
              isLoading={isSaving}
            >
              Save Profile
            </AccessibleButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
            <AccessibleInput
              label="Company Name (Brand / Display Name)"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sri Lakshmi Finance"
            />

            <AccessibleInput
              label="Legal Registered Entity Name"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Sri Lakshmi Finance & Investments Pvt. Ltd."
            />

            <AccessibleInput
              label="Official Phone / Helpline"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <AccessibleInput
              label="Official Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@srilakshmifinance.in"
            />

            <AccessibleInput
              label="Official Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.srilakshmifinance.in"
            />

            <AccessibleInput
              label="Logo URL / Image Link"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />

            <div className="sm:col-span-2">
              <AccessibleInput
                label="Office / Operating Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="42, South Masi Street, Madurai"
              />
            </div>

            <AccessibleInput
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Madurai"
            />

            <div className="grid grid-cols-2 gap-4">
              <AccessibleInput
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Tamil Nadu"
              />
              <AccessibleInput
                label="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="625001"
              />
            </div>

            <AccessibleInput
              label="Currency Symbol"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
            />

            <AccessibleInput
              label="Standard Management Commission Default (%)"
              type="number"
              step="0.1"
              value={defaultCommissionRate}
              onChange={(e) => setDefaultCommissionRate(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-[#EDE7DE]">
            <AccessibleButton
              type="submit"
              variant="primary"
              size="normal"
              icon={Save}
              isLoading={isSaving}
            >
              Save Profile
            </AccessibleButton>
          </div>
        </form>
      </AccessibleCard>

      {/* Operator Session Details */}
      <AccessibleCard withTopAccent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-[#EDE7DE]">
          <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] border-2 border-[#BFDBFE] flex items-center justify-center font-bold shrink-0">
            <Users className="h-5 w-5 stroke-[2.3]" />
          </div>
          <div>
            <h3 className="font-bold text-[#1A1A1A] text-lg">Active Operator Session</h3>
            <p className="text-sm text-[#52525B] font-medium">
              Authenticated user identity and role authorizations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-base">
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4]">
            <span className="text-xs sm:text-sm font-bold text-[#3F3F46] block">Operator Name</span>
            <p className="font-extrabold text-[#1A1A1A] text-base mt-1">{user?.fullName}</p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4]">
            <span className="text-xs sm:text-sm font-bold text-[#3F3F46] block">Email Address</span>
            <p className="font-bold text-[#1A1A1A] text-sm mt-1 break-words">{user?.email}</p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4]">
            <span className="text-xs sm:text-sm font-bold text-[#3F3F46] block">Assigned Role</span>
            <p className="font-extrabold text-[#8B1A1A] text-base mt-1">{formatRole(user?.role)}</p>
          </div>
        </div>
      </AccessibleCard>
    </div>
  );
};

export default Settings;

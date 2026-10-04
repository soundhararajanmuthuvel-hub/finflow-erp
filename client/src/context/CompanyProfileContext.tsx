import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

export interface CompanyProfile {
  id: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  currencySymbol: string;
  currencyCode: string;
  dateFormat: string;
  defaultCommissionRate: string | number;
}

interface CompanyProfileContextType {
  company: CompanyProfile;
  isLoading: boolean;
  refetchCompany: () => void;
  updateCompany: (data: Partial<CompanyProfile>) => Promise<any>;
}

const defaultCompany: CompanyProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Sri Lakshmi Finance Solutions',
  legalName: 'Sri Lakshmi Finance & Investments Pvt. Ltd.',
  website: 'www.srilakshmifinance.com',
  email: 'contact@srilakshmifinance.com',
  phone: '+91 98765 43210',
  address: 'Suite 402, Financial Commercial Complex',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400051',
  country: 'India',
  currencySymbol: '₹',
  currencyCode: 'INR',
  dateFormat: 'DD/MM/YYYY',
  defaultCommissionRate: '10.00',
};

const CompanyProfileContext = createContext<CompanyProfileContextType | undefined>(undefined);

export const CompanyProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['company-profile', user?.company?.id],
    queryFn: async () => {
      try {
        const res: any = await apiClient.get('/company');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user,
  });

  const company: CompanyProfile = data || defaultCompany;

  // Dynamic Browser Tab Title (Requirement 5)
  useEffect(() => {
    if (company?.name) {
      document.title = `${company.name} — FinFlow`;
    } else {
      document.title = 'FinFlow — Private Finance Management';
    }
  }, [company?.name]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<CompanyProfile>) => {
      const res: any = await apiClient.patch('/company', payload);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['company-profile', user?.company?.id], updated);
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
  });

  const updateCompany = async (newData: Partial<CompanyProfile>) => {
    return updateMutation.mutateAsync(newData);
  };

  return (
    <CompanyProfileContext.Provider
      value={{
        company,
        isLoading,
        refetchCompany: refetch,
        updateCompany,
      }}
    >
      {children}
    </CompanyProfileContext.Provider>
  );
};

export const useCompanyProfile = () => {
  const context = useContext(CompanyProfileContext);
  if (!context) {
    throw new Error('useCompanyProfile must be used within a CompanyProfileProvider');
  }
  return context;
};

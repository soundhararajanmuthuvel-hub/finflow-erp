import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CompanyProfileProvider } from './context/CompanyProfileContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './features/auth/Login';
import { Dashboard } from './features/dashboard/Dashboard';
import { ClientList } from './features/clients/ClientList';
import { ClientDetail } from './features/clients/ClientDetail';
import { PartnerList } from './features/partners/PartnerList';
import { InvestorList } from './features/investors/InvestorList';
import { InvestorDetail } from './features/investors/InvestorDetail';
import { DealList } from './features/deals/DealList';
import { CreateDealWizard } from './features/deals/CreateDealWizard';
import { DealDetail } from './features/deals/DealDetail';
import { RepaymentList } from './features/repayments/RepaymentList';
import { LedgerJournal } from './features/ledger/LedgerJournal';
import { ReportsHub } from './features/reports/ReportsHub';
import { AuditLogs } from './features/audit/AuditLogs';
import { Settings } from './features/settings/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProfileProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Authenticated Workspace */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="clients/:id" element={<ClientDetail />} />
                <Route path="partners" element={<PartnerList />} />
                <Route path="investors" element={<InvestorList />} />
                <Route path="investors/:id" element={<InvestorDetail />} />
                <Route path="deals" element={<DealList />} />
                <Route path="deals/new" element={<CreateDealWizard />} />
                <Route path="deals/:id" element={<DealDetail />} />
                <Route path="repayments" element={<RepaymentList />} />
                <Route path="ledger" element={<LedgerJournal />} />
                <Route path="reports" element={<ReportsHub />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CompanyProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

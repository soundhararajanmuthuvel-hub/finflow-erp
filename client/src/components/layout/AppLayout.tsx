import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 border-4 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold text-[#1A1A1A]">Loading FinFlow ERP...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#FAF7F2] text-[#1A1A1A] font-sans">
      {/* Desktop Sidebar (Persistent) */}
      <Sidebar />

      {/* Mobile / Tablet Drawer Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="relative z-10 flex w-full max-w-xs sm:max-w-sm flex-col bg-white shadow-2xl">
            <Sidebar onCloseMobile={() => setMobileDrawerOpen(false)} isMobile={true} />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <Navbar onOpenMobileMenu={() => setMobileDrawerOpen(true)} />
        <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenMore={() => setMobileDrawerOpen(true)} />
    </div>
  );
};

export default AppLayout;

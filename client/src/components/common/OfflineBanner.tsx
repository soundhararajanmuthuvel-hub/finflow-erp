import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-stone-900 text-stone-100 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between border-b-2 border-amber-500 shadow-md sticky top-0 z-50 no-print"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
        <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="flex-1">
          <strong className="text-amber-400">Offline Mode:</strong> No active internet connection. Financial writes are disabled to protect double-entry integrity.
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;

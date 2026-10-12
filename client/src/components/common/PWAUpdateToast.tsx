import React from 'react';
import { RefreshCw, X } from 'lucide-react';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAUpdateToast: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('FinFlow Service Worker registered');
    },
    onRegisterError(error: any) {
      console.error('FinFlow Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-white border-2 border-stone-800 rounded-2xl p-4 shadow-modal space-y-3 no-print"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
            <RefreshCw className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">
              {needRefresh ? 'Update Available' : 'Ready for Offline'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {needRefresh
                ? 'A new version of FinFlow is available with the latest updates.'
                : 'FinFlow is cached and ready to work in offline mode.'}
            </p>
          </div>
        </div>

        <button
          onClick={close}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {needRefresh && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={close}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Later
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-4 py-1.5 bg-[#8B1A1A] hover:bg-[#721414] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Update Now
          </button>
        </div>
      )}
    </div>
  );
};

export default PWAUpdateToast;

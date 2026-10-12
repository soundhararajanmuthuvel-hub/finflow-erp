import React from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  Send,
  ShieldCheck,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import {
  AccessibleButton,
  AccessibleCard,
  AccessibleBanner,
} from '../../components/common/AccessibleComponents';

export const NotificationSettingsSection: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    devices,
    isLoading,
    isTesting,
    statusMessage,
    clearStatus,
    subscribe,
    unsubscribe,
    sendTestNotification,
    updatePreference,
  } = usePushNotifications();

  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {statusMessage && (
        <AccessibleBanner
          type={statusMessage.type === 'success' ? 'success' : 'danger'}
          title={statusMessage.type === 'success' ? 'Success' : 'Notification Error'}
          message={statusMessage.text}
          onClose={clearStatus}
        />
      )}

      {/* Primary Push Status Card */}
      <AccessibleCard withTopAccent className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isSubscribed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {isSubscribed ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                PWA Web Push Notifications
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Receive real-time payment alerts, repayment due dates, and approval notices directly to this device
              </p>
            </div>
          </div>

          {/* Permission Status Pill */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                permission === 'granted' && isSubscribed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : permission === 'denied'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : !isSupported
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  permission === 'granted' && isSubscribed
                    ? 'bg-emerald-500'
                    : permission === 'denied'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
              />
              {permission === 'granted' && isSubscribed
                ? 'Device Subscribed'
                : permission === 'denied'
                ? 'Permission Blocked'
                : !isSupported
                ? 'Browser Unsupported'
                : 'Not Subscribed'}
            </span>
          </div>
        </div>

        {/* Browser & OS Guidance Notice */}
        {!isSupported ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Push Notifications Not Supported by This Browser</p>
              <p className="mt-0.5">
                This browser environment does not expose the standard PushManager API. In-app alerts remain active in the top navbar.
              </p>
            </div>
          </div>
        ) : isIOS && permission !== 'granted' ? (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Smartphone className="w-4 h-4 text-blue-700" />
              iPhone & iPad Push Instructions
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Apple iOS 16.4+ requires FinFlow to be installed to your Home Screen before Web Push notifications can be granted.
              Tap Safari’s <strong>Share</strong> button $\rightarrow$ <strong>Add to Home Screen</strong>, then launch FinFlow from your Home Screen.
            </p>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!isSubscribed ? (
            <AccessibleButton
              variant="primary"
              size="normal"
              icon={BellRing}
              onClick={subscribe}
              isLoading={isLoading}
              disabled={!isSupported || permission === 'denied'}
            >
              Enable Notifications on This Device
            </AccessibleButton>
          ) : (
            <>
              <AccessibleButton
                variant="outline"
                size="normal"
                icon={Send}
                onClick={sendTestNotification}
                isLoading={isTesting}
              >
                Send Test Notification
              </AccessibleButton>

              <AccessibleButton
                variant="outline"
                size="normal"
                icon={BellOff}
                onClick={unsubscribe}
                isLoading={isLoading}
              >
                Disable on This Device
              </AccessibleButton>
            </>
          )}

          {permission === 'denied' && (
            <span className="text-xs text-red-600 font-semibold">
              Notifications are blocked in your browser settings. Click the lock icon in the browser address bar to allow.
            </span>
          )}
        </div>
      </AccessibleCard>

      {/* Notification Categories & Preferences */}
      <AccessibleCard withTopAccent className="p-4 sm:p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">
            Notification Category Preferences
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize which financial events trigger push notifications for your operator account
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            {
              key: 'repaymentsDue' as const,
              title: 'Repayments Due Tomorrow',
              description: 'Alerts sent 1 day before an installment is due with client and amount details',
            },
            {
              key: 'repaymentsOverdue' as const,
              title: 'Overdue Repayments',
              description: 'Alerts sent after an installment due date passes with remaining balance',
            },
            {
              key: 'paymentReceived' as const,
              title: 'Verified Collections & Payments',
              description: 'Instant notification whenever a client repayment is recorded and verified',
            },
            {
              key: 'investorReturns' as const,
              title: 'Outside Investor Returns & Payouts',
              description: 'Notifications when an investor return is generated or payout is disbursed',
            },
            {
              key: 'partnerProfits' as const,
              title: 'Partner Profit Share Distributions',
              description: 'Notices for approved partner profit allocations and distributions',
            },
            {
              key: 'dealsCreated' as const,
              title: 'New Finance Deals',
              description: 'Notifications when a new loan agreement or deal syndication is created',
            },
            {
              key: 'financialApprovals' as const,
              title: 'Financial Approvals Required',
              description: 'Priority alerts when deal disbursement or financial write-offs require sign-off',
            },
            {
              key: 'systemAlerts' as const,
              title: 'Critical System Alerts',
              description: 'Audit warnings, reconciliation alerts, and scheduled reminder reports',
            },
          ].map((item) => (
            <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label htmlFor={item.key} className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer">
                  {item.title}
                </label>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>

              <input
                id={item.key}
                type="checkbox"
                checked={preferences[item.key]}
                onChange={(e) => updatePreference(item.key, e.target.checked)}
                className="w-4 h-4 text-rose-800 bg-white border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </AccessibleCard>

      {/* Multi-Device Registration List */}
      <AccessibleCard withTopAccent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Registered Devices ({devices.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active browser endpoints receiving push notifications for your operator account
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            No devices currently registered for push notifications. Enable notifications above to register this device.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map((device, idx) => (
              <div key={device.id || idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    {device.deviceType === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {device.deviceType || 'Web Device'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {device.endpointSnippet}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Added {new Date(device.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccessibleCard>
    </div>
  );
};

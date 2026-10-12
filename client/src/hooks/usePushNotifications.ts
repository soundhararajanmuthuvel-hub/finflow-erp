import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface NotificationPreferences {
  repaymentsDue: boolean;
  repaymentsOverdue: boolean;
  paymentReceived: boolean;
  investorReturns: boolean;
  partnerProfits: boolean;
  dealsCreated: boolean;
  financialApprovals: boolean;
  systemAlerts: boolean;
  webPushEnabled: boolean;
}

export interface RegisteredDevice {
  id: string;
  deviceType?: string;
  userAgent?: string;
  createdAt: string;
  endpointSnippet: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  // Check current permission and active subscription
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as NotificationPermissionState);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setIsSubscribed(true);
        setCurrentEndpoint(sub.endpoint);
      } else {
        setIsSubscribed(false);
        setCurrentEndpoint(null);
      }
    } catch (err) {
      console.error('Failed to check push subscription status:', err);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  // Fetch preferences and registered devices from backend
  const {
    data: prefData,
    isLoading: isLoadingPrefs,
    refetch: refetchPrefs,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res: any = await apiClient.get('/notifications/preferences');
      return res.data;
    },
  });

  const preferences: NotificationPreferences = prefData?.preferences || {
    repaymentsDue: true,
    repaymentsOverdue: true,
    paymentReceived: true,
    investorReturns: true,
    partnerProfits: true,
    dealsCreated: true,
    financialApprovals: true,
    systemAlerts: true,
    webPushEnabled: true,
  };

  const devices: RegisteredDevice[] = prefData?.devices || [];

  // 1. Subscribe Mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) {
        throw new Error('Push notifications are not supported on this browser or platform.');
      }

      // Step 1: Request permission
      const permResult = await Notification.requestPermission();
      setPermission(permResult as NotificationPermissionState);
      if (permResult !== 'granted') {
        throw new Error('Notification permission was not granted by user.');
      }

      // Step 2: Fetch public VAPID key
      const vapidRes: any = await apiClient.get('/notifications/vapid-public-key');
      const publicKey = vapidRes.data?.publicKey;
      if (!publicKey) {
        throw new Error('Server VAPID public key could not be retrieved.');
      }

      // Step 3: Register push subscription with browser
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const convertedKey = urlBase64ToUint8Array(publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as unknown as BufferSource,
        });
      }

      // Step 4: Register subscription with backend
      const subJson = sub.toJSON();
      const deviceType = window.innerWidth <= 768 ? 'Mobile' : window.innerWidth <= 1024 ? 'Tablet' : 'Desktop';

      await apiClient.post('/notifications/subscribe', {
        endpoint: sub.endpoint,
        keys: subJson.keys,
        userAgent: navigator.userAgent,
        deviceType,
      });

      return sub;
    },
    onSuccess: (sub) => {
      setIsSubscribed(true);
      setCurrentEndpoint(sub.endpoint);
      setStatusMessage({ type: 'success', text: 'Web push notifications enabled successfully on this device!' });
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to enable push notifications.' });
    },
  });

  // 2. Unsubscribe Mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await apiClient.post('/notifications/unsubscribe', { endpoint });
      } else if (currentEndpoint) {
        await apiClient.post('/notifications/unsubscribe', { endpoint: currentEndpoint });
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      setCurrentEndpoint(null);
      setStatusMessage({ type: 'success', text: 'Web push notifications disabled for this device.' });
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disable notifications.' });
    },
  });

  // 3. Send Test Notification Mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post('/notifications/test');
      return res.data;
    },
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Test notification sent! Check your system notification tray.' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send test notification.' });
    },
  });

  // 4. Update Preferences Mutation
  const updatePrefMutation = useMutation({
    mutationFn: async (updated: Partial<NotificationPreferences>) => {
      const res: any = await apiClient.put('/notifications/preferences', updated);
      return res.data;
    },
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Notification preferences updated.' });
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update preferences.' });
    },
  });

  return {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    devices,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending || isLoadingPrefs,
    isTesting: testMutation.isPending,
    statusMessage,
    clearStatus: () => setStatusMessage(null),
    subscribe: () => subscribeMutation.mutate(),
    unsubscribe: () => unsubscribeMutation.mutate(),
    sendTestNotification: () => testMutation.mutate(),
    updatePreference: (key: keyof NotificationPreferences, value: boolean) =>
      updatePrefMutation.mutate({ [key]: value }),
    refetchPrefs,
  };
}

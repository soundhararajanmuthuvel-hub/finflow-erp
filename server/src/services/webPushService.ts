import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for persistent subscription & preference storage
const DATA_DIR = path.resolve(__dirname, '../../data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');
const PREFERENCES_FILE = path.join(DATA_DIR, 'notification-preferences.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface StoredSubscription {
  id: string;
  companyId: string;
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  deviceType?: string;
  createdAt: string;
  updatedAt: string;
  failedAttempts: number;
}

export interface NotificationPreferences {
  userId: string;
  companyId: string;
  repaymentsDue: boolean;
  repaymentsOverdue: boolean;
  paymentReceived: boolean;
  investorReturns: boolean;
  partnerProfits: boolean;
  dealsCreated: boolean;
  financialApprovals: boolean;
  systemAlerts: boolean;
  webPushEnabled: boolean;
  updatedAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    notificationId?: string;
    entityType?: string;
    entityId?: string;
    timestamp?: string;
  };
}

export class WebPushService {
  private static vapidKeys: { publicKey: string; privateKey: string };
  private static vapidSubject: string;
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) return;

    let pubKey = process.env.VAPID_PUBLIC_KEY;
    let privKey = process.env.VAPID_PRIVATE_KEY;
    this.vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@msrsolutions.in';

    // If VAPID keys not present in env, generate or load from data directory for continuous persistence
    const VAPID_CACHE_FILE = path.join(DATA_DIR, 'vapid-keys.json');
    if (!pubKey || !privKey) {
      if (fs.existsSync(VAPID_CACHE_FILE)) {
        try {
          const cached = JSON.parse(fs.readFileSync(VAPID_CACHE_FILE, 'utf-8'));
          pubKey = cached.publicKey;
          privKey = cached.privateKey;
        } catch {
          // ignore error
        }
      }

      if (!pubKey || !privKey) {
        const generated = webpush.generateVAPIDKeys();
        pubKey = generated.publicKey;
        privKey = generated.privateKey;
        try {
          fs.writeFileSync(VAPID_CACHE_FILE, JSON.stringify(generated, null, 2), 'utf-8');
        } catch {
          // ignore error
        }
      }
    }

    this.vapidKeys = { publicKey: pubKey, privateKey: privKey };
    webpush.setVapidDetails(this.vapidSubject, this.vapidKeys.publicKey, this.vapidKeys.privateKey);
    this.isInitialized = true;
  }

  static getPublicKey(): string {
    this.initialize();
    return this.vapidKeys.publicKey;
  }

  // --- Subscriptions Storage ---
  private static readSubscriptions(): StoredSubscription[] {
    try {
      if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return [];
      const content = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(content || '[]');
    } catch {
      return [];
    }
  }

  private static writeSubscriptions(subs: StoredSubscription[]) {
    try {
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write push subscriptions:', err);
    }
  }

  static registerSubscription(
    companyId: string,
    userId: string,
    subData: { endpoint: string; keys: PushSubscriptionKeys; userAgent?: string; deviceType?: string }
  ): StoredSubscription {
    this.initialize();
    const subs = this.readSubscriptions();
    const now = new Date().toISOString();

    const existingIdx = subs.findIndex((s) => s.endpoint === subData.endpoint);
    if (existingIdx >= 0) {
      subs[existingIdx] = {
        ...subs[existingIdx],
        companyId,
        userId,
        keys: subData.keys,
        userAgent: subData.userAgent || subs[existingIdx].userAgent,
        deviceType: subData.deviceType || subs[existingIdx].deviceType,
        updatedAt: now,
        failedAttempts: 0,
      };
      this.writeSubscriptions(subs);
      return subs[existingIdx];
    }

    const newSub: StoredSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      companyId,
      userId,
      endpoint: subData.endpoint,
      keys: subData.keys,
      userAgent: subData.userAgent,
      deviceType: subData.deviceType || 'Desktop',
      createdAt: now,
      updatedAt: now,
      failedAttempts: 0,
    };

    subs.push(newSub);
    this.writeSubscriptions(subs);
    return newSub;
  }

  static removeSubscription(companyId: string, userId: string, endpoint: string): boolean {
    const subs = this.readSubscriptions();
    const filtered = subs.filter((s) => s.endpoint !== endpoint || s.companyId !== companyId);
    const removed = filtered.length !== subs.length;
    if (removed) {
      this.writeSubscriptions(filtered);
    }
    return removed;
  }

  static getSubscriptionsForUser(companyId: string, userId: string): StoredSubscription[] {
    const subs = this.readSubscriptions();
    return subs.filter((s) => s.companyId === companyId && s.userId === userId);
  }

  static getSubscriptionsForCompany(companyId: string): StoredSubscription[] {
    const subs = this.readSubscriptions();
    return subs.filter((s) => s.companyId === companyId);
  }

  // --- Notification Preferences ---
  private static readPreferences(): Record<string, NotificationPreferences> {
    try {
      if (!fs.existsSync(PREFERENCES_FILE)) return {};
      const content = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    } catch {
      return {};
    }
  }

  private static writePreferences(prefs: Record<string, NotificationPreferences>) {
    try {
      fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write notification preferences:', err);
    }
  }

  static getUserPreferences(companyId: string, userId: string): NotificationPreferences {
    const all = this.readPreferences();
    const key = `${companyId}_${userId}`;
    if (all[key]) return all[key];

    const defaultPrefs: NotificationPreferences = {
      userId,
      companyId,
      repaymentsDue: true,
      repaymentsOverdue: true,
      paymentReceived: true,
      investorReturns: true,
      partnerProfits: true,
      dealsCreated: true,
      financialApprovals: true,
      systemAlerts: true,
      webPushEnabled: true,
      updatedAt: new Date().toISOString(),
    };
    return defaultPrefs;
  }

  static updateUserPreferences(
    companyId: string,
    userId: string,
    partial: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const all = this.readPreferences();
    const key = `${companyId}_${userId}`;
    const current = this.getUserPreferences(companyId, userId);

    const updated: NotificationPreferences = {
      ...current,
      ...partial,
      userId,
      companyId,
      updatedAt: new Date().toISOString(),
    };

    all[key] = updated;
    this.writePreferences(all);
    return updated;
  }

  // --- Push Delivery Engine ---
  static async sendPushToSubscription(
    sub: StoredSubscription,
    payload: PushPayload
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    this.initialize();

    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    };

    const sanitizedPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/brand/pwa-192x192.png',
      badge: payload.badge || '/brand/pwa-192x192.png',
      tag: payload.tag || `finflow-${Date.now()}`,
      data: {
        url: payload.data?.url || '/',
        notificationId: payload.data?.notificationId,
        entityType: payload.data?.entityType,
        entityId: payload.data?.entityId,
        timestamp: payload.data?.timestamp || new Date().toISOString(),
      },
    };

    try {
      const res = await webpush.sendNotification(pushSub, JSON.stringify(sanitizedPayload));
      return { success: true, statusCode: res.statusCode };
    } catch (err: any) {
      const statusCode = err.statusCode;
      // If 404 or 410 (Subscription expired or unsubscribed), prune automatically
      if (statusCode === 404 || statusCode === 410) {
        console.log(`[WebPush] Removing expired push subscription: ${sub.endpoint.slice(0, 30)}...`);
        this.pruneDeadSubscription(sub.endpoint);
      }
      return { success: false, statusCode, error: err.message };
    }
  }

  private static pruneDeadSubscription(endpoint: string) {
    const subs = this.readSubscriptions();
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    if (filtered.length !== subs.length) {
      this.writeSubscriptions(filtered);
    }
  }

  static async sendPushToUser(
    companyId: string,
    userId: string,
    payload: PushPayload,
    categoryKey?: keyof Omit<NotificationPreferences, 'userId' | 'companyId' | 'webPushEnabled' | 'updatedAt'>
  ): Promise<{ attempted: number; successful: number; failed: number }> {
    const prefs = this.getUserPreferences(companyId, userId);
    if (!prefs.webPushEnabled) {
      return { attempted: 0, successful: 0, failed: 0 };
    }

    if (categoryKey && prefs[categoryKey] === false) {
      return { attempted: 0, successful: 0, failed: 0 };
    }

    const subs = this.getSubscriptionsForUser(companyId, userId);
    let successful = 0;
    let failed = 0;

    for (const sub of subs) {
      const res = await this.sendPushToSubscription(sub, payload);
      if (res.success) successful++;
      else failed++;
    }

    return { attempted: subs.length, successful, failed };
  }

  static async broadcastPushToCompany(
    companyId: string,
    payload: PushPayload,
    categoryKey?: keyof Omit<NotificationPreferences, 'userId' | 'companyId' | 'webPushEnabled' | 'updatedAt'>
  ): Promise<{ attempted: number; successful: number; failed: number }> {
    const subs = this.getSubscriptionsForCompany(companyId);
    let attempted = 0;
    let successful = 0;
    let failed = 0;

    // Group by user to check preferences once
    const userIds = [...new Set(subs.map((s) => s.userId))];

    for (const uid of userIds) {
      const prefs = this.getUserPreferences(companyId, uid);
      if (!prefs.webPushEnabled) continue;
      if (categoryKey && prefs[categoryKey] === false) continue;

      const userSubs = subs.filter((s) => s.userId === uid);
      for (const sub of userSubs) {
        attempted++;
        const res = await this.sendPushToSubscription(sub, payload);
        if (res.success) successful++;
        else failed++;
      }
    }

    return { attempted, successful, failed };
  }

  static async sendTestPush(companyId: string, userId: string): Promise<{ success: boolean; subscriptionsCount: number }> {
    const subs = this.getSubscriptionsForUser(companyId, userId);
    if (subs.length === 0) {
      return { success: false, subscriptionsCount: 0 };
    }

    const payload: PushPayload = {
      title: 'FinFlow ERP — Test Notification',
      body: 'Web push notifications are configured correctly and active on this device.',
      icon: '/brand/pwa-192x192.png',
      badge: '/brand/pwa-192x192.png',
      tag: `test-${Date.now()}`,
      data: {
        url: '/settings',
        entityType: 'SYSTEM_TEST',
        timestamp: new Date().toISOString(),
      },
    };

    let anySuccess = false;
    for (const sub of subs) {
      const res = await this.sendPushToSubscription(sub, payload);
      if (res.success) anySuccess = true;
    }

    return { success: anySuccess, subscriptionsCount: subs.length };
  }
}

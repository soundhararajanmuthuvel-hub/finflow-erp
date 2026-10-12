// FinFlow ERP — Web Push & Notification Service Worker Handler
// Product by MSR Solutions — Private Finance Management

self.addEventListener('push', (event) => {
  let data = {
    title: 'FinFlow ERP Notification',
    body: 'A financial update requires your attention. Open the app to review.',
    icon: '/brand/pwa-192x192.png',
    badge: '/brand/pwa-192x192.png',
    tag: 'finflow-alert',
    data: {
      url: '/',
    },
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        ...data,
        ...parsed,
        icon: parsed.icon || '/brand/pwa-192x192.png',
        badge: parsed.badge || '/brand/pwa-192x192.png',
        tag: parsed.tag || `finflow-${Date.now()}`,
        data: {
          url: (parsed.data && parsed.data.url) || parsed.url || '/',
          notificationId: parsed.data && parsed.data.notificationId,
          entityType: parsed.data && parsed.data.entityType,
          entityId: parsed.data && parsed.data.entityId,
        },
      };
    }
  } catch (_e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [150, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open FinFlow' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a FinFlow tab is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no tab is open, open a new window to targetUrl
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (_event) => {
  // Notification dismissed by user
});

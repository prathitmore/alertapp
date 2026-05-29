/**
 * Notification Service
 * Production-Safe Android Strategy:
 * - Extends Android's `NotificationListenerService` in native Java/Kotlin.
 * - Registered in AndroidManifest.xml: android.permission.BIND_NOTIFICATION_LISTENER_SERVICE.
 * - The native listener intercepts `StatusBarNotification`, parses packages, title, and text,
 *   and posts a custom Capacitor Event (`notificationReceived`) to the WebView.
 */

const subscribers = new Set();
const dedupeCache = new Map();
const DEDUPE_WINDOW_MS = 5000; // 5 second deduplication window

// Generate a simple hash of the notification to prevent duplicate event storming
const getNotificationHash = (appName, title, body) => {
  return `${appName}:${title}:${body}`;
};

export const notificationService = {
  init() {
    console.log('[Notification Service] Hardened Service Initialized');
  },

  subscribe(onStateChange) {
    if (!onStateChange) return;
    const wasEmpty = subscribers.size === 0;
    subscribers.add(onStateChange);

    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

    if (isNative && wasEmpty) {
      // Hardened Listener using the Capacitor Native Bridge:
      // Registers to the custom Java/Kotlin NotificationListenerService plugin
      window.addEventListener('notificationReceived', this.handleNativeNotification);
    } else if (!isNative) {
      console.log('[Notification Service] Sandbox mock mode active.');
    }
  },

  handleNativeNotification(event) {
    if (!event || !event.detail) return;
    
    const { appName, title, body } = event.detail;
    notificationService.processNotification(appName, title, body);
  },

  processNotification(appName, title, body) {
    if (subscribers.size === 0) return;

    const cleanAppName = appName || 'Unknown App';
    const cleanTitle = title || '';
    const cleanBody = body || '';

    const hash = getNotificationHash(cleanAppName, cleanTitle, cleanBody);
    const now = Date.now();
    const lastSeen = dedupeCache.get(hash);

    // Deduplication check
    if (lastSeen && (now - lastSeen < DEDUPE_WINDOW_MS)) {
      console.log(`[Notification Service] Blocked duplicate event from: ${cleanAppName}`);
      return;
    }

    dedupeCache.set(hash, now);

    // Clean old cache entries to prevent memory growth
    if (dedupeCache.size > 50) {
      for (const [key, time] of dedupeCache.entries()) {
        if (now - time > DEDUPE_WINDOW_MS * 2) dedupeCache.delete(key);
      }
    }

    subscribers.forEach(cb => {
      try {
        cb({
          appName: cleanAppName,
          title: cleanTitle,
          body: cleanBody
        });
      } catch (e) {
        console.error('[Notification Service] Subscriber callback failed', e);
      }
    });
  },

  unsubscribe(onStateChange) {
    if (onStateChange) {
      subscribers.delete(onStateChange);
    } else {
      subscribers.clear();
    }
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative && subscribers.size === 0) {
      window.removeEventListener('notificationReceived', this.handleNativeNotification);
    }
  },

  cleanup() {
    this.unsubscribe();
    console.log('[Notification Service] Cleaned up and unsubscribed');
  }
};
export default notificationService;

import notificationService from './notificationService';

/**
 * OTP Service (Hardened)
 * Security & Anti-False-Positive Design:
 * - Scans messaging apps, auth systems, and email apps only (trust filtering).
 * - Multi-rule regex match.
 * - Privacy-First: Redacts OTP code before storing/logging.
 */

let stateCallback = null;

// Trusted package names commonly sending verification codes
const TRUSTED_AUTH_PACKAGES = [
  'com.google.android.apps.messaging',
  'com.google.android.talk', // Hangouts/Chat
  'com.android.mms',
  'com.whatsapp',
  'org.thoughtcrime.securesms', // Signal
  'com.slack',
  'com.google.android.gm', // Gmail
  'org.telegram.messenger'
];

export const otpService = {
  init() {
    console.log('[OTP Service] Hardened Service Initialized');
  },

  subscribe(onStateChange) {
    this.unsubscribe();
    stateCallback = onStateChange;

    notificationService.subscribe(otpService.processNotificationForOtp);
  },

  processNotificationForOtp(notification) {
    if (!notification || !notification.body) return;

    // Check trusted source context (skip filtering in browser sandbox for easy testing)
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative && !TRUSTED_AUTH_PACKAGES.includes(notification.appName)) {
      return; // Skip untrusted source to reduce false positives
    }

    const text = notification.body.toLowerCase();
    
    // Keyword heuristics validation
    const otpKeywords = ['otp', 'verification', 'verify', 'code', 'pin', 'one-time', 'security'];
    const matchesKeyword = otpKeywords.some(kw => text.includes(kw));
    if (!matchesKeyword) return;

    // Advanced numeric patterns for 4 to 8 digit OTPs
    const otpRegexPatterns = [
      /\b\d{4,8}\b/,                // Raw digits
      /code\s*(?:is)?:?\s*(\d{4,8})/i, // Code matches
      /otp\s*(?:is)?:?\s*(\d{4,8})/i   // OTP matches
    ];

    let detectedCode = null;
    for (const pattern of otpRegexPatterns) {
      const match = notification.body.match(pattern);
      if (match) {
        // If capture group exists, use it, else use full match
        detectedCode = match[1] || match[0];
        break;
      }
    }

    if (detectedCode) {
      console.log(`[OTP Service] Extracted code from ${notification.appName} (Value Redacted for Privacy)`);
      if (stateCallback) {
        stateCallback({
          // Pass redacted value for logging safety
          redactedOtp: detectedCode.replace(/./g, '*'),
          appName: notification.appName,
          // Provide metadata details only
          timestamp: Date.now()
        });
      }
    }
  },

  unsubscribe() {
    notificationService.unsubscribe(otpService.processNotificationForOtp);
    stateCallback = null;
  },

  cleanup() {
    this.unsubscribe();
    console.log('[OTP Service] Cleaned up');
  }
};
export default otpService;

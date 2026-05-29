import batteryService from './batteryService';
import chargingService from './chargingService';
import wifiService from './wifiService';
import bluetoothService from './bluetoothService';
import notificationService from './notificationService';
import otpService from './otpService';
import locationService from './locationService';
import motionService from './motionService';
import audioService from './audioService';
import soundService from './soundService';
import hapticService from './hapticService';
import { diagnosticsService } from './diagnosticsService';
import { generateMockAlertId } from '../utils/helpers';

/**
 * Engine Service (Hardened)
 * - Evaluates native rules.
 * - Enforces privacy-safe telemetry logging (no raw SMS, redacted OTPs).
 */

let activeRules = [];
let dispatchFn = null;
const lastFiredMap = new Map(); // Persists across rehydrates
const subscriberSet = new Set();
let listenerRefs = {};
let previousMatchState = new Map();

const DEFAULT_COOLDOWNS = {
  LOW: 10000,
  MEDIUM: 5000,
  HIGH: 3000,
  CRITICAL: 1000
};

const EngineService = {
  reminderInterval: null,
  isInitialized: false,

  init(dispatch) {
    console.log('[DEBUG GUARD] Listener registration initiated in EngineService.');
    console.log('[Engine Service] Initializing EngineService and cleaning stale listeners...');
    
    this.cleanupListeners();

    dispatchFn = dispatch;
    this.isInitialized = true;

    batteryService.init();
    chargingService.init();
    wifiService.init();
    bluetoothService.init();
    notificationService.init();
    otpService.init();
    locationService.init();
    motionService.init();
    audioService.init();

    // Define named functions to avoid anonymous listener duplicates
    listenerRefs.battery = (state) => this.evaluateRules('BATTERY', state);
    listenerRefs.charging = (state) => this.evaluateRules('CHARGING', state);
    listenerRefs.wifi = (state) => this.evaluateRules('WIFI', state);
    listenerRefs.bluetooth = (state) => this.evaluateRules('BLUETOOTH', state);
    listenerRefs.notification = (state) => {
      this.evaluateRules('NOTIFICATION', state);
      this.evaluateNotificationFallbacks(state);
    };
    listenerRefs.otp = (state) => this.evaluateRules('OTP', state);
    listenerRefs.location = (state) => this.evaluateRules('LOCATION', state);
    listenerRefs.motion = (state) => this.evaluateRules('MOTION', state);
    listenerRefs.audio = (state) => this.evaluateRules('AUDIO', state);

    batteryService.subscribe(listenerRefs.battery);
    chargingService.subscribe(listenerRefs.charging);
    wifiService.subscribe(listenerRefs.wifi);
    bluetoothService.subscribe(listenerRefs.bluetooth);
    notificationService.subscribe(listenerRefs.notification);
    otpService.subscribe(listenerRefs.otp);
    locationService.subscribe(listenerRefs.location);
    motionService.subscribe(listenerRefs.motion);
    audioService.subscribe(listenerRefs.audio);

    subscriberSet.add('battery');
    subscriberSet.add('charging');
    subscriberSet.add('wifi');
    subscriberSet.add('bluetooth');
    subscriberSet.add('notification');
    subscriberSet.add('otp');
    subscriberSet.add('location');
    subscriberSet.add('motion');
    subscriberSet.add('audio');

    this.startReminderTimer();
  },

  startReminderTimer() {
    if (this.reminderInterval) clearInterval(this.reminderInterval);
    
    let lastCheckedTime = '';
    
    this.reminderInterval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${hh}:${mm}`;
      
      if (currentTimeString !== lastCheckedTime) {
        lastCheckedTime = currentTimeString;
        this.evaluateRules('REMINDER', { time: currentTimeString });
      }
    }, 15000); // Evaluate time-based rules every 15s
  },

  evaluateNotificationFallbacks(notification) {
    if (!notification) return;
    const text = (notification.body || '').toLowerCase();
    const title = (notification.title || '').toLowerCase();
    
    // Route matching system/lifestyle alerts via notification streams
    if (text.includes('sim') || title.includes('sim')) {
      this.evaluateRules('SYSTEM', { event: 'SIM_CHANGED' });
    }
    if (text.includes('storage') || title.includes('storage') || text.includes('space') || title.includes('space')) {
      this.evaluateRules('SYSTEM', { event: 'LOW_STORAGE' });
    }
    if (text.includes('rain') || title.includes('rain') || text.includes('weather') || title.includes('weather')) {
      this.evaluateRules('REMINDER', { event: 'RAIN' });
    }
    if (text.includes('iss') || title.includes('iss') || text.includes('station') || title.includes('station')) {
      this.evaluateRules('REMINDER', { event: 'ISS' });
    }
  },

  updateRules(rules) {
    activeRules = rules;
  },

  evaluateRules(triggerType, payload) {
    if (!activeRules || activeRules.length === 0) return;

    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    const nativeTriggers = ['BATTERY', 'CHARGING', 'WIFI', 'BLUETOOTH', 'NOTIFICATION', 'OTP'];
    
    // Prevent double execution and resource exhaustion!
    if (isNative && nativeTriggers.includes(triggerType)) {
      console.log(`[Engine Service] Skipping JS evaluation for ${triggerType} - Native Service handles this.`);
      return;
    }

    console.log(`[DEBUG GUARD] Trigger execution evaluated for type: ${triggerType}`, payload);
    const matchingRules = activeRules.filter(r => r.enabled && r.trigger.type === triggerType);

    matchingRules.forEach(rule => {
      let isMatch = false;

      try {
        if (triggerType === 'BATTERY') {
          const val = parseInt(rule.trigger.value, 10);
          if (rule.trigger.operator === 'LESS_THAN' && payload.level < val) isMatch = true;
          if (rule.trigger.operator === 'GREATER_THAN' && payload.level > val) isMatch = true;
          if (rule.trigger.operator === 'EQUALS' && payload.level === val) isMatch = true;
          if (payload.isOverheated && (rule.category === 'overheat' || rule.trigger.value === 'OVERHEAT')) isMatch = true;
        }
        
        else if (triggerType === 'CHARGING') {
          const wantsConnected = rule.trigger.value === 'CONNECTED';
          if (payload.isCharging === wantsConnected) isMatch = true;
        }

        else if (triggerType === 'WIFI') {
          const wantsConnected = rule.trigger.value === 'CONNECTED';
          if (payload.connected === wantsConnected) isMatch = true;
        }

        else if (triggerType === 'BLUETOOTH') {
          const wantsConnected = rule.trigger.value === 'CONNECTED';
          if (payload.connected === wantsConnected) isMatch = true;
        }

        else if (triggerType === 'NOTIFICATION') {
          const kw = rule.trigger.value ? rule.trigger.value.toLowerCase() : '';
          const titleMatch = payload.title && payload.title.toLowerCase().includes(kw);
          const bodyMatch = payload.body && payload.body.toLowerCase().includes(kw);
          if (titleMatch || bodyMatch) isMatch = true;
        }

        else if (triggerType === 'OTP') {
          isMatch = true;
        }

        else if (triggerType === 'LOCATION') {
          const targetEvent = rule.trigger.value || 'ENTER';
          if (payload.event === targetEvent) isMatch = true;
        }

        else if (triggerType === 'MOTION') {
          const targetMotion = rule.trigger.value || 'MOVED';
          if (payload.type === targetMotion) isMatch = true;
        }

        else if (triggerType === 'SYSTEM') {
          if (payload.event === rule.trigger.value) isMatch = true;
        }

        else if (triggerType === 'AUDIO') {
          if (payload.event === rule.trigger.value) isMatch = true;
        }

        else if (triggerType === 'REMINDER') {
          const val = rule.trigger.value;
          if (payload.time === val || payload.event === val) isMatch = true;
        }

        if (isMatch) {
          const isStateBased = ['BATTERY', 'CHARGING', 'WIFI', 'BLUETOOTH', 'LOCATION'].includes(triggerType);
          const wasMatch = previousMatchState.get(rule.id) || false;

          let shouldRepeat = false;
          if (rule.actions) {
            const visualAction = rule.actions.find(a => a.type === 'VISUAL');
            if (visualAction && visualAction.config && visualAction.config.repeat) {
              shouldRepeat = true;
            }
          }

          if (isStateBased && wasMatch && !shouldRepeat) {
            return; // Already triggered for this state, and repeat is disabled
          }

          if (isStateBased) {
            previousMatchState.set(rule.id, true);
          }

          this.executeActions(rule, payload);
        } else {
          const isStateBased = ['BATTERY', 'CHARGING', 'WIFI', 'BLUETOOTH', 'LOCATION'].includes(triggerType);
          if (isStateBased) {
            previousMatchState.set(rule.id, false);
          }
        }
      } catch (error) {
        console.error(`[Engine Service] Error evaluating rule ${rule.id}`, error);
        diagnosticsService.logMissedTrigger();
      }
    });
  },

  async executeActions(rule, triggerPayload) {
    const now = Date.now();
    const lastFired = lastFiredMap.get(rule.id) || 0;

    const priorityCooldown = DEFAULT_COOLDOWNS[rule.priority] !== undefined ? DEFAULT_COOLDOWNS[rule.priority] : 15000;
    const cooldownLimit = rule.cooldownMs !== undefined ? rule.cooldownMs : priorityCooldown;

    if (now - lastFired < cooldownLimit) {
      console.log(`[DEBUG GUARD] Cooldown active for ${rule.id}. Prevents firing. cd: ${cooldownLimit}, diff: ${now - lastFired}`);
      return;
    }
    console.log(`[DEBUG GUARD] Cooldown passed for ${rule.id}. Firing action.`);

    lastFiredMap.set(rule.id, now);

    let executionSuccess = false;
    let actionFeedback = [];

    for (const action of rule.actions) {
      if (action.type === 'SOUND') {
        const ok = await soundService.playSound(action.config, { mode: rule.priority === 'CRITICAL' ? 'REPLACE' : 'QUEUE' });
        if (ok) executionSuccess = true;
        actionFeedback.push(ok ? 'Sound played' : 'Sound failed');
      }

      if (action.type === 'HAPTIC') {
        const ok = await hapticService.triggerHaptic(action.config);
        if (ok) executionSuccess = true;
        actionFeedback.push(ok ? 'Haptic vibrated' : 'Haptic suppressed');
      }

      if (action.type === 'VISUAL') {
        executionSuccess = true;
        actionFeedback.push('Visual banner');
      }
    }

    if (!executionSuccess) {
      diagnosticsService.logMissedTrigger();
    }

    // Privacy-Safe Telemetry Formatting
    let privacySafeDetails = rule.name;
    if (rule.trigger.type === 'OTP') {
      privacySafeDetails = `OTP Event: [OTP REDACTED] from ${triggerPayload.appName || 'Auth App'}`;
    } else if (rule.trigger.type === 'NOTIFICATION') {
      privacySafeDetails = `Notification alert matched from: ${triggerPayload.appName || 'System'}`;
    } else if (rule.trigger.type === 'LOCATION') {
      privacySafeDetails = `${triggerPayload.regionName} boundary crossed (${triggerPayload.event})`;
    } else if (rule.trigger.type === 'MOTION') {
      privacySafeDetails = `Device acceleration (${triggerPayload.type})`;
    }

    if (dispatchFn) {
      dispatchFn({
        type: 'ADD_LOG',
        payload: {
          id: generateMockAlertId(),
          alertId: rule.id,
          timestamp: new Date().toISOString(),
          status: executionSuccess ? 'SUCCESS' : 'FAILED',
          details: `${privacySafeDetails} (${actionFeedback.join(', ')})`
        }
      });
    }
  },

  cleanupListeners() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    batteryService.cleanup();
    chargingService.cleanup();
    wifiService.cleanup();
    bluetoothService.cleanup();
    notificationService.cleanup();
    otpService.cleanup();
    locationService.cleanup();
    motionService.cleanup();
    audioService.cleanup();
    soundService.cleanup();
    hapticService.cleanup();
    
    subscriberSet.clear();
    for (let key in listenerRefs) {
      delete listenerRefs[key];
    }
  },

  cleanup() {
    this.cleanupListeners();
    dispatchFn = null;
    activeRules = [];
    this.isInitialized = false;
    // lastFiredMap.clear(); // REMOVED: keep cooldown persistence
    console.log('[Engine Service] Orchestrator Cleaned Up');
  }
};

export default EngineService;

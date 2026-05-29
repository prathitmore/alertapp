/**
 * Foreground Service & Reliability Manager (Hardened)
 * - Implements best-effort resilient monitoring.
 * - Handles listener health states: HEALTHY, DEGRADED, RECOVERING, FAILED.
 * - Graceful degradation on permission revoke.
 */

import { registerPlugin } from '@capacitor/core';
import { diagnosticsService } from './diagnosticsService';
const ForegroundServicePlugin = registerPlugin('ForegroundService');

let foregroundActive = false;
let currentHealth = 'HEALTHY';
const healthDetails = {
  location: 'OK',
  battery: 'OK',
  notifications: 'OK'
};

export const foregroundService = {
  init() {
    console.log('[DEBUG GUARD] foreground service state: Initialized');
    console.log('[Foreground Service] Initialized');
  },

  // Sync Foreground status, cleanly shutting down if no alerts are active
  syncForegroundState(rules) {
    const activeEnabledRules = rules.filter(r => r.enabled);

    const hasActiveMonitor = activeEnabledRules.length > 0;

    if (hasActiveMonitor) {
      // Always call start to update the rules!
      this.startForegroundService(activeEnabledRules);
    } else if (!hasActiveMonitor && foregroundActive) {
      this.stopForegroundService();
    }
  },

  async startForegroundService(rules) {
    foregroundActive = true;
    console.log('[DEBUG GUARD] foreground service state: Started Foreground Service');
    console.log('[Foreground Service] Escaped to Foreground Service');
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        await ForegroundServicePlugin.startForegroundMonitoring({
          rules: JSON.stringify(rules || [])
        });
      } catch (e) {
        console.error('Failed to start foreground monitoring', e);
      }
    }
  },

  async stopForegroundService() {
    foregroundActive = false;
    console.log('[DEBUG GUARD] foreground service state: Stopped Foreground Service');
    console.log('[Foreground Service] Demoted to Standard Background (Saving Battery)');
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        await ForegroundServicePlugin.stopForegroundMonitoring();
      } catch (e) {
        console.error('Failed to stop foreground monitoring', e);
      }
    }
  },

  // Get current health state of listeners
  getHealthState() {
    return {
      status: currentHealth,
      details: healthDetails
    };
  },

  // Handle permission loss gracefully
  handlePermissionDegradation(permissionType, status) {
    console.warn(`[Foreground Service] Permission Degraded: ${permissionType} is now ${status}`);
    healthDetails[permissionType] = status;

    if (status === 'DENIED' || status === 'DISABLED') {
      currentHealth = 'DEGRADED';
      diagnosticsService.logListenerDegradation();
    } else if (Object.values(healthDetails).every(v => v === 'OK')) {
      currentHealth = 'HEALTHY';
    }
  },

  // Boot Recovery: Restore ONLY enabled active alerts
  bootRestoreRules(allRules) {
    const activeEnabledAlerts = allRules.filter(r => r.enabled);
    console.log(`[Boot Recovery] Restoring only active rules: ${activeEnabledAlerts.length} rules loaded. Ignored disabled rules.`);
    return activeEnabledAlerts;
  },

  // Re-register active state and hooks safely
  async rehydrateEngine(dispatch, EngineService, activeAlerts) {
    console.log('[Foreground Service] Triggering Engine Rehydration (Capacitor Resume Event)');
    currentHealth = 'RECOVERING';
    
    try {
      // Flush buffered native events
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          const res = await ForegroundServicePlugin.flushBufferedEvents();
          const events = res.events || [];
          events.forEach(evt => {
            dispatch({
              type: 'ADD_LOG',
              payload: {
                id: `log_${Date.now()}_${Math.random()}`,
                alertId: evt.ruleId,
                timestamp: new Date(evt.timestamp).toISOString(),
                status: 'SUCCESS',
                details: 'Alert triggered in deep background (Native Execution)'
              }
            });
          });
        } catch (e) {
          console.warn('Failed to flush native events', e);
        }
      }

      // Restore only enabled rules
      const enabledRules = activeAlerts.filter(r => r.enabled);
      
      EngineService.cleanup();
      EngineService.init(dispatch);
      EngineService.updateRules(enabledRules);
      
      currentHealth = 'HEALTHY';
      console.log('[Foreground Service] Rehydration Successful');
    } catch (e) {
      currentHealth = 'FAILED';
      console.error('[Foreground Service] Rehydration Failed', e);
    }
  }
};

export default foregroundService;

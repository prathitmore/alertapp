import { Device } from '@capacitor/device';

/**
 * Battery Service
 * Monitors level and battery temperature (best-effort).
 */

let lastBatteryLevel = null;
let callbackFn = null;
let pollInterval = null;

export const batteryService = {
  init() {
    console.log('[Battery Service] Initialized');
  },

  subscribe(onStateChange) {
    if (pollInterval) this.unsubscribe();
    callbackFn = onStateChange;

    pollInterval = setInterval(async () => {
      try {
        const info = await Device.getBatteryInfo();
        if (info.batteryLevel === undefined) return;

        const currentLevel = Math.round(info.batteryLevel * 100);
        
        // Best-effort check for battery temperature (not natively exposed in standard Device plugin,
        // but included as a placeholder for a custom Capacitor plugin. Fallback to normal if missing).
        const isOverheated = info.batteryTemperature !== undefined ? info.batteryTemperature > 45 : false;

        // Delta check: Only emit if percentage or overheat state changed
        if (lastBatteryLevel !== currentLevel) {
          lastBatteryLevel = currentLevel;
          if (callbackFn) {
            callbackFn({
              level: currentLevel,
              isFull: currentLevel >= 100,
              isOverheated
            });
          }
        }
      } catch (e) {
        console.error('[Battery Service] Error fetching info', e);
      }
    }, 10000); // 10s poll
  },

  unsubscribe() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    callbackFn = null;
  },

  cleanup() {
    this.unsubscribe();
    lastBatteryLevel = null;
    console.log('[Battery Service] Cleaned up');
  }
};
export default batteryService;

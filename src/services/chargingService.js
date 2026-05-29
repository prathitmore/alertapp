import { Device } from '@capacitor/device';

/**
 * Charging Service
 * Monitors power connection state.
 */

let lastChargingState = null;
let callbackFn = null;
let pollInterval = null;

export const chargingService = {
  init() {
    console.log('[Charging Service] Initialized');
  },

  subscribe(onStateChange) {
    if (pollInterval) this.unsubscribe();
    callbackFn = onStateChange;

    pollInterval = setInterval(async () => {
      try {
        const info = await Device.getBatteryInfo();
        if (info.isCharging === undefined) return;

        const currentState = info.isCharging;

        // Delta check: Only emit on state flip
        if (lastChargingState !== currentState) {
          lastChargingState = currentState;
          if (callbackFn) {
            callbackFn({
              isCharging: currentState
            });
          }
        }
      } catch (e) {
        console.error('[Charging Service] Error fetching charging state', e);
      }
    }, 2000); // 2s poll for charging events
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
    lastChargingState = null;
    console.log('[Charging Service] Cleaned up');
  }
};
export default chargingService;

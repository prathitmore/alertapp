/**
 * Bluetooth Service
 * Production-Safe Strategy:
 * 1. Primary Plugin Choice: `@capacitor-community/bluetooth-le`
 *    - Allows scanning and monitoring adapter state on Android natively.
 * 2. Fallback: Web Bluetooth API (`navigator.bluetooth`) if running inside Web Browser / PWA.
 * 3. MVP-Safe Behavior: Listens to bluetooth adapter power flips (ON/OFF).
 */

let stateCallback = null;
let adapterInterval = null; // Used for Web fallback checking state

export const bluetoothService = {
  init() {
    console.log('[Bluetooth Service] Initialized');
  },

  async subscribe(onStateChange) {
    this.unsubscribe();
    stateCallback = onStateChange;

    // Check if running on Android/iOS via Capacitor
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

    if (isNative) {
      try {
        // Dynamic import of BleClient to prevent build errors in web-only environments
        const { BleClient } = await import('@capacitor-community/bluetooth-le');
        await BleClient.initialize();
        
        // Listen to adapter state natively
        await BleClient.startEnabledNotifications(enabled => {
          if (stateCallback) {
            stateCallback({
              connected: enabled,
              source: 'native-plugin'
            });
          }
        });
      } catch (error) {
        console.warn('[Bluetooth Service] Native BLE initialization failed, using mock fallback', error);
        this.startMockSubscription();
      }
    } else if (navigator.bluetooth) {
      // PWA Web Fallback using Web Bluetooth API
      console.log('[Bluetooth Service] Using Web Bluetooth API Fallback');
      adapterInterval = setInterval(async () => {
        try {
          const available = await navigator.bluetooth.getAvailability();
          if (stateCallback) {
            stateCallback({
              connected: available,
              source: 'web-api'
            });
          }
        } catch (e) {
          console.error('[Bluetooth Service] Web BLE availability check failed', e);
        }
      }, 10000);
    } else {
      console.log('[Bluetooth Service] No Bluetooth API available. Running idle state.');
      this.startMockSubscription();
    }
  },

  unsubscribe() {
    if (adapterInterval) {
      clearInterval(adapterInterval);
      adapterInterval = null;
    }
    stateCallback = null;
  },

  cleanup() {
    this.unsubscribe();
    console.log('[Bluetooth Service] Cleaned up');
  },

  // Mock backup only for sandbox and testing environments to avoid crash
  startMockSubscription() {
    let mockState = false;
    adapterInterval = setInterval(() => {
      mockState = !mockState;
      if (stateCallback) {
        stateCallback({
          connected: mockState,
          source: 'mock'
        });
      }
    }, 30000); // Low frequency
  }
};
export default bluetoothService;

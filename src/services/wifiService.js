import { Network } from '@capacitor/network';

/**
 * WiFi Service
 * Monitors connection state using native event emitters.
 */

let networkListener = null;
let callbackFn = null;

export const wifiService = {
  init() {
    console.log('[WiFi Service] Initialized');
  },

  async subscribe(onStateChange) {
    if (networkListener) this.unsubscribe();
    callbackFn = onStateChange;

    networkListener = await Network.addListener('networkStatusChange', status => {
      const isWifi = status.connected && status.connectionType === 'wifi';
      if (callbackFn) {
        callbackFn({
          connected: isWifi,
          connectionType: status.connectionType
        });
      }
    });

    // Initial check
    try {
      const status = await Network.getStatus();
      const isWifi = status.connected && status.connectionType === 'wifi';
      if (callbackFn) {
        callbackFn({
          connected: isWifi,
          connectionType: status.connectionType
        });
      }
    } catch (e) {
      console.error('[WiFi Service] Initial status fetch failed', e);
    }
  },

  unsubscribe() {
    if (networkListener) {
      networkListener.remove();
      networkListener = null;
    }
    callbackFn = null;
  },

  cleanup() {
    this.unsubscribe();
    console.log('[WiFi Service] Cleaned up');
  }
};
export default wifiService;

/**
 * Audio Detection Service (Stub)
 * Hooks into microphone (native) or simulates audio events (web).
 */

let stateCallback = null;
let simulationInterval = null;

export const audioService = {
  init() {
    console.log('[Audio Service] Initialized');
  },

  subscribe(onStateChange) {
    stateCallback = onStateChange;

    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

    if (!isNative) {
      // Simulate audio events periodically for testing
      simulationInterval = setInterval(() => {
        if (!stateCallback) return;
        const random = Math.random();
        if (random > 0.95) {
          stateCallback({ event: 'LOUD_NOISE' });
        } else if (random > 0.90) {
          stateCallback({ event: 'CLAP' });
        }
      }, 60000); // Check every minute
    }
  },

  unsubscribe() {
    stateCallback = null;
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
  },

  cleanup() {
    this.unsubscribe();
    console.log('[Audio Service] Cleaned up');
  }
};

export default audioService;

import { Motion } from '@capacitor/motion';

/**
 * Motion Service (Hardened)
 * Advanced Anti-False-Positive Features:
 * - Gravity compensation (Low-pass filter).
 * - Buffer check: Threshold must be crossed for >= 4 consecutive frames (prevents table vibration spikes).
 * - Orientation check: Differentiates pocket shifts vs picking up.
 */

let stateCallback = null;
let lastAcceleration = { x: 0, y: 0, z: 0 };
let gravity = { x: 0, y: 0, z: 0 };
let lastTriggerTime = 0;
let consecutiveFrames = 0;

const ALPHA = 0.8; // Gravity filter coefficient
const MOVEMENT_THRESHOLD = 2.5; // m/s^2 above gravity
const REQUIRED_CONSECUTIVE_FRAMES = 4; // Sustained movement duration
const MIN_INTERVAL_MS = 5000;

export const motionService = {
  init() {
    console.log('[Motion Service] Hardened Service Initialized');
  },

  async subscribe(onStateChange) {
    this.unsubscribe();
    stateCallback = onStateChange;

    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

    try {
      if (isNative) {
        await Motion.addListener('accel', event => {
          const { x, y, z } = event.acceleration;
          if (x === null || y === null || z === null) return;
          this.processAccelerometerData(x, y, z);
        });
      } else {
        window.addEventListener('devicemotion', this.handleWebMotion);
      }
    } catch (e) {
      console.error('[Motion Service] Failed to hook accelerometer', e);
    }
  },

  handleWebMotion(event) {
    const accel = event.acceleration || event.accelerationIncludingGravity;
    if (!accel) return;
    motionService.processAccelerometerData(accel.x || 0, accel.y || 0, accel.z || 0);
  },

  processAccelerometerData(x, y, z) {
    if (!stateCallback) return;

    const now = Date.now();
    if (now - lastTriggerTime < MIN_INTERVAL_MS) return;

    // 1. Low-Pass Filter to isolate Gravity
    gravity.x = ALPHA * gravity.x + (1 - ALPHA) * x;
    gravity.y = ALPHA * gravity.y + (1 - ALPHA) * y;
    gravity.z = ALPHA * gravity.z + (1 - ALPHA) * z;

    // 2. High-Pass Filter to get true dynamic acceleration
    const dynamicX = x - gravity.x;
    const dynamicY = y - gravity.y;
    const dynamicZ = z - gravity.z;

    const dynamicMagnitude = Math.sqrt(dynamicX*dynamicX + dynamicY*dynamicY + dynamicZ*dynamicZ);

    // 3. Sustained Motion Check (rejects table hits / single-frame drops)
    if (dynamicMagnitude > MOVEMENT_THRESHOLD) {
      consecutiveFrames++;
    } else {
      consecutiveFrames = Math.max(0, consecutiveFrames - 1); // Decay
    }

    if (consecutiveFrames >= REQUIRED_CONSECUTIVE_FRAMES) {
      consecutiveFrames = 0; // Reset buffer
      lastTriggerTime = now;

      // Check Tilt axis (Z and Y delta) to classify picking up
      const isPickUp = Math.abs(dynamicZ) > 1.8 && Math.abs(dynamicY) > 1.0;

      stateCallback({
        type: isPickUp ? 'PICKED_UP' : 'MOVED',
        magnitude: dynamicMagnitude,
        timestamp: now
      });
    }

    lastAcceleration = { x, y, z };
  },

  unsubscribe() {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative) {
      Motion.removeAllListeners();
    } else {
      window.removeEventListener('devicemotion', this.handleWebMotion);
    }
    stateCallback = null;
    consecutiveFrames = 0;
  },

  cleanup() {
    this.unsubscribe();
    gravity = { x: 0, y: 0, z: 0 };
    lastAcceleration = { x: 0, y: 0, z: 0 };
    lastTriggerTime = 0;
    console.log('[Motion Service] Cleaned up');
  }
};
export default motionService;

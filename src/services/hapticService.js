import { Haptics } from '@capacitor/haptics';
import { HapticRegistry } from '../data/registries';

/**
 * Haptic Service
 * Suppression & Override Safety:
 * - High priority (HIGH/CRITICAL) overrides lower vibrations.
 * - Low/Medium priorities are throttled to prevent haptic storms.
 */

let lastHapticTime = 0;
let lastHapticPriority = 'LOW';

const PriorityWeights = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

const THROTTLE_WINDOW_MS = 2000; // Do not vibrate lower/equal priorities within 2s

export const hapticService = {
  triggerHaptic: async (hapticConfig) => {
    if (!hapticConfig || !hapticConfig.hapticPattern || hapticConfig.hapticPattern === 'NONE') {
      return false;
    }

    const patternId = hapticConfig.hapticPattern;
    const pattern = HapticRegistry[patternId];
    if (!pattern) return false;

    const requestPriority = pattern.priorityMapping;
    const now = Date.now();

    // 1. Throttling and Override Logic
    const timeDelta = now - lastHapticTime;
    const currentWeight = PriorityWeights[requestPriority] || 1;
    const lastWeight = PriorityWeights[lastHapticPriority] || 1;

    if (timeDelta < THROTTLE_WINDOW_MS) {
      // If incoming request has lower or equal priority, suppress it to save battery & user sanity
      if (currentWeight <= lastWeight) {
        console.log(`[Haptic Service] Suppressed storm vibration: ${patternId} (Cooldown active)`);
        return false;
      }
      // If higher, we let it bypass cooldown
      console.log(`[Haptic Service] Bypassing cooldown: High priority ${requestPriority} overrides ${lastHapticPriority}`);
    }

    try {
      lastHapticTime = now;
      lastHapticPriority = requestPriority;

      if (pattern.duration.length === 1) {
        await Haptics.vibrate({ duration: pattern.duration[0] });
      } else {
        console.log(`[Native Bridge] Firing Haptic Pattern: ${patternId}`, pattern.duration);
        await Haptics.vibrate();
      }
      return true;
    } catch (error) {
      console.error(`[Haptic Service] Failed to execute haptic: ${patternId}`, error);
      return false;
    }
  },

  cleanup() {
    lastHapticTime = 0;
    lastHapticPriority = 'LOW';
  }
};
export default hapticService;

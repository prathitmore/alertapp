import { NativeAudio } from '@capacitor-community/native-audio';
import { hapticService } from './hapticService';
import { diagnosticsService } from './diagnosticsService';

/**
 * Sound Service (Native Audio Production)
 * Handles playback of alerts.
 * Deterministic options: REPLACE (stop previous), QUEUE (play after), IGNORE_DUPLICATE (skip if playing).
 * Fallback: .opus -> .mp3 -> Haptic-Only
 */

let currentPlaying = null;
let audioQueue = [];
let isPlaying = false;
let preloadedAssets = new Set();
let completeListenerAdded = false;
let completeListenerHandle = null;
let lastFinishedSoundId = null;
let lastFinishedSoundTime = 0;

export const soundService = {
  async ensureListener() {
    if (!completeListenerAdded && window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        await NativeAudio.removeAllListeners();
        completeListenerHandle = await NativeAudio.addListener('complete', (data) => {
          console.log(`[Sound Service] Audio complete callback for asset: ${data?.assetId}`);
          if (currentPlaying === data?.assetId) {
            soundService.handlePlaybackFinished();
          }
        });
        completeListenerAdded = true;
      } catch (e) {
        console.error('[Sound Service] Failed to register complete listener', e);
      }
    }
  },

  async preloadAsset(assetId, fileName) {
    if (preloadedAssets.has(assetId)) return true;
    try {
      await NativeAudio.preload({
        assetId: assetId,
        assetPath: `public/sounds/${fileName}`,
        audioChannelNum: 1,
        isUrl: false
      });
      preloadedAssets.add(assetId);
      return true;
    } catch (e) {
      return false;
    }
  },

  async preloadWithFallbacks(soundId) {
    if (preloadedAssets.has(soundId)) return true;

    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
      return false; // Not running native
    }

    // Load .mp3 (Renamed from .opus for NativeAudio reliability)
    let success = await this.preloadAsset(soundId, `${soundId}.mp3`);
    if (success) return true;

    diagnosticsService.logDegradation('AUDIO_FALLBACK', `Failed to load ${soundId}.`);
    return false;
  },

  playSound: async (soundConfig, options = { mode: 'REPLACE' }) => {
    if (!soundConfig || !soundConfig.soundId) return false;
    const { soundId } = soundConfig;

    if (soundId === 'mute') {
      await soundService.stopCurrent();
      return true;
    }

    // IGNORE_DUPLICATE logic
    if (options.mode === 'IGNORE_DUPLICATE' && currentPlaying === soundId && isPlaying) {
      console.log(`[Sound Service] Duplicate play request ignored for: ${soundId}`);
      return true;
    }

    // REPLACE logic
    if (options.mode === 'REPLACE') {
      await soundService.stopCurrent();
    }

    // QUEUE logic
    if (options.mode === 'QUEUE' && isPlaying) {
      audioQueue.push({ soundConfig, options });
      console.log(`[Sound Service] Queued: ${soundId}`);
      return true;
    }

    await soundService.ensureListener();

    try {
      currentPlaying = soundId;
      isPlaying = true;

      const canPlay = await soundService.preloadWithFallbacks(soundId);
      
      if (canPlay) {
        // Smart volume normalization levels
        const VOLUME_LEVELS = {
          LOW: 0.3,
          NORMAL: 0.65,
          BOOSTED: 1.0
        };

        let volume = 0.65; // Default Normal level

        if (soundConfig.volume) {
          if (typeof soundConfig.volume === 'string') {
            volume = VOLUME_LEVELS[soundConfig.volume.toUpperCase()] || 0.65;
          } else if (typeof soundConfig.volume === 'number') {
            volume = soundConfig.volume;
          }
        } else {
          // Hardcode baseline gain boosts for quiet alerts: low battery, charger events, network losses
          const quietAlertTerms = [
            'low_battery', 'battery_low', 'battery_full', 'charger_connected', 
            'charger_disconnected', 'wifi_lost', 'bluetooth_lost'
          ];
          const isQuiet = quietAlertTerms.some(term => soundId.toLowerCase().includes(term));
          if (isQuiet) {
            volume = 1.0; // Boost slightly but safely
          }
        }

        try {
          if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            await NativeAudio.setVolume({ assetId: soundId, volume: volume });
          }
          console.log(`[Native Bridge] Volume set to ${volume} for sound asset: ${soundId}`);
        } catch (volError) {
          console.warn(`[Sound Service] Failed to set volume for ${soundId}`, volError);
        }

        console.log(`[Native Bridge] Playing sound asset: ${soundId} (Mode: ${options.mode})`);
        await NativeAudio.play({ assetId: soundId });
        
        // Safety fallback: Unstick the queue if the native complete event is dropped!
        setTimeout(() => {
          if (currentPlaying === soundId && isPlaying) {
            console.warn(`[DEBUG GUARD] Safety timeout unstuck the queue for ${soundId}`);
            soundService.handlePlaybackFinished();
          }
        }, 5000); // 5s max duration for telemetry alerts
      } else {
        console.warn(`[Sound Service] Missing audio files for ${soundId}. Executing haptic-only fallback.`);
        diagnosticsService.logFallbackUsage();
        
        // Haptic-only fallback
        hapticService.triggerHaptic({ hapticPattern: 'DOUBLE_PULSE' });
        
        // Simulate playback duration for queue
        setTimeout(() => {
          soundService.handlePlaybackFinished();
        }, 1500);
      }
      return true;
    } catch (error) {
      console.error(`[Sound Service] Failed to play sound: ${soundId}`, error);
      diagnosticsService.logFailedPlayback();
      isPlaying = false;
      return false;
    }
  },

  stopCurrent: async () => {
    if (currentPlaying) {
      console.log(`[Native Bridge] Stopping sound asset: ${currentPlaying}`);
      try {
        if (preloadedAssets.has(currentPlaying)) {
          await NativeAudio.stop({ assetId: currentPlaying });
        }
      } catch (e) {
        console.warn(`[Sound Service] Stop failed for ${currentPlaying}`, e);
      }
      currentPlaying = null;
      isPlaying = false;
    }
  },

  handlePlaybackFinished: () => {
    console.log(`[DEBUG GUARD] sound completion detected for assetId: ${currentPlaying}`);
    if (currentPlaying) {
      lastFinishedSoundId = currentPlaying;
      lastFinishedSoundTime = Date.now();
      isPlaying = false;
      currentPlaying = null;
    }

    soundService.processQueue();
  },

  processQueue: () => {
    if (audioQueue.length > 0) {
      const next = audioQueue.shift();
      
      // Prevent circular queue loops
      if (next.soundConfig.soundId === lastFinishedSoundId && (Date.now() - lastFinishedSoundTime < 2000)) {
        console.warn(`[Sound Service] Suppressed circular queue recursion for: ${next.soundConfig.soundId}`);
        // Process next item without stuck queue
        setTimeout(() => {
          soundService.processQueue();
        }, 50);
        return;
      }
      
      // Play next sound asynchronously
      setTimeout(() => {
        soundService.playSound(next.soundConfig, next.options);
      }, 50);
    }
  },

  cleanup: async () => {
    await soundService.stopCurrent();
    for (const assetId of preloadedAssets) {
      try {
        await NativeAudio.unload({ assetId });
      } catch (e) {}
    }
    preloadedAssets.clear();
    audioQueue = [];
    isPlaying = false;
    if (completeListenerHandle) {
      try {
        await completeListenerHandle.remove();
      } catch (e) {
        console.warn('[Sound Service] Failed to remove native listener', e);
      }
      completeListenerHandle = null;
    }
    completeListenerAdded = false;
    lastFinishedSoundId = null;
    lastFinishedSoundTime = 0;
  }
};
export default soundService;

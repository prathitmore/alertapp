import { Geolocation } from '@capacitor/geolocation';

/**
 * Location Service (Hardened)
 * Battery-Safe Adaptive Polling:
 * - Uses dynamic polling interval instead of high-frequency GPS watch.
 * - Distance-adaptive algorithm adjusts interval based on nearest geofence.
 * - Jitter reduction via coordinate sliding window average.
 */

let stateCallback = null;
let pollTimeout = null;
let lastKnownState = new Map();
let coordinateHistory = []; // Average window for smoothing

const MAX_HISTORY_SIZE = 3;
const FARTHEST_INTERVAL_MS = 300000; // 5 minutes if far
const MID_INTERVAL_MS = 60000;       // 1 minute if semi-close
const CLOSE_INTERVAL_MS = 15000;     // 15 seconds if near boundary

const TARGET_REGIONS = [
  { id: 'home', name: 'Home', lat: 37.7749, lng: -122.4194, radiusMeters: 100 },
  { id: 'office', name: 'Office', lat: 37.7894, lng: -122.4082, radiusMeters: 150 }
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const locationService = {
  init() {
    console.log('[Location Service] Hardened Service Initialized');
  },

  subscribe(onStateChange) {
    this.unsubscribe();
    stateCallback = onStateChange;

    // Start adaptive checking loop
    this.scheduleNextCheck(MID_INTERVAL_MS);
  },

  scheduleNextCheck(delayMs) {
    if (pollTimeout) clearTimeout(pollTimeout);
    pollTimeout = setTimeout(() => this.checkLocation(), delayMs);
  },

  async checkLocation() {
    if (!stateCallback) return;

    let nextInterval = MID_INTERVAL_MS;

    try {
      // Single shot request to preserve battery
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false, // Cell tower/Wi-Fi positioning is enough and saves battery
        timeout: 10000,
        maximumAge: 30000
      });

      if (position && position.coords) {
        const { latitude, longitude } = position.coords;
        nextInterval = this.processCoordinatesAndCalculateInterval(latitude, longitude);
      }
    } catch (e) {
      console.error('[Location Service] Position fetch failed, using fallback interval', e);
      nextInterval = MID_INTERVAL_MS;
    }

    this.scheduleNextCheck(nextInterval);
  },

  processCoordinatesAndCalculateInterval(lat, lng) {
    // 1. Jitter Reduction: Sliding window coordinate averaging
    coordinateHistory.push({ lat, lng });
    if (coordinateHistory.length > MAX_HISTORY_SIZE) coordinateHistory.shift();

    const sumCoords = coordinateHistory.reduce((acc, curr) => {
      acc.lat += curr.lat;
      acc.lng += curr.lng;
      return acc;
    }, { lat: 0, lng: 0 });

    const smoothedLat = sumCoords.lat / coordinateHistory.length;
    const smoothedLng = sumCoords.lng / coordinateHistory.length;

    let minDistance = Infinity;

    // 2. Evaluate Geofence transitions
    TARGET_REGIONS.forEach(region => {
      const distance = calculateDistance(smoothedLat, smoothedLng, region.lat, region.lng);
      minDistance = Math.min(minDistance, distance);

      const isInside = distance <= region.radiusMeters;
      const previousState = lastKnownState.get(region.id);

      if (previousState !== undefined && previousState !== isInside) {
        lastKnownState.set(region.id, isInside);
        stateCallback({
          regionId: region.id,
          regionName: region.name,
          event: isInside ? 'ENTER' : 'EXIT',
          distance
        });
      } else if (previousState === undefined) {
        lastKnownState.set(region.id, isInside);
      }
    });

    // 3. Adaptive Power Algorithm: Calculate next check delay based on proximity
    if (minDistance > 1000) {
      return FARTHEST_INTERVAL_MS; // 5 min
    } else if (minDistance > 300) {
      return MID_INTERVAL_MS;      // 1 min
    } else {
      return CLOSE_INTERVAL_MS;    // 15 sec
    }
  },

  unsubscribe() {
    if (pollTimeout) {
      clearTimeout(pollTimeout);
      pollTimeout = null;
    }
    stateCallback = null;
    coordinateHistory = [];
  },

  cleanup() {
    this.unsubscribe();
    lastKnownState.clear();
    console.log('[Location Service] Cleaned up');
  }
};
export default locationService;

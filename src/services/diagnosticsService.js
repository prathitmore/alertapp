export const diagnosticsService = {
  getStats() {
    try {
      const stats = localStorage.getItem('auraping_diagnostics');
      return stats ? JSON.parse(stats) : {
        missedTriggers: 0,
        failedPlayback: 0,
        fallbackUsage: 0,
        listenerDegradation: 0
      };
    } catch (e) {
      return { missedTriggers: 0, failedPlayback: 0, fallbackUsage: 0, listenerDegradation: 0 };
    }
  },

  saveStats(stats) {
    try {
      localStorage.setItem('auraping_diagnostics', JSON.stringify(stats));
    } catch (e) {}
  },

  increment(key) {
    const stats = this.getStats();
    if (stats[key] !== undefined) {
      stats[key] += 1;
      this.saveStats(stats);
      console.log(`[Diagnostics] Incremented ${key}: ${stats[key]}`);
    }
  },

  logMissedTrigger() {
    this.increment('missedTriggers');
  },

  logFailedPlayback() {
    this.increment('failedPlayback');
  },

  logFallbackUsage() {
    this.increment('fallbackUsage');
  },

  logListenerDegradation() {
    this.increment('listenerDegradation');
  },

  clear() {
    localStorage.removeItem('auraping_diagnostics');
  }
};

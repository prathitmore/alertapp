import { SoundRegistry, HapticRegistry, CategoryRegistry } from '../data/registries';

// Lookups
export const getCategoryById = (categoryId) => {
  return CategoryRegistry.find(cat => cat.id === categoryId);
};

export const getHapticPattern = (patternId) => {
  return HapticRegistry[patternId] || HapticRegistry['GENTLE_TAP'];
};

export const getSoundAsset = (categoryId, level = 'SOFT') => {
  const catSounds = SoundRegistry[categoryId];
  if (!catSounds) return null;
  return catSounds[level.toLowerCase()] || catSounds.soft;
};

// Priority mappings
export const priorityToColor = (priority) => {
  switch (priority) {
    case 'LOW': return 'var(--text-muted)';
    case 'MEDIUM': return 'var(--primary-color)';
    case 'HIGH': return 'var(--warning-color)';
    case 'CRITICAL': return 'var(--danger-color)';
    default: return 'var(--text-muted)';
  }
};

export const priorityToHaptic = (priority) => {
  switch (priority) {
    case 'LOW': return 'GENTLE_TAP';
    case 'MEDIUM': return 'DOUBLE_PULSE';
    case 'HIGH': return 'HEAVY_PULSE';
    case 'CRITICAL': return 'ESCALATING';
    default: return 'GENTLE_TAP';
  }
};

// Search & Filtering
export const filterAlerts = (alerts, { query, activeFilter }) => {
  let filtered = [...alerts];

  // Apply Filter Pill
  if (activeFilter === 'ACTIVE') {
    filtered = filtered.filter(a => a.enabled);
  } else if (activeFilter === 'FAVORITES') {
    filtered = filtered.filter(a => a.isFavorite);
  } else if (activeFilter === 'CRITICAL') {
    filtered = filtered.filter(a => a.priority === 'CRITICAL');
  } else if (activeFilter === 'RECENT') {
    // Sort by updated inside last 24h
    const dayAgo = new Date(Date.now() - 86400000).getTime();
    filtered = filtered.filter(a => new Date(a.updatedAt).getTime() > dayAgo);
  }

  // Apply Query
  if (query && query.trim() !== '') {
    const q = query.toLowerCase();
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(q) || 
      getCategoryById(a.category)?.name.toLowerCase().includes(q)
    );
  }

  return filtered;
};

// Reliability Tiering
export const getTriggerTier = (triggerType) => {
  const t1 = ['BATTERY', 'CHARGING', 'WIFI', 'BLUETOOTH', 'NOTIFICATION', 'OTP', 'SYSTEM'];
  const t2 = ['LOCATION', 'REMINDER', 'TIME'];
  const t3 = ['MOTION', 'AUDIO'];
  
  if (t1.includes(triggerType)) return { tier: 1, label: 'Full Background', color: '#10B981' }; // Green
  if (t2.includes(triggerType)) return { tier: 2, label: 'App Active', color: '#F59E0B' };      // Yellow
  if (t3.includes(triggerType)) return { tier: 3, label: 'Foreground Only', color: '#EF4444' }; // Red
  return { tier: 3, label: 'Foreground Only', color: '#EF4444' };
};

// Rule Validation (Future-ready)
export const validateAlertRule = (alertRule) => {
  const errors = [];
  if (!alertRule.name) errors.push("Name is required.");
  if (!alertRule.trigger || !alertRule.trigger.type) errors.push("Trigger is required.");
  if (!alertRule.actions || alertRule.actions.length === 0) errors.push("At least one Action is required.");
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Mock Alert Generator
export const generateMockAlertId = () => {
  return `alert_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

import { CategoryRegistry } from './registries';

const triggerMappings = {
  battery_full: { type: 'BATTERY', operator: 'EQUALS', value: '100' },
  low_battery: { type: 'BATTERY', operator: 'LESS_THAN', value: '20' },
  charger_connected: { type: 'CHARGING', operator: 'EQUALS', value: 'CONNECTED' },
  charger_disconnected: { type: 'CHARGING', operator: 'EQUALS', value: 'DISCONNECTED' },
  bt_connected: { type: 'BLUETOOTH', operator: 'EQUALS', value: 'CONNECTED' },
  bt_lost: { type: 'BLUETOOTH', operator: 'EQUALS', value: 'DISCONNECTED' },
  wifi_connected: { type: 'WIFI', operator: 'EQUALS', value: 'CONNECTED' },
  wifi_lost: { type: 'WIFI', operator: 'EQUALS', value: 'DISCONNECTED' },
  otp_detected: { type: 'OTP', operator: 'EQUALS', value: 'DETECTED' },
  keyword_detected: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'aura' },
  location_entered: { type: 'LOCATION', operator: 'EQUALS', value: 'ENTER' },
  location_exited: { type: 'LOCATION', operator: 'EQUALS', value: 'EXIT' },
  phone_moved: { type: 'MOTION', operator: 'EQUALS', value: 'MOVED' },
  phone_picked_up: { type: 'MOTION', operator: 'EQUALS', value: 'PICKED_UP' },
  wrong_password: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'wrong password' },
  sim_changed: { type: 'SYSTEM', operator: 'EQUALS', value: 'SIM_CHANGED' },
  low_storage: { type: 'SYSTEM', operator: 'EQUALS', value: 'LOW_STORAGE' },
  overheat: { type: 'BATTERY', operator: 'EQUALS', value: 'OVERHEAT' },
  wakeup_alarm_loop: { type: 'REMINDER', operator: 'EQUALS', value: '07:00' },
  sleep_reminder: { type: 'REMINDER', operator: 'EQUALS', value: '22:00' },
  water_reminder: { type: 'REMINDER', operator: 'EQUALS', value: '14:00' },
  clap_detect: { type: 'AUDIO', operator: 'EQUALS', value: 'CLAP' },
  loud_noise: { type: 'AUDIO', operator: 'EQUALS', value: 'LOUD_NOISE' },
  cab_nearby: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'cab' },
  food_delivery_nearby: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'delivery' },
  cash_received: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'received' },
  rain_alert: { type: 'REMINDER', operator: 'EQUALS', value: 'RAIN' },
  iss_pass: { type: 'REMINDER', operator: 'EQUALS', value: 'ISS' }
};

const priorities = {
  otp_detected: 'CRITICAL',
  wrong_password: 'CRITICAL',
  sim_changed: 'CRITICAL',
  overheat: 'CRITICAL',
  phone_moved: 'HIGH',
  low_battery: 'HIGH',
  wakeup_alarm_loop: 'HIGH',
  battery_full: 'MEDIUM',
  wifi_lost: 'MEDIUM',
  bt_lost: 'MEDIUM',
  location_entered: 'MEDIUM',
  location_exited: 'MEDIUM',
  low_storage: 'MEDIUM',
  loud_noise: 'MEDIUM',
  cash_received: 'MEDIUM',
  rain_alert: 'MEDIUM',
  phone_picked_up: 'LOW',
  charger_connected: 'LOW',
  charger_disconnected: 'LOW',
  bt_connected: 'LOW',
  wifi_connected: 'LOW',
  keyword_detected: 'LOW',
  sleep_reminder: 'LOW',
  water_reminder: 'LOW',
  clap_detect: 'LOW',
  cab_nearby: 'LOW',
  food_delivery_nearby: 'LOW',
  iss_pass: 'LOW'
};

const haptics = {
  CRITICAL: 'ESCALATING',
  HIGH: 'HEAVY_PULSE',
  MEDIUM: 'DOUBLE_PULSE',
  LOW: 'GENTLE_TAP'
};

const PredefinedAlerts = CategoryRegistry.map((cat, idx) => {
  const priority = priorities[cat.id] || 'MEDIUM';
  const trigger = triggerMappings[cat.id] || { type: 'NOTIFICATION', operator: 'CONTAINS', value: cat.name.toLowerCase() };
  
  return {
    id: `predefined_${cat.id}`,
    name: cat.name,
    category: cat.id,
    enabled: idx < 6, // Enable first 6 by default
    isFavorite: idx < 3, // Favorite first 3 by default
    isTemplate: false,
    priority: priority,
    trigger: trigger,
    conditions: [],
    actions: [
      { type: 'SOUND', config: { soundId: `${cat.id}_medium` } },
      { type: 'HAPTIC', config: { hapticPattern: haptics[priority] } }
    ],
    createdAt: new Date(Date.now() - (idx * 3600000)).toISOString(),
    updatedAt: new Date(Date.now() - (idx * 3600000)).toISOString(),
  };
});

const CustomMockAlerts = [
  {
    id: 'alert_custom_1',
    name: 'Server Rack Monitor',
    category: 'custom',
    enabled: true,
    isFavorite: false,
    isTemplate: false,
    priority: 'MEDIUM',
    trigger: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'server offline' },
    conditions: [],
    actions: [
      { type: 'SOUND', config: { soundId: 'wrong_password_critical' } },
      { type: 'HAPTIC', config: { hapticPattern: 'DOUBLE_PULSE' } }
    ],
    createdAt: new Date(Date.now() - 30000000).toISOString(),
    updatedAt: new Date(Date.now() - 30000000).toISOString()
  }
];

export const MockAlerts = [...PredefinedAlerts, ...CustomMockAlerts];

export const MockLogs = [
  {
    id: 'log_1',
    alertId: 'predefined_low_battery',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'SUCCESS',
    details: 'Low Battery Alert triggered (Sound played, Haptic vibrated)'
  },
  {
    id: 'log_2',
    alertId: 'predefined_otp_detected',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    status: 'SUCCESS',
    details: 'OTP Detected: [OTP REDACTED] from Google Auth (Sound played)'
  },
  {
    id: 'log_3',
    alertId: 'predefined_phone_moved',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: 'SUCCESS',
    details: 'Device acceleration detected (Anti-theft Haptic triggered)'
  }
];

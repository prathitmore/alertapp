/**
 * AuraPing Global Registries
 * This file contains the foundational mapping for Sounds, Haptics, Categories, and Templates.
 */

// 1. Haptic Registry
export const HapticRegistry = {
  GENTLE_TAP: { strength: 'light', duration: [50], priorityMapping: 'LOW' },
  SMOOTH_PULSE: { strength: 'light', duration: [100, 50, 100], priorityMapping: 'LOW' },
  DOUBLE_PULSE: { strength: 'medium', duration: [100, 100, 100], priorityMapping: 'MEDIUM' },
  SHORT_REPEAT: { strength: 'medium', duration: [50, 50, 50, 50], priorityMapping: 'MEDIUM' },
  HEAVY_PULSE: { strength: 'heavy', duration: [300, 100, 300], priorityMapping: 'HIGH' },
  TRIPLE_PULSE: { strength: 'heavy', duration: [200, 100, 200, 100, 200], priorityMapping: 'CRITICAL' },
  ESCALATING: { strength: 'escalating', duration: [400, 100, 400, 100, 600, 100, 800], priorityMapping: 'CRITICAL' }
};

// 2. Alert Category Registry (28 Categories)
export const CategoryRegistry = [
  { id: 'battery_full', name: 'Battery Full', icon: 'Battery' },
  { id: 'low_battery', name: 'Low Battery', icon: 'BatteryWarning' },
  { id: 'charger_connected', name: 'Charger Connected', icon: 'Zap' },
  { id: 'charger_disconnected', name: 'Charger Disconnected', icon: 'ZapOff' },
  { id: 'bt_connected', name: 'Bluetooth Connected', icon: 'Bluetooth' },
  { id: 'bt_lost', name: 'Bluetooth Lost', icon: 'BluetoothOff' },
  { id: 'wifi_connected', name: 'Wi-Fi Connected', icon: 'Wifi' },
  { id: 'wifi_lost', name: 'Wi-Fi Lost', icon: 'WifiOff' },
  { id: 'otp_detected', name: 'OTP Detected', icon: 'MessageSquare' },
  { id: 'keyword_detected', name: 'Keyword Detected', icon: 'Text' },
  { id: 'location_entered', name: 'Location Entered', icon: 'MapPin' },
  { id: 'location_exited', name: 'Location Exited', icon: 'MapPinOff' },
  { id: 'phone_moved', name: 'Phone Moved', icon: 'Smartphone' },
  { id: 'phone_picked_up', name: 'Phone Picked Up', icon: 'ArrowUpCircle' },
  { id: 'wrong_password', name: 'Wrong Password', icon: 'ShieldAlert' },
  { id: 'sim_changed', name: 'SIM Changed', icon: 'SimCard' },
  { id: 'low_storage', name: 'Low Storage', icon: 'HardDrive' },
  { id: 'overheat', name: 'Overheating', icon: 'Thermometer' },
  { id: 'wakeup_alarm_loop', name: 'Wakeup Alarm', icon: 'Sunrise' },
  { id: 'sleep_reminder', name: 'Sleep Reminder', icon: 'Moon' },
  { id: 'water_reminder', name: 'Water Reminder', icon: 'Droplet' },
  { id: 'clap_detect', name: 'Clap Detected', icon: 'Hands' },
  { id: 'loud_noise', name: 'Loud Noise', icon: 'VolumeX' },
  { id: 'cab_nearby', name: 'Cab Nearby', icon: 'Car' },
  { id: 'food_delivery_nearby', name: 'Food Delivery Nearby', icon: 'ShoppingBag' },
  { id: 'cash_received', name: 'Cash Received', icon: 'DollarSign' },
  { id: 'rain_alert', name: 'Rain Alert', icon: 'CloudRain' },
  { id: 'iss_pass', name: 'ISS Pass', icon: 'Globe' }
];

// 3. Sound Registry (84 Sounds automatically generated via map to match E:\alert sounds)
// Stored internally as e.g. "assets/sounds/low_battery_soft.mp3"
export const SoundRegistry = CategoryRegistry.reduce((acc, cat) => {
  acc[cat.id] = {
    category: cat.id,
    soft: { id: `${cat.id}_soft`, file: `${cat.id}_soft.mp3`, level: 'SOFT', loop: false, defaultHaptic: 'GENTLE_TAP' },
    medium: { id: `${cat.id}_medium`, file: `${cat.id}_medium.mp3`, level: 'MEDIUM', loop: false, defaultHaptic: 'DOUBLE_PULSE' },
    critical: { id: `${cat.id}_critical`, file: `${cat.id}_critical.mp3`, level: 'CRITICAL', loop: true, defaultHaptic: 'ESCALATING' },
  };
  return acc;
}, {});

// Special overrides for sounds that inherently loop
SoundRegistry['wakeup_alarm_loop'].soft.loop = true;
SoundRegistry['wakeup_alarm_loop'].medium.loop = true;

// 4. Template Registry
export const TemplateRegistry = [
  {
    id: 'tpl_battery_guardian',
    name: 'Battery Guardian',
    description: 'Alerts when battery drops below 20%.',
    priority: 'HIGH',
    trigger: { type: 'BATTERY', operator: 'LESS_THAN', value: 20 },
    conditions: [],
    actions: [{ type: 'SOUND', config: { soundId: 'low_battery_critical' } }, { type: 'HAPTIC', config: { hapticPattern: 'HEAVY_PULSE' } }]
  },
  {
    id: 'tpl_delivery_tracker',
    name: 'Delivery Tracker',
    description: 'Catches delivery notification keywords.',
    priority: 'MEDIUM',
    trigger: { type: 'NOTIFICATION', operator: 'CONTAINS', value: 'arriving' },
    conditions: [],
    actions: [{ type: 'SOUND', config: { soundId: 'food_delivery_nearby_medium' } }, { type: 'VISUAL', config: { visualStyle: 'POPUP' } }]
  },
  {
    id: 'tpl_anti_theft',
    name: 'Anti-Theft',
    description: 'Full alarm if phone is moved while locked.',
    priority: 'CRITICAL',
    trigger: { type: 'MOTION', operator: 'EQUALS', value: 'MOVED' },
    conditions: [{ type: 'SCREEN_STATE', value: 'LOCKED' }],
    actions: [{ type: 'SOUND', config: { soundId: 'wrong_password_critical' } }, { type: 'HAPTIC', config: { hapticPattern: 'ESCALATING' } }, { type: 'VISUAL', config: { visualStyle: 'FULLSCREEN' } }]
  },
  {
    id: 'tpl_office_mode',
    name: 'Office Mode',
    description: 'Mutes alerts when connected to Office Wi-Fi.',
    priority: 'LOW',
    trigger: { type: 'WIFI', operator: 'EQUALS', value: 'Office_Network' },
    conditions: [{ type: 'DAY_OF_WEEK', value: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }],
    actions: [{ type: 'HAPTIC', config: { hapticPattern: 'SMOOTH_PULSE' } }]
  },
  {
    id: 'tpl_sleep_mode',
    name: 'Sleep Mode',
    description: 'Prevents non-critical alerts at night.',
    priority: 'LOW',
    trigger: { type: 'TIME', operator: 'EQUALS', value: '23:00' },
    conditions: [],
    actions: [{ type: 'VISUAL', config: { visualStyle: 'BANNER' } }]
  },
  {
    id: 'tpl_travel_mode',
    name: 'Travel Mode',
    description: 'Alerts if cab is nearby or location exits home.',
    priority: 'MEDIUM',
    trigger: { type: 'LOCATION', operator: 'EXITS', value: 'Home' },
    conditions: [],
    actions: [{ type: 'SOUND', config: { soundId: 'cab_nearby_medium' } }, { type: 'HAPTIC', config: { hapticPattern: 'DOUBLE_PULSE' } }]
  }
];

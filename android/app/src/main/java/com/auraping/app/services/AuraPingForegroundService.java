package com.auraping.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.media.MediaPlayer;
import android.os.BatteryManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import com.auraping.app.MainActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class AuraPingForegroundService extends Service {
    private static final String TAG = "AuraPingService";
    private static final String CHANNEL_ID = "AuraPingForegroundChannel";
    private static final int NOTIFICATION_ID = 1001;
    
    private static boolean isRunning = false;
    private JSONArray activeRules = new JSONArray();
    private Map<String, Long> lastFired = new HashMap<>();
    private Map<String, Boolean> previousMatchState = new HashMap<>();
    private BroadcastReceiver eventReceiver;
    private boolean previousWifiState = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        registerEventReceiver();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "[DEBUG GUARD] Duplicate service start check: onStartCommand called. isRunning=" + isRunning);
        if (intent != null) {
            Log.d(TAG, "[AURAPING_DEBUG] service started/restored with intent");
            String action = intent.getAction();
            if ("STOP_SERVICE".equals(action)) {
                isRunning = false;
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }

            if (intent.hasExtra("rules")) {
                try {
                    activeRules = new JSONArray(intent.getStringExtra("rules"));
                } catch (Exception e) {
                    Log.e(TAG, "Failed to parse rules", e);
                }
            }
        }

        if (activeRules.length() == 0) {
            try {
                SharedPreferences prefs = getSharedPreferences("AuraPingNative", Context.MODE_PRIVATE);
                String rulesStr = prefs.getString("activeRules", "[]");
                activeRules = new JSONArray(rulesStr);
                Log.d(TAG, "[DEBUG GUARD] Loaded rules from SharedPreferences natively: " + activeRules.length());
            } catch (Exception e) {
                Log.e(TAG, "Failed to load rules from SharedPreferences", e);
            }
        }

        if (isRunning) {
            return START_STICKY;
        }
        isRunning = true;

        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("AuraPing Active")
                .setContentText("Monitoring critical alerts in the background")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "ForegroundServiceStartNotAllowedException caught: ", e);
        }

        return START_STICKY;
    }

    private void registerEventReceiver() {
        eventReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (action == null) return;

                try {
                    if (Intent.ACTION_BATTERY_CHANGED.equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: ACTION_BATTERY_CHANGED at " + System.currentTimeMillis());
                        int level = intent.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                        int status = intent.getIntExtra(android.os.BatteryManager.EXTRA_STATUS, -1);
                        boolean isCharging = status == android.os.BatteryManager.BATTERY_STATUS_CHARGING ||
                                             status == android.os.BatteryManager.BATTERY_STATUS_FULL;
                        
                        JSONObject payload = new JSONObject();
                        payload.put("level", level);
                        payload.put("isCharging", isCharging);
                        
                        evaluateRules("BATTERY", payload);
                        evaluateRules("CHARGING", payload);
                    } else if ("com.auraping.app.NOTIFICATION_RECEIVED".equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: NOTIFICATION at " + System.currentTimeMillis());
                        JSONObject payload = new JSONObject();
                        payload.put("title", intent.getStringExtra("title"));
                        payload.put("body", intent.getStringExtra("body"));
                        payload.put("packageName", intent.getStringExtra("packageName"));
                        evaluateRules("NOTIFICATION", payload);
                        evaluateRules("OTP", payload);
                    } else if ("android.net.wifi.STATE_CHANGE".equals(action)) {
                        android.net.NetworkInfo info = intent.getParcelableExtra(android.net.wifi.WifiManager.EXTRA_NETWORK_INFO);
                        if (info != null) {
                            boolean isConnected = info.isConnected();
                            android.net.wifi.WifiInfo wifiInfo = intent.getParcelableExtra(android.net.wifi.WifiManager.EXTRA_WIFI_INFO);
                            String ssid = (wifiInfo != null && isConnected) ? wifiInfo.getSSID() : "unknown";
                            
                            Log.d(TAG, "[AURAPING_WIFI]\npreviousState=" + previousWifiState + "\ncurrentState=" + isConnected + "\nssid=" + ssid + "\nalertTriggered=" + (previousWifiState != isConnected));
                            
                            if (previousWifiState != isConnected) {
                                previousWifiState = isConnected;
                                JSONObject payload = new JSONObject();
                                payload.put("isConnected", isConnected);
                                evaluateRules("WIFI", payload);
                            }
                        }
                    } else if ("android.bluetooth.device.action.ACL_CONNECTED".equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: BLUETOOTH CONNECTED at " + System.currentTimeMillis());
                        JSONObject payload = new JSONObject();
                        payload.put("isConnected", true);
                        evaluateRules("BLUETOOTH", payload);
                    } else if ("android.bluetooth.device.action.ACL_DISCONNECTED".equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: BLUETOOTH DISCONNECTED at " + System.currentTimeMillis());
                        JSONObject payload = new JSONObject();
                        payload.put("isConnected", false);
                        evaluateRules("BLUETOOTH", payload);
                    } else if ("android.bluetooth.adapter.action.STATE_CHANGED".equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: BLUETOOTH STATE at " + System.currentTimeMillis());
                        int state = intent.getIntExtra(android.bluetooth.BluetoothAdapter.EXTRA_STATE, -1);
                        if (state == android.bluetooth.BluetoothAdapter.STATE_ON) {
                            JSONObject payload = new JSONObject();
                            payload.put("isConnected", true);
                            evaluateRules("BLUETOOTH", payload);
                        } else if (state == android.bluetooth.BluetoothAdapter.STATE_OFF) {
                            JSONObject payload = new JSONObject();
                            payload.put("isConnected", false);
                            evaluateRules("BLUETOOTH", payload);
                        }
                    } else if (Intent.ACTION_DEVICE_STORAGE_LOW.equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: DEVICE_STORAGE_LOW at " + System.currentTimeMillis());
                        JSONObject payload = new JSONObject();
                        payload.put("event", "LOW_STORAGE");
                        evaluateRules("SYSTEM", payload);
                    } else if ("android.intent.action.SIM_STATE_CHANGED".equals(action)) {
                        Log.d(TAG, "[AURAPING_LATENCY] trigger received: SIM_STATE_CHANGED at " + System.currentTimeMillis());
                        JSONObject payload = new JSONObject();
                        payload.put("event", "SIM_CHANGED");
                        evaluateRules("SYSTEM", payload);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in receiver", e);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_BATTERY_CHANGED);
        filter.addAction("com.auraping.app.NOTIFICATION_RECEIVED");
        filter.addAction("android.net.wifi.STATE_CHANGE");
        filter.addAction("android.bluetooth.device.action.ACL_CONNECTED");
        filter.addAction("android.bluetooth.device.action.ACL_DISCONNECTED");
        filter.addAction("android.bluetooth.adapter.action.STATE_CHANGED");
        filter.addAction(Intent.ACTION_DEVICE_STORAGE_LOW);
        filter.addAction("android.intent.action.SIM_STATE_CHANGED");
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(eventReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(eventReceiver, filter);
        }
    }

    private void evaluateRules(String triggerType, JSONObject payload) {
        if (activeRules == null) return;
        Log.d(TAG, "[AURAPING_LATENCY] evaluating rules for type: " + triggerType + " at " + System.currentTimeMillis());
        try {
            for (int i = 0; i < activeRules.length(); i++) {
                JSONObject rule = activeRules.getJSONObject(i);
                String ruleId = rule.optString("id", "unknown");
                Log.d(TAG, "[AURAPING_CRITICAL_TRACE] rule loaded: " + ruleId);

                if (!rule.optBoolean("enabled", false)) {
                    Log.d(TAG, "[AURAPING_CRITICAL_TRACE] event ignored (rule disabled): " + ruleId);
                    continue;
                }
                
                String priority = rule.optString("priority", "LOW");
                
                JSONObject trigger = rule.getJSONObject("trigger");
                if (!trigger.getString("type").equals(triggerType)) {
                    continue;
                }
                
                boolean isMatch = false;
                if (triggerType.equals("BATTERY")) {
                    String valStr = trigger.optString("value", "");
                    if (valStr.equals("OVERHEAT")) continue; // Hard to evaluate here simply
                    int val = Integer.parseInt(valStr);
                    String op = trigger.getString("operator");
                    int level = payload.getInt("level");
                    if (op.equals("LESS_THAN") && level < val) isMatch = true;
                    if (op.equals("GREATER_THAN") && level > val) isMatch = true;
                    if (op.equals("EQUALS") && level == val) isMatch = true;
                } else if (triggerType.equals("CHARGING")) {
                    boolean wantsConnected = trigger.getString("value").equals("CONNECTED");
                    if (payload.getBoolean("isCharging") == wantsConnected) isMatch = true;
                } else if (triggerType.equals("NOTIFICATION")) {
                    String kw = trigger.optString("value", "").toLowerCase();
                    String title = payload.optString("title", "").toLowerCase();
                    String body = payload.optString("body", "").toLowerCase();
                    if (!kw.isEmpty() && (title.contains(kw) || body.contains(kw))) isMatch = true;
                } else if (triggerType.equals("WIFI") || triggerType.equals("BLUETOOTH")) {
                    boolean wantsConnected = trigger.getString("value").equals("CONNECTED");
                    if (payload.optBoolean("isConnected", false) == wantsConnected) isMatch = true;
                } else if (triggerType.equals("OTP")) {
                    String body = payload.optString("body", "").toLowerCase();
                    if (body.contains("otp") || body.contains("code") || body.contains("verification") || body.contains("pin")) {
                        isMatch = true;
                    }
                } else if (triggerType.equals("SYSTEM")) {
                    String reqEvent = trigger.optString("value", "");
                    String actEvent = payload.optString("event", "");
                    if (reqEvent.equals(actEvent)) isMatch = true;
                }
                
                if (isMatch) {
                    Log.d(TAG, "[AURAPING_CRITICAL_TRACE] rule matched: " + ruleId);
                    boolean isStateBased = triggerType.equals("BATTERY") || triggerType.equals("CHARGING") || 
                                           triggerType.equals("WIFI") || triggerType.equals("BLUETOOTH");
                    boolean wasMatch = previousMatchState.containsKey(ruleId) ? previousMatchState.get(ruleId) : false;

                    boolean shouldRepeat = false;
                    JSONArray actions = rule.getJSONArray("actions");
                    for (int j = 0; j < actions.length(); j++) {
                        JSONObject action = actions.getJSONObject(j);
                        if (action.getString("type").equals("VISUAL")) {
                            JSONObject config = action.optJSONObject("config");
                            if (config != null && config.optBoolean("repeat", false)) {
                                shouldRepeat = true;
                            }
                        }
                    }

                    if (isStateBased && wasMatch && !shouldRepeat) {
                        continue; // Already triggered for this state, and repeat is disabled
                    }

                    long now = System.currentTimeMillis();
                    long last = lastFired.containsKey(ruleId) ? lastFired.get(ruleId) : 0;
                    long cd = priority.equals("CRITICAL") ? 1000 : priority.equals("HIGH") ? 3000 : priority.equals("MEDIUM") ? 5000 : 10000;
                    
                    if (isStateBased && !wasMatch) {
                        cd = 0; // First time matching the edge should be INSTANT
                    }

                    if (isStateBased) {
                        previousMatchState.put(ruleId, true);
                    }

                    if (now - last >= cd) {
                        Log.d(TAG, "[AURAPING_CRITICAL_TRACE] cooldown skipped/passed. action fired for rule: " + ruleId);
                        Log.d(TAG, "[AURAPING_LATENCY] action fired for rule: " + ruleId + " at " + now);
                        lastFired.put(ruleId, now);
                        
                        for (int j = 0; j < actions.length(); j++) {
                            JSONObject action = actions.getJSONObject(j);
                            if (action.getString("type").equals("SOUND")) {
                                Log.d(TAG, "[AURAPING_CRITICAL_TRACE] sound started for rule: " + ruleId);
                                playSoundNative(action.getJSONObject("config").getString("soundId"));
                            }
                        }
                        
                        bufferEvent(ruleId);
                    } else {
                        Log.d(TAG, "[AURAPING_CRITICAL_TRACE] event ignored (cooldown blocking): " + ruleId);
                    }
                } else {
                    Log.d(TAG, "[AURAPING_CRITICAL_TRACE] no match for rule: " + ruleId);
                    boolean isStateBased = triggerType.equals("BATTERY") || triggerType.equals("CHARGING") || 
                                           triggerType.equals("WIFI") || triggerType.equals("BLUETOOTH");
                    if (isStateBased) {
                        previousMatchState.put(ruleId, false);
                    }
                }
            }
        } catch(Exception e) {
            Log.e(TAG, "Error evaluating rules natively", e);
        }
    }

    private void playSoundNative(String soundId) {
        MediaPlayer player = null;
        try {
            AssetFileDescriptor afd = getAssets().openFd("public/sounds/" + soundId + ".mp3");
            player = new MediaPlayer();
            player.setWakeMode(getApplicationContext(), android.os.PowerManager.PARTIAL_WAKE_LOCK);
            player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            player.setOnCompletionListener(MediaPlayer::release);
            
            player.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: " + what + " extra: " + extra);
                mp.release();
                return true;
            });
            
            player.prepare();
            player.start();
        } catch (Exception e) {
            Log.e(TAG, "Failed to play native sound: " + soundId, e);
            if (player != null) {
                player.release();
            }
        }
    }

    private void bufferEvent(String ruleId) {
        try {
            SharedPreferences prefs = getSharedPreferences("AuraPingBuffer", Context.MODE_PRIVATE);
            String events = prefs.getString("events", "[]");
            JSONArray array = new JSONArray(events);
            
            JSONObject obj = new JSONObject();
            obj.put("ruleId", ruleId);
            obj.put("timestamp", System.currentTimeMillis());
            
            array.put(obj);
            prefs.edit().putString("events", array.toString()).apply();
        } catch(Exception e) {}
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "AuraPing Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps AuraPing active to monitor incoming critical alerts");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (eventReceiver != null) {
            unregisterReceiver(eventReceiver);
        }
        isRunning = false;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

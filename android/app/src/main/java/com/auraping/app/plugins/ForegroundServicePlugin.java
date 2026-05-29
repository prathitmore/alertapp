package com.auraping.app.plugins;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.auraping.app.services.AuraPingForegroundService;

@CapacitorPlugin(name = "ForegroundService")
public class ForegroundServicePlugin extends Plugin {

    @PluginMethod
    public void startForegroundMonitoring(PluginCall call) {
        try {
            String rules = call.getString("rules", "[]");
            Context context = getContext();
            
            android.content.SharedPreferences prefs = context.getSharedPreferences("AuraPingNative", Context.MODE_PRIVATE);
            prefs.edit().putString("activeRules", rules).apply();

            Intent intent = new Intent(context, AuraPingForegroundService.class);
            intent.putExtra("rules", rules);
            ContextCompat.startForegroundService(context, intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start foreground service", e);
        }
    }

    @PluginMethod
    public void stopForegroundMonitoring(PluginCall call) {
        try {
            Context context = getContext();
            
            android.content.SharedPreferences prefs = context.getSharedPreferences("AuraPingNative", Context.MODE_PRIVATE);
            prefs.edit().remove("activeRules").apply();

            Intent intent = new Intent(context, AuraPingForegroundService.class);
            intent.setAction("STOP_SERVICE");
            ContextCompat.startForegroundService(context, intent); // Need to use startForegroundService with STOP_SERVICE action so it stops smoothly
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop foreground service", e);
        }
    }

    @PluginMethod
    public void flushBufferedEvents(PluginCall call) {
        try {
            Context context = getContext();
            android.content.SharedPreferences prefs = context.getSharedPreferences("AuraPingBuffer", Context.MODE_PRIVATE);
            String events = prefs.getString("events", "[]");
            prefs.edit().remove("events").apply();
            
            JSObject ret = new JSObject();
            ret.put("events", new org.json.JSONArray(events));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to flush events", e);
        }
    }

    @PluginMethod
    public void vibratePattern(PluginCall call) {
        try {
            com.getcapacitor.JSArray patternArray = call.getArray("pattern");
            if (patternArray == null || patternArray.length() == 0) {
                call.reject("No pattern provided");
                return;
            }
            
            long[] timings = new long[patternArray.length()];
            for (int i = 0; i < patternArray.length(); i++) {
                timings[i] = patternArray.getLong(i);
            }

            Context context = getContext();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                android.os.VibratorManager vibratorManager = (android.os.VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (vibratorManager != null) {
                    android.os.Vibrator vibrator = vibratorManager.getDefaultVibrator();
                    vibrator.vibrate(android.os.VibrationEffect.createWaveform(timings, -1));
                }
            } else {
                android.os.Vibrator vibrator = (android.os.Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(android.os.VibrationEffect.createWaveform(timings, -1));
                    } else {
                        vibrator.vibrate(timings, -1);
                    }
                }
            }
            call.resolve();
        } catch (Exception e) {
            android.util.Log.e("AuraPingNative", "[AURAPING_HAPTIC] Native vibration failed", e);
            call.reject("Failed to execute native vibration pattern", e);
        }
    }
}

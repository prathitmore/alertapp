package com.auraping.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "AuraPingBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        Log.d(TAG, "Device Boot Completed. Restarting AuraPing background monitoring service.");

        android.content.SharedPreferences prefs = context.getSharedPreferences("AuraPingNative", Context.MODE_PRIVATE);
        String rules = prefs.getString("activeRules", "[]");

        if (!rules.equals("[]")) {
            Intent serviceIntent = new Intent(context, com.auraping.app.services.AuraPingForegroundService.class);
            serviceIntent.putExtra("rules", rules);
            androidx.core.content.ContextCompat.startForegroundService(context, serviceIntent);
        }
    }
}

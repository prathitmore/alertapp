package com.auraping.app.services;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class AuraPingNotificationListener extends NotificationListenerService {
    private static final String TAG = "AuraPingNotification";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AuraPing Notification Listener Service Created");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        
        String pack = sbn.getPackageName();
        Log.d(TAG, "Notification received from: " + pack);

        try {
            android.app.Notification notification = sbn.getNotification();
            if (notification == null) return;

            android.os.Bundle extras = notification.extras;
            if (extras == null) return;

            String title = extras.getString(android.app.Notification.EXTRA_TITLE, "");
            CharSequence textCharSeq = extras.getCharSequence(android.app.Notification.EXTRA_TEXT);
            String text = textCharSeq != null ? textCharSeq.toString() : "";

            if (title.isEmpty() && text.isEmpty()) return;

            android.content.Intent intent = new android.content.Intent("com.auraping.app.NOTIFICATION_RECEIVED");
            intent.putExtra("appName", pack);
            intent.putExtra("title", title);
            intent.putExtra("body", text);
            sendBroadcast(intent);

        } catch (Exception e) {
            Log.e(TAG, "Error extracting notification extras", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Handle removal if needed
    }
}

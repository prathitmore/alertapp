package com.auraping.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;
import com.auraping.app.plugins.ForegroundServicePlugin;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private NotificationReceiver receiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ForegroundServicePlugin.class);
        super.onCreate(savedInstanceState);
        
        receiver = new NotificationReceiver();
        IntentFilter filter = new IntentFilter("com.auraping.app.NOTIFICATION_RECEIVED");
        
        if (android.os.Build.VERSION.SDK_INT >= 33) { // TIRAMISU
            registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(receiver, filter);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (receiver != null) {
            unregisterReceiver(receiver);
        }
    }

    private class NotificationReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                String appName = intent.getStringExtra("appName");
                String title = intent.getStringExtra("title");
                String body = intent.getStringExtra("body");

                JSONObject detail = new JSONObject();
                detail.put("appName", appName != null ? appName : "");
                detail.put("title", title != null ? title : "");
                detail.put("body", body != null ? body : "");

                String js = "window.dispatchEvent(new CustomEvent('notificationReceived', { detail: " + detail.toString() + " }));";
                
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() -> {
                        bridge.getWebView().evaluateJavascript(js, null);
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Error processing notification broadcast", e);
            }
        }
    }
}

package com.tedbeera.egypt

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.WindowManager
import org.json.JSONObject
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(MicrophonePermissionPlugin::class.java)
        registerPlugin(NotificationPermissionPlugin::class.java)
        registerPlugin(MealReminderSchedulerPlugin::class.java)
        super.onCreate(savedInstanceState)
        configureImmersiveWindow()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)

        // Forward notification taps to the running WebView as well as cold-start intents.
        val target = intent.getStringExtra("tadbeera_target_tab")
        if (target == "food") {
            val payload = JSONObject()
                .put("target", target)
                .put("meal", intent.getStringExtra("tadbeera_meal_type"))
                .toString()
            bridge?.triggerWindowJSEvent("tadbeeraMealReminderLaunch", payload)
        }
    }

    override fun onResume() {
        super.onResume()
        configureImmersiveWindow()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) configureImmersiveWindow()
    }

    private fun configureImmersiveWindow() {
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        window.attributes = window.attributes.apply {
            layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }
}

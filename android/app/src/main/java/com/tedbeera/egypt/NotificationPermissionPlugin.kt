package com.tedbeera.egypt

import android.Manifest
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Explicit Android 13+ notification permission bridge.
 * Kept separate from LocalNotifications so permission prompting does not
 * depend on that plugin's permission alias/status implementation.
 */
@CapacitorPlugin(
    name = "NotificationPermission",
    permissions = [
        Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])
    ]
)
class NotificationPermissionPlugin : Plugin() {

    @PluginMethod
    fun request(call: PluginCall) {
        if (android.os.Build.VERSION.SDK_INT < 33 ||
            getPermissionState("notifications") == PermissionState.GRANTED
        ) {
            resolveResult(call)
            return
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionResult")
    }

    @PermissionCallback
    private fun notificationPermissionResult(call: PluginCall) {
        resolveResult(call)
    }

    private fun resolveResult(call: PluginCall) {
        val granted = android.os.Build.VERSION.SDK_INT < 33 ||
            getPermissionState("notifications") == PermissionState.GRANTED
        call.resolve(JSObject().put("granted", granted))
    }
}

package com.tedbeera.egypt

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
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
    fun openSettings(call: PluginCall) {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(
                Settings.EXTRA_APP_PACKAGE,
                context.packageName
            )
        } else {
            Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:${context.packageName}")
            )
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        call.resolve()
    }

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

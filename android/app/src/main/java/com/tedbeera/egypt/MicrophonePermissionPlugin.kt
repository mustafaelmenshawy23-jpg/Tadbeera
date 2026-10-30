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

@CapacitorPlugin(
    name = "MicrophonePermission",
    permissions = [
        Permission(alias = "microphone", strings = [Manifest.permission.RECORD_AUDIO])
    ]
)
class MicrophonePermissionPlugin : Plugin() {
    @PluginMethod
    fun request(call: PluginCall) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            resolvePermission(call, true)
            return
        }
        requestPermissionForAlias("microphone", call, "microphonePermissionResult")
    }

    @PermissionCallback
    private fun microphonePermissionResult(call: PluginCall) {
        resolvePermission(call, getPermissionState("microphone") == PermissionState.GRANTED)
    }

    private fun resolvePermission(call: PluginCall, granted: Boolean) {
        val result = JSObject()
        result.put("granted", granted)
        call.resolve(result)
    }
}

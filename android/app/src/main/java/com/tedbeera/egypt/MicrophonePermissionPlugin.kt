package com.tedbeera.egypt

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
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

    @PluginMethod
    fun recognize(call: PluginCall) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Microphone permission has not been granted", "PERMISSION_DENIED")
            return
        }

        if (!android.speech.SpeechRecognizer.isRecognitionAvailable(context)) {
            call.reject("لا توجد خدمة تعرف على الكلام مثبتة أو مفعلة على الجهاز", "RECOGNIZER_UNAVAILABLE")
            return
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-EG")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-EG")
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "اتكلمي بالمكونات اللي عندك في البيت")
        }
        startActivityForResult(call, intent, "speechRecognitionResult")
    }

    @ActivityCallback
    private fun speechRecognitionResult(call: PluginCall, result: ActivityResult) {
        if (result.resultCode != Activity.RESULT_OK) {
            call.reject("لم يتم إكمال التسجيل الصوتي", "SPEECH_CANCELLED")
            return
        }
        val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
        val transcript = matches?.firstOrNull()?.trim().orEmpty()
        if (transcript.isBlank()) {
            call.reject("لم يتم التعرف على كلام واضح", "NO_SPEECH")
            return
        }
        val response = JSObject()
        response.put("transcript", transcript)
        call.resolve(response)
    }

    private fun resolvePermission(call: PluginCall, granted: Boolean) {
        val result = JSObject()
        result.put("granted", granted)
        call.resolve(result)
    }
}

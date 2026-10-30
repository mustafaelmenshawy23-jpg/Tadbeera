package com.tedbeera.egypt

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
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
    private var speechRecognizer: SpeechRecognizer? = null

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
    fun startListening(call: PluginCall) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Microphone permission has not been granted")
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            call.reject("Speech recognition service is unavailable on this device")
            return
        }

        stopRecognizer()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).also { recognizer ->
            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    notifyListeners("speechStatus", JSObject().put("status", "listening"))
                }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {
                    notifyListeners("speechStatus", JSObject().put("status", "processing"))
                }
                override fun onError(error: Int) {
                    val message = when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "not-allowed"
                        SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network"
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "busy"
                        else -> "recognition-error-$error"
                    }
                    notifyListeners("speechError", JSObject().put("error", message))
                    stopRecognizer()
                }
                override fun onResults(results: Bundle?) {
                    val transcript = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull().orEmpty()
                    notifyListeners("speechResult", JSObject().put("transcript", transcript))
                    stopRecognizer()
                }
                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-EG")
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-EG")
                putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            }
            recognizer.startListening(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun stopListening(call: PluginCall) {
        stopRecognizer()
        call.resolve()
    }

    private fun stopRecognizer() {
        speechRecognizer?.let {
            try { it.cancel() } catch (_: Exception) {}
            try { it.destroy() } catch (_: Exception) {}
        }
        speechRecognizer = null
    }

    private fun resolvePermission(call: PluginCall, granted: Boolean) {
        call.resolve(JSObject().put("granted", granted))
    }

    override fun handleOnDestroy() {
        stopRecognizer()
        super.handleOnDestroy()
    }
}

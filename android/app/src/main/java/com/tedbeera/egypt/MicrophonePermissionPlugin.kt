package com.tedbeera.egypt

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale
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
    private val mainHandler = Handler(Looper.getMainLooper())
    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var pendingSpeechCall: PluginCall? = null

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
        // Android SpeechRecognizer must be created and used on the main application thread.
        mainHandler.post {
            try {
                if (getPermissionState("microphone") != PermissionState.GRANTED) {
                    call.reject("Microphone permission has not been granted")
                    return@post
                }
                if (!SpeechRecognizer.isRecognitionAvailable(context)) {
                    call.reject("Speech recognition service is unavailable on this device")
                    return@post
                }

                stopRecognizer()
                val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
                speechRecognizer = recognizer
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
                call.resolve()
            } catch (error: Exception) {
                stopRecognizer()
                call.reject("Unable to start speech recognition: ${error.message}")
            }
        }
    }

    @PluginMethod
    fun speak(call: PluginCall) {
        val text = call.getString("text")?.trim().orEmpty()
        if (text.isBlank()) {
            call.reject("Speech text is empty")
            return
        }
        mainHandler.post {
            try {
                pendingSpeechCall?.reject("Speech request replaced")
                pendingSpeechCall = call
                val engine = textToSpeech
                if (engine != null) {
                    speakWithEngine(engine, text, call)
                } else {
                    textToSpeech = TextToSpeech(context) { status ->
                        mainHandler.post {
                            val currentCall = pendingSpeechCall
                            if (currentCall !== call) return@post
                            if (status != TextToSpeech.SUCCESS) {
                                pendingSpeechCall = null
                                call.reject("Arabic text-to-speech engine is unavailable")
                                return@post
                            }
                            val readyEngine = textToSpeech
                            if (readyEngine == null) {
                                pendingSpeechCall = null
                                call.reject("Text-to-speech engine failed to initialize")
                                return@post
                            }
                            speakWithEngine(readyEngine, text, call)
                        }
                    }
                }
            } catch (error: Exception) {
                pendingSpeechCall = null
                call.reject("Unable to speak recipe: ${error.message}")
            }
        }
    }

    private fun speakWithEngine(engine: TextToSpeech, text: String, call: PluginCall) {
        val arabic = Locale("ar", "EG")
        val languageResult = engine.setLanguage(arabic)
        if (languageResult == TextToSpeech.LANG_MISSING_DATA || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            val fallbackResult = engine.setLanguage(Locale("ar"))
            if (fallbackResult == TextToSpeech.LANG_MISSING_DATA || fallbackResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                pendingSpeechCall = null
                call.reject("Arabic voice data is not installed on this device")
                return
            }
        }
        engine.setSpeechRate(0.82f)
        engine.setPitch(0.96f)
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                notifyListeners("speechPlaybackStatus", JSObject().put("status", "speaking"))
            }
            override fun onDone(utteranceId: String?) {
                notifyListeners("speechPlaybackStatus", JSObject().put("status", "completed"))
            }
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                notifyListeners("speechPlaybackStatus", JSObject().put("status", "error"))
            }
            override fun onError(utteranceId: String?, errorCode: Int) {
                notifyListeners("speechPlaybackStatus", JSObject().put("status", "error"))
            }
        })
        val result = engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tadbeera-recipe-${System.currentTimeMillis()}")
        if (result == TextToSpeech.ERROR) {
            pendingSpeechCall = null
            call.reject("Unable to start Arabic speech playback")
        } else {
            pendingSpeechCall = null
            call.resolve()
        }
    }

    @PluginMethod
    fun stopSpeaking(call: PluginCall) {
        mainHandler.post {
            try { textToSpeech?.stop() } catch (_: Exception) {}
            notifyListeners("speechPlaybackStatus", JSObject().put("status", "stopped"))
            call.resolve()
        }
    }

    @PluginMethod
    fun stopListening(call: PluginCall) {
        mainHandler.post {
            stopRecognizer()
            call.resolve()
        }
    }

    private fun stopRecognizer() {
        val current = speechRecognizer ?: return
        speechRecognizer = null
        try { current.cancel() } catch (_: Exception) {}
        try { current.destroy() } catch (_: Exception) {}
    }

    private fun resolvePermission(call: PluginCall, granted: Boolean) {
        call.resolve(JSObject().put("granted", granted))
    }

    override fun handleOnDestroy() {
        mainHandler.post {
            stopRecognizer()
            try { textToSpeech?.stop() } catch (_: Exception) {}
            try { textToSpeech?.shutdown() } catch (_: Exception) {}
            textToSpeech = null
        }
        super.handleOnDestroy()
    }
}

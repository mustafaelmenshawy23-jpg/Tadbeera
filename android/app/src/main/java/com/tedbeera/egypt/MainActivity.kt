package com.tedbeera.egypt

import com.getcapacitor.BridgeActivity
import com.getcapacitor.Plugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        registerPlugin(MicrophonePermissionPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}

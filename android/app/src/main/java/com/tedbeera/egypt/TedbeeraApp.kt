package com.tedbeera.egypt

import android.app.Application
import com.tedbeera.egypt.data.local.AppDatabase
import com.tedbeera.egypt.data.repository.TedbeeraRepository

class TedbeeraApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var repository: TedbeeraRepository
        private set

    override fun onCreate() {
        super.onCreate()
        database = AppDatabase.getDatabase(this)
        repository = TedbeeraRepository(database)

        // AdMob Phase 2: Safe initialization on background thread
        try {
            com.google.android.gms.ads.MobileAds.initialize(this) {}
        } catch (_: Exception) {
            // Keep completely resilient if offline or play services missing
        }
    }
}

package com.tedbeera.egypt.util

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

/**
 * Tedbeera Egypt - Production-grade AdMob Advertising Manager
 *
 * Strict Google AdMob Policy Compliance:
 * - Test ad unit IDs used during development & preview
 * - Interstitials strictly DISABLED by default
 * - Frequency cap: Max 2 interstitial impressions per app session
 * - Minimum cooldown: 120 seconds between impressions
 * - Never interrupts active user workflows (budgeting, cooking steps, shopping list editing)
 */
object TedbeeraAdManager {

    private const val TAG = "TedbeeraAdManager"

    // Official Google AdMob Sample Test Ad Unit IDs
    const val TEST_BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"

    // Policy Safety Guards
    const val MAX_INTERSTITIALS_PER_SESSION = 2
    const val INTERSTITIAL_COOLDOWN_MS = 120_000L // 120 seconds

    // State
    var isInterstitialEnabled: Boolean = false // Strictly disabled by default
    var sessionInterstitialCount: Int = 0
        private set
    var lastInterstitialTimestamp: Long = 0L
        private set

    private var interstitialAd: InterstitialAd? = null
    private var isLoadingInterstitial: Boolean = false

    /**
     * Preload interstitial ad safely in background
     */
    fun preloadInterstitial(context: Context) {
        if (!isInterstitialEnabled) {
            Log.d(TAG, "Interstitial preload skipped: disabled by policy")
            return
        }

        if (sessionInterstitialCount >= MAX_INTERSTITIALS_PER_SESSION) {
            Log.d(TAG, "Interstitial preload skipped: session limit reached ($MAX_INTERSTITIALS_PER_SESSION)")
            return
        }

        if (interstitialAd != null || isLoadingInterstitial) {
            return
        }

        isLoadingInterstitial = true
        val adRequest = AdRequest.Builder().build()

        InterstitialAd.load(
            context,
            TEST_INTERSTITIAL_AD_UNIT_ID,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    isLoadingInterstitial = false
                    Log.d(TAG, "Interstitial Ad loaded successfully")
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                    isLoadingInterstitial = false
                    Log.w(TAG, "Interstitial Ad failed to load: ${error.message} (code ${error.code})")
                }
            }
        )
    }

    /**
     * Show interstitial only if all policy & cooldown guards pass
     */
    fun showInterstitialIfAllowed(
        activity: Activity,
        onAdDismissedOrSkipped: () -> Unit
    ) {
        // 1. Guard: feature flag must be enabled
        if (!isInterstitialEnabled) {
            Log.d(TAG, "Interstitial skipped: feature disabled")
            onAdDismissedOrSkipped()
            return
        }

        // 2. Guard: Frequency cap per session
        if (sessionInterstitialCount >= MAX_INTERSTITIALS_PER_SESSION) {
            Log.d(TAG, "Interstitial skipped: session cap reached ($MAX_INTERSTITIALS_PER_SESSION)")
            onAdDismissedOrSkipped()
            return
        }

        // 3. Guard: Minimum 120s cooldown between impressions
        val now = System.currentTimeMillis()
        if (now - lastInterstitialTimestamp < INTERSTITIAL_COOLDOWN_MS) {
            val remainingSec = (INTERSTITIAL_COOLDOWN_MS - (now - lastInterstitialTimestamp)) / 1000
            Log.d(TAG, "Interstitial skipped: cooldown active ($remainingSec seconds remaining)")
            onAdDismissedOrSkipped()
            return
        }

        val ad = interstitialAd
        if (ad == null) {
            Log.d(TAG, "Interstitial not ready; triggering preload for next opportunity")
            preloadInterstitial(activity)
            onAdDismissedOrSkipped()
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                sessionInterstitialCount++
                lastInterstitialTimestamp = System.currentTimeMillis()
                Log.d(TAG, "Interstitial dismissed. Session count: $sessionInterstitialCount")
                onAdDismissedOrSkipped()
                // Preload next if within cap
                preloadInterstitial(activity)
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                Log.w(TAG, "Failed to show interstitial: ${error.message}")
                onAdDismissedOrSkipped()
            }

            override fun onAdShowedFullScreenContent() {
                Log.d(TAG, "Interstitial displayed on screen")
            }
        }

        ad.show(activity)
    }
}

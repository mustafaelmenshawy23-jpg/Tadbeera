package com.tedbeera.egypt.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.LoadAdError
import com.tedbeera.egypt.ui.theme.BorderLight
import com.tedbeera.egypt.ui.theme.PrimaryBlue
import com.tedbeera.egypt.ui.theme.SurfaceVariant
import com.tedbeera.egypt.util.TedbeeraAdManager

/**
 * Production-ready AdMob Banner Component
 *
 * AdMob Policy & Stabilization Features:
 * 1. Dedicated fixed container height (50.dp) to eliminate layout shift during load
 * 2. AdListener handling: onAdLoaded, onAdFailedToLoad
 * 3. Graceful collapse to 0 height on failure/offline (no empty gray dead space)
 * 4. Distinct "إعلان" policy badge to prevent accidental clicks
 * 5. Visual divider and clearance from bottom navigation
 */
@Composable
fun AdMobBanner(
    modifier: Modifier = Modifier,
    adUnitId: String = TedbeeraAdManager.TEST_BANNER_AD_UNIT_ID
) {
    var isAdVisible by remember { mutableStateOf(true) }
    var isAdLoaded by remember { mutableStateOf(false) }

    AnimatedVisibility(
        visible = isAdVisible,
        enter = expandVertically(animationSpec = tween(250)),
        exit = shrinkVertically(animationSpec = tween(250))
    ) {
        Column(
            modifier = modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Policy separation bar with clear "إعلان" badge
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "إعلان",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF64748B),
                        modifier = Modifier
                            .background(Color(0xFFE2E8F0), RoundedCornerShape(3.dp))
                            .padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "تدبيرة مصر • AdMob Test",
                        fontSize = 9.sp,
                        color = Color(0xFF94A3B8)
                    )
                }

                if (!isAdLoaded) {
                    Text(
                        text = "جارِ التحميل...",
                        fontSize = 9.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            }

            // Fixed height 50.dp container adhering to standard 320x50 AdMob banner
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                color = SurfaceVariant,
                shape = RoundedCornerShape(6.dp)
            ) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { context ->
                        AdView(context).apply {
                            setAdSize(AdSize.BANNER)
                            this.adUnitId = adUnitId
                            adListener = object : AdListener() {
                                override fun onAdLoaded() {
                                    super.onAdLoaded()
                                    isAdLoaded = true
                                    isAdVisible = true
                                }

                                override fun onAdFailedToLoad(error: LoadAdError) {
                                    super.onAdFailedToLoad(error)
                                    isAdLoaded = false
                                    // Gracefully collapse container on failure to leave no blank dead space
                                    isAdVisible = false
                                }
                            }

                            try {
                                loadAd(AdRequest.Builder().build())
                            } catch (_: Exception) {
                                isAdVisible = false
                            }
                        }
                    }
                )
            }
        }
    }
}

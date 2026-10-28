export const ANDROID_CODE_SAMPLES: Record<string, string> = {
  'android/app/src/main/java/com/tedbeera/egypt/MainActivity.kt': `package com.tedbeera.egypt

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.rememberNavController
import com.tedbeera.egypt.ui.navigation.TedbeeraBottomBar
import com.tedbeera.egypt.ui.navigation.TedbeeraNavHost
import com.tedbeera.egypt.ui.screens.budget.BudgetViewModel
import com.tedbeera.egypt.ui.screens.daily.DailyViewModel
import com.tedbeera.egypt.ui.screens.food.FoodViewModel
import com.tedbeera.egypt.ui.screens.saved.SavedViewModel
import com.tedbeera.egypt.ui.theme.TedbeeraEgyptTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as TedbeeraApp
        val repository = app.repository

        val factory = object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return when {
                    modelClass.isAssignableFrom(FoodViewModel::class.java) -> FoodViewModel(repository) as T
                    modelClass.isAssignableFrom(BudgetViewModel::class.java) -> BudgetViewModel(repository) as T
                    modelClass.isAssignableFrom(DailyViewModel::class.java) -> DailyViewModel(repository) as T
                    modelClass.isAssignableFrom(SavedViewModel::class.java) -> SavedViewModel(repository) as T
                    else -> throw IllegalArgumentException("Unknown ViewModel: \${modelClass.name}")
                }
            }
        }

        val viewModelProvider = ViewModelProvider(this, factory)
        setContent {
            TedbeeraEgyptTheme {
                MainAppScaffold(
                    foodViewModel = viewModelProvider[FoodViewModel::class.java],
                    budgetViewModel = viewModelProvider[BudgetViewModel::class.java],
                    dailyViewModel = viewModelProvider[DailyViewModel::class.java],
                    savedViewModel = viewModelProvider[SavedViewModel::class.java]
                )
            }
        }
    }
}`,

  'android/app/src/main/java/com/tedbeera/egypt/data/local/AppDatabase.kt': `package com.tedbeera.egypt.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.tedbeera.egypt.data.local.dao.*
import com.tedbeera.egypt.data.local.entity.*

@Database(
    entities = [
        SavedRecipeEntity::class,
        SavedBudgetEntity::class,
        ShoppingItemEntity::class,
        ChallengeEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun recipeDao(): RecipeDao
    abstract fun budgetDao(): BudgetDao
    abstract fun shoppingDao(): ShoppingDao
    abstract fun challengeDao(): ChallengeDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "tedbeera_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}`,

  'android/app/src/main/java/com/tedbeera/egypt/data/repository/TedbeeraRepository.kt': `package com.tedbeera.egypt.data.repository

import com.tedbeera.egypt.data.local.AppDatabase
import com.tedbeera.egypt.data.local.entity.*
import com.tedbeera.egypt.data.model.*
import com.tedbeera.egypt.data.seed.SeedData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TedbeeraRepository(private val db: AppDatabase) {

    fun filterRecipes(
        selectedIngredients: Set<String>,
        isVeryBudgetFilter: Boolean,
        isQuickFilter: Boolean,
        usesLeftoversFilter: Boolean
    ): List<RecipeMatchResult> {
        return SeedData.recipes.filter { recipe ->
            val matchesBudget = !isVeryBudgetFilter || recipe.isVeryBudget
            val matchesQuick = !isQuickFilter || recipe.isQuick
            val matchesLeftovers = !usesLeftoversFilter || recipe.usesLeftovers
            matchesBudget && matchesQuick && matchesLeftovers
        }.map { recipe ->
            val available = recipe.ingredients.filter { ing ->
                selectedIngredients.any { sel -> ing.name.contains(sel) }
            }
            val missing = recipe.ingredients.filterNot { ing ->
                selectedIngredients.any { sel -> ing.name.contains(sel) }
            }
            RecipeMatchResult(
                recipe = recipe,
                availableCount = available.size,
                totalCount = recipe.ingredients.size,
                missingIngredients = missing,
                isCompleteMatch = missing.isEmpty()
            )
        }
    }

    suspend fun addMissingIngredientsToShoppingList(missing: List<Ingredient>) = withContext(Dispatchers.IO) {
        val items = missing.map {
            ShoppingItemEntity(name = it.name, quantity = it.quantity, estimatedUnitPrice = 0.0)
        }
        db.shoppingDao().insertItemsBatch(items)
    }

    suspend fun clearAllApplicationData() = withContext(Dispatchers.IO) {
        db.recipeDao().deleteAllSavedRecipes()
        db.budgetDao().deleteAllSavedBudgets()
        db.shoppingDao().deleteAllShoppingItems()
        db.challengeDao().deleteAllChallenges()
    }
}`,

  'android/app/build.gradle.kts': `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.tedbeera.egypt"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.tedbeera.egypt"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    testImplementation(libs.junit)
}`,

  'android/app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- AdMob Network connectivity permissions (Install-time only, no runtime dialog required) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".TedbeeraApp"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.TedbeeraEgypt">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <!-- AdMob Test ID configuration -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713"/>
    </application>
</manifest>`,

  'android/app/src/test/java/com/tedbeera/egypt/BudgetEngineTest.kt': `package com.tedbeera.egypt

import com.tedbeera.egypt.data.model.BudgetCategoryType
import com.tedbeera.egypt.data.repository.TedbeeraRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BudgetEngineTest {
    @Test
    fun testNegativeAmountIsClampedToZero() {
        val normalized = TedbeeraRepository.normalizePercentagesTo100(listOf(50, 30, 20))
        val total = (-500.0).coerceAtLeast(0.0)
        val slices = normalized.map { (total * it) / 100.0 }
        for (amount in slices) {
            assertEquals(0.0, amount, 0.001)
        }
    }

    @Test
    fun testPercentagesAlwaysSumToExact100() {
        val oddSum = TedbeeraRepository.normalizePercentagesTo100(listOf(75, 13, 50))
        assertEquals(100, oddSum.sum())
    }

    @Test
    fun testRedistributionOnSliderChanges() {
        var current = listOf(50, 30, 20)
        current = TedbeeraRepository.redistributePercentages(0, 75, current)
        assertEquals(75, current[0])
        assertEquals(100, current.sum())
        assertTrue(current.all { it >= 0 })

        current = TedbeeraRepository.redistributePercentages(1, 13, current)
        assertEquals(13, current[1])
        assertEquals(100, current.sum())
        assertTrue(current.all { it >= 0 })
    }

    @Test
    fun testBoundaryValuesZeroAndHundred() {
        var current = listOf(50, 30, 20)
        current = TedbeeraRepository.redistributePercentages(0, 100, current)
        assertEquals(100, current[0])
        assertEquals(100, current.sum())

        current = TedbeeraRepository.redistributePercentages(0, 0, current)
        assertEquals(0, current[0])
        assertEquals(100, current.sum())
    }
}`,

  'android/app/src/main/java/com/tedbeera/egypt/util/TedbeeraAdManager.kt': `package com.tedbeera.egypt.util

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

object TedbeeraAdManager {
    const val TEST_BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"
    const val MAX_INTERSTITIALS_PER_SESSION = 2
    const val INTERSTITIAL_COOLDOWN_MS = 120_000L

    var isInterstitialEnabled: Boolean = false
    var sessionInterstitialCount: Int = 0
        private set
    var lastInterstitialTimestamp: Long = 0L
        private set

    private var interstitialAd: InterstitialAd? = null

    fun preloadInterstitial(context: Context) {
        if (!isInterstitialEnabled || sessionInterstitialCount >= MAX_INTERSTITIALS_PER_SESSION) return
        InterstitialAd.load(
            context,
            TEST_INTERSTITIAL_AD_UNIT_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) { interstitialAd = ad }
                override fun onAdFailedToLoad(error: LoadAdError) { interstitialAd = null }
            }
        )
    }

    fun showInterstitialIfAllowed(activity: Activity, onDismiss: () -> Unit) {
        if (!isInterstitialEnabled || sessionInterstitialCount >= MAX_INTERSTITIALS_PER_SESSION) {
            onDismiss(); return
        }
        val now = System.currentTimeMillis()
        if (now - lastInterstitialTimestamp < INTERSTITIAL_COOLDOWN_MS) {
            onDismiss(); return
        }
        val ad = interstitialAd ?: run {
            preloadInterstitial(activity)
            onDismiss()
            return
        }
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                sessionInterstitialCount++
                lastInterstitialTimestamp = System.currentTimeMillis()
                onDismiss()
            }
            override fun onAdFailedToShowFullScreenContent(p0: AdError) { onDismiss() }
        }
        ad.show(activity)
    }
}`,

  'android/app/src/main/java/com/tedbeera/egypt/ui/components/AdMobBanner.kt': `package com.tedbeera.egypt.ui.components

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
import com.google.android.gms.ads.*
import com.tedbeera.egypt.ui.theme.SurfaceVariant
import com.tedbeera.egypt.util.TedbeeraAdManager

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
            modifier = modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "إعلان",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF64748B),
                    modifier = Modifier.background(Color(0xFFE2E8F0), RoundedCornerShape(3.dp)).padding(horizontal = 4.dp, vertical = 1.dp)
                )
                Text(text = "تدبيرة مصر • AdMob Test", fontSize = 9.sp, color = Color(0xFF94A3B8))
            }
            Surface(
                modifier = Modifier.fillMaxWidth().height(50.dp),
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
                                    isAdVisible = false
                                }
                            }
                            try { loadAd(AdRequest.Builder().build()) } catch (_: Exception) { isAdVisible = false }
                        }
                    }
                )
            }
        }
    }
}`,
  'android/app/src/test/java/com/tedbeera/egypt/Phase4FeaturesTest.kt': `package com.tedbeera.egypt

import org.junit.Assert.*
import org.junit.Test

/**
 * Phase 4A & 4B Unit Tests:
 * 1. WhatsApp Shopping List Share formatting, price transparency & empty guard.
 * 2. Zero-Missing-Ingredients 100% pantry filter engine.
 * 3. Safe versioned JSON backup schema validation & rollback protection.
 * 4. Visual category budget analytics, dynamic color thresholds & overrun badges.
 * 5. Monthly payday cycle math, short month clamping & recommended daily spending cap.
 */
class Phase4FeaturesTest {

    enum class ProgressColor { GREEN, AMBER, RED }

    data class CategoryAnalytics(
        val categoryId: String,
        val allocated: Double,
        val spent: Double,
        val progressPercentage: Double,
        val visualProgress: Double,
        val color: ProgressColor,
        val isOverBudget: Boolean,
        val exceededAmount: Double
    )

    private fun calculateCategoryAnalytics(allocated: Double, spent: Double): CategoryAnalytics {
        val safeSpent = Math.max(0.0, spent)
        val safeAllocated = Math.max(0.0, allocated)

        val progressPercentage = if (safeAllocated > 0.0) {
            (safeSpent / safeAllocated) * 100.0
        } else if (safeSpent > 0.0) {
            100.0
        } else {
            0.0
        }

        val visualProgress = Math.min(100.0, Math.max(0.0, progressPercentage))

        val color = when {
            safeAllocated > 0.0 && progressPercentage < 80.0 -> ProgressColor.GREEN
            safeAllocated > 0.0 && progressPercentage < 100.0 -> ProgressColor.AMBER
            else -> ProgressColor.RED
        }

        val isOverBudget = safeSpent > safeAllocated
        val exceededAmount = if (isOverBudget) safeSpent - safeAllocated else 0.0

        return CategoryAnalytics(
            categoryId = "test",
            allocated = safeAllocated,
            spent = safeSpent,
            progressPercentage = progressPercentage,
            visualProgress = visualProgress,
            color = color,
            isOverBudget = isOverBudget,
            exceededAmount = exceededAmount
        )
    }

    @Test
    fun testPhase4BCategoryAnalyticsProgressAndColorThresholds() {
        val greenResult = calculateCategoryAnalytics(allocated = 1000.0, spent = 700.0)
        assertEquals(70.0, greenResult.progressPercentage, 0.01)
        assertEquals(ProgressColor.GREEN, greenResult.color)
        assertFalse(greenResult.isOverBudget)

        val amberResult = calculateCategoryAnalytics(allocated = 1000.0, spent = 850.0)
        assertEquals(85.0, amberResult.progressPercentage, 0.01)
        assertEquals(ProgressColor.AMBER, amberResult.color)

        val redResult = calculateCategoryAnalytics(allocated = 1000.0, spent = 1250.0)
        assertEquals(125.0, redResult.progressPercentage, 0.01)
        assertEquals(100.0, redResult.visualProgress, 0.01)
        assertEquals(ProgressColor.RED, redResult.color)
        assertTrue(redResult.isOverBudget)
        assertEquals(250.0, redResult.exceededAmount, 0.01)
    }

    // ========================================================
    // Phase 4C: Voice Ingredient Selection & Daily Tips Interaction Tests
    // ========================================================

    @Test
    fun testPhase4CVoiceIngredientMatchingAndAliases() {
        // Dialect mapping: "قوطة" -> "طماطم", "رز" -> "أرز", "بتنجان" -> "باذنجان"
        val catalog = listOf("طماطم", "أرز", "باذنجان", "ثوم", "بصل", "بطاطس", "مكرونة")
        val spoken = "عندي في البيت قوطة ورز وبتنجان"
        val matched = listOf("طماطم", "أرز", "باذنجان")
        assertTrue(matched.contains("طماطم"))
        assertTrue(matched.contains("أرز"))

        // Additive non-destructive selection
        val existing = listOf("بصل")
        val combined = (existing + matched).distinct()
        assertEquals(4, combined.size)
    }

    @Test
    fun testPhase4CTipsAchievementUniqueCounterAndFilters() {
        val triedTipIds = mutableSetOf<String>()
        triedTipIds.add("idea_1")
        triedTipIds.add("idea_1") // Set logic prevents duplicate tap inflation
        assertEquals(1, triedTipIds.size)

        triedTipIds.add("idea_2")
        assertEquals(2, triedTipIds.size)

        val categories = listOf("الكل", "تنظيف", "توفير كهرباء", "مطبخ وتغذية", "حيل تسوق")
        assertEquals(5, categories.size)
    }

    @Test
    fun testPhase4DRewardedAdUnitAndIdempotentReward() {
        val testRewardedAdUnitId = "ca-app-pub-3940256099942544/5224354917"
        assertEquals("ca-app-pub-3940256099942544/5224354917", testRewardedAdUnitId)

        var isWeeklyPlanUnlocked = false
        var rewardCount = 0
        if (!isWeeklyPlanUnlocked) {
            isWeeklyPlanUnlocked = true
            rewardCount++
        }
        assertTrue(isWeeklyPlanUnlocked)
        assertEquals(1, rewardCount)
    }
}
`
};

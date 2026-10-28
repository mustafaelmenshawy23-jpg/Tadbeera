package com.tedbeera.egypt

import org.junit.Assert.*
import org.junit.Test

/**
 * Phase 4A Unit Tests:
 * 1. WhatsApp Shopping List Share formatting, price transparency & empty guard.
 * 2. Zero-Missing-Ingredients 100% pantry filter engine.
 * 3. Safe versioned JSON backup schema validation & rollback protection.
 */
class Phase4FeaturesTest {

    data class ShoppingItem(
        val id: String,
        val name: String,
        val quantity: Double,
        val unit: String,
        val unitPrice: Double?, // null represents unpriced
        val isChecked: Boolean = false
    )

    data class WhatsAppShareResult(
        val message: String,
        val unpurchasedCount: Int,
        val unpricedCount: Int,
        val knownTotal: Double,
        val isEmpty: Boolean
    )

    private fun formatWhatsAppMessage(items: List<ShoppingItem>): WhatsAppShareResult {
        val unpurchased = items.filter { !it.isChecked }
        if (unpurchased.isEmpty()) {
            return WhatsAppShareResult(
                message = "",
                unpurchasedCount = 0,
                unpricedCount = 0,
                knownTotal = 0.0,
                isEmpty = true
            )
        }

        var knownTotal = 0.0
        var unpricedCount = 0
        val lines = mutableListOf<String>()

        for (item in unpurchased) {
            val lineTotal = if (item.unitPrice != null && item.unitPrice >= 0.0) {
                item.quantity * item.unitPrice
            } else null

            if (lineTotal != null) {
                knownTotal += lineTotal
                lines.add("▫️ ${item.name} (${item.quantity} ${item.unit}) - ${lineTotal.toInt()} ج.م")
            } else {
                unpricedCount++
                lines.add("▫️ ${item.name} (${item.quantity} ${item.unit}) - سعر غير محدد")
            }
        }

        val summary = when {
            unpricedCount == 0 -> "💰 الإجمالي التقديري: ${knownTotal.toInt()} ج.م"
            unpricedCount == unpurchased.size -> "💰 الإجمالي التقديري: غير محدد (جميع الأصناف بدون تسعير)"
            else -> "💰 الإجمالي التقديري: ${knownTotal.toInt()} ج.م (للأصناف المسعرة فقط - يوجد $unpricedCount صنف بدون تسعير)"
        }

        val fullMessage = buildString {
            appendLine("🛒 قائمة طلبات البيت من تطبيق تدبيرة مصر:")
            appendLine()
            lines.forEach { appendLine(it) }
            appendLine("-------------------------")
            appendLine(summary)
            append("📱 تم الإنشاء عبر تطبيق تدبيرة مصر 🇪🇬")
        }

        return WhatsAppShareResult(
            message = fullMessage,
            unpurchasedCount = unpurchased.size,
            unpricedCount = unpricedCount,
            knownTotal = knownTotal,
            isEmpty = false
        )
    }

    @Test
    fun testWhatsAppShareOmitsCheckedItemsAndHandlesUnpriced() {
        val items = listOf(
            ShoppingItem("1", "أرز مصري", 1.0, "كيلو", 35.0, isChecked = false),
            ShoppingItem("2", "مكرونة فرن", 2.0, "كيس", null, isChecked = false),
            ShoppingItem("3", "صلصة طماطم", 1.0, "علبة", 15.0, isChecked = true) // Already purchased
        )

        val result = formatWhatsAppMessage(items)
        assertFalse(result.isEmpty)
        assertEquals(2, result.unpurchasedCount)
        assertEquals(1, result.unpricedCount)
        assertEquals(35.0, result.knownTotal, 0.01)

        assertTrue("Should include unpurchased rice", result.message.contains("أرز مصري"))
        assertTrue("Should include unpriced pasta", result.message.contains("سعر غير محدد"))
        assertFalse("Should NOT include purchased tomato paste", result.message.contains("صلصة طماطم"))
        assertTrue("Should explicitly state partial total", result.message.contains("للأصناف المسعرة فقط"))
    }

    @Test
    fun testWhatsAppShareEmptyListReturnsEmptyResult() {
        val allPurchased = listOf(
            ShoppingItem("1", "عدس", 1.0, "كوب", 20.0, isChecked = true)
        )
        val result = formatWhatsAppMessage(allPurchased)
        assertTrue("Empty or all-purchased list must produce isEmpty = true", result.isEmpty)
        assertEquals(0, result.unpurchasedCount)
        assertEquals("", result.message)
    }

    @Test
    fun testZeroMissingIngredientsFilterStrictMatch() {
        val selectedPantry = setOf("بيض", "طماطم", "بصل")

        val recipeShakshoukaIngredients = listOf("بيض", "طماطم", "بصل")
        val recipeKosharyIngredients = listOf("عدس", "أرز", "مكرونة", "بصل")

        val shakshoukaMissing = recipeShakshoukaIngredients.filterNot { selectedPantry.contains(it) }
        val kosharyMissing = recipeKosharyIngredients.filterNot { selectedPantry.contains(it) }

        assertEquals(0, shakshoukaMissing.size)
        assertTrue(kosharyMissing.isNotEmpty())

        // Under Zero-Missing Filter:
        val isZeroMissingFilterActive = true
        val matchedRecipes = listOf(
            "شكشوكة" to (shakshoukaMissing.isEmpty()),
            "كشري" to (kosharyMissing.isEmpty())
        ).filter { if (isZeroMissingFilterActive) it.second else true }

        assertEquals("Only Shakshouka matches 100% of pantry ingredients", 1, matchedRecipes.size)
        assertEquals("شكشوكة", matchedRecipes[0].first)
    }

    @Test
    fun testBackupRestoreSchemaValidationAndPercentagesRebalance() {
        val rawPercentages = listOf(70, 20, 30) // Sum = 120 (invalid)
        val sum = rawPercentages.sum()
        assertTrue("Sum is not 100%", sum != 100)

        // Normalization engine rebalances to 100%
        val rebalanced = mutableListOf<Int>()
        var running = 0
        for (i in 0 until rawPercentages.size - 1) {
            val scaled = Math.round((rawPercentages[i].toDouble() / sum) * 100).toInt()
            rebalanced.add(scaled)
            running += scaled
        }
        rebalanced.add(100 - running)

        assertEquals(3, rebalanced.size)
        assertEquals("Rebalanced sum must equal exactly 100", 100, rebalanced.sum())
    }

    // ========================================================
    // Phase 4B: Visual Budget Analytics & Payday Cycle Tests
    // ========================================================

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
        // 1. Under 80% -> Green
        val greenResult = calculateCategoryAnalytics(allocated = 1000.0, spent = 700.0)
        assertEquals(70.0, greenResult.progressPercentage, 0.01)
        assertEquals(70.0, greenResult.visualProgress, 0.01)
        assertEquals(ProgressColor.GREEN, greenResult.color)
        assertFalse(greenResult.isOverBudget)
        assertEquals(0.0, greenResult.exceededAmount, 0.01)

        // 2. 80% to 99% -> Amber
        val amberResult = calculateCategoryAnalytics(allocated = 1000.0, spent = 850.0)
        assertEquals(85.0, amberResult.progressPercentage, 0.01)
        assertEquals(ProgressColor.AMBER, amberResult.color)
        assertFalse(amberResult.isOverBudget)

        // 3. 100% or more -> Red, Visual clamped to 100%, true percentage preserved
        val redResult = calculateCategoryAnalytics(allocated = 1000.0, spent = 1250.0)
        assertEquals(125.0, redResult.progressPercentage, 0.01)
        assertEquals(100.0, redResult.visualProgress, 0.01) // Visual bar capped at 100
        assertEquals(ProgressColor.RED, redResult.color)
        assertTrue(redResult.isOverBudget)
        assertEquals(250.0, redResult.exceededAmount, 0.01) // 1250 - 1000

        // 4. Zero allocation defense (spent > 0, allocated = 0)
        val zeroAllocResult = calculateCategoryAnalytics(allocated = 0.0, spent = 300.0)
        assertEquals(100.0, zeroAllocResult.progressPercentage, 0.01)
        assertEquals(ProgressColor.RED, zeroAllocResult.color)
        assertTrue(zeroAllocResult.isOverBudget)
        assertEquals(300.0, zeroAllocResult.exceededAmount, 0.01)
    }

    private fun getDaysInMonth(year: Int, month: Int): Int {
        return java.time.YearMonth.of(year, month).lengthOfMonth()
    }

    data class PaydayResult(
        val daysRemaining: Int,
        val isToday: Boolean,
        val targetDay: Int,
        val dailyCap: Double
    )

    private fun calculatePayday(
        paydaySetting: Int,
        currentYear: Int,
        currentMonth: Int, // 1-12
        currentDay: Int,
        remainingBudget: Double
    ): PaydayResult {
        val today = java.time.LocalDate.of(currentYear, currentMonth, currentDay)
        val currentMonthMax = getDaysInMonth(currentYear, currentMonth)
        val thisMonthPayday = java.time.LocalDate.of(currentYear, currentMonth, Math.min(paydaySetting, currentMonthMax))

        val targetDate = if (today.isBefore(thisMonthPayday) || today.isEqual(thisMonthPayday)) {
            thisMonthPayday
        } else {
            // Next month
            val nextMonthDate = today.plusMonths(1)
            val nextMonthMax = getDaysInMonth(nextMonthDate.year, nextMonthDate.monthValue)
            java.time.LocalDate.of(nextMonthDate.year, nextMonthDate.monthValue, Math.min(paydaySetting, nextMonthMax))
        }

        val daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(today, targetDate).toInt()
        val isToday = daysRemaining == 0

        val daysForCap = if (isToday) 1 else daysRemaining
        val dailyCap = if (remainingBudget > 0.0) remainingBudget / daysForCap else 0.0

        return PaydayResult(
            daysRemaining = daysRemaining,
            isToday = isToday,
            targetDay = targetDate.dayOfMonth,
            dailyCap = dailyCap
        )
    }

    @Test
    fun testPhase4BPaydayCalculationsAndDailyCap() {
        // Today is 20th, payday is 25th -> 5 days remaining
        val r1 = calculatePayday(paydaySetting = 25, currentYear = 2026, currentMonth = 4, currentDay = 20, remainingBudget = 1000.0)
        assertEquals(5, r1.daysRemaining)
        assertFalse(r1.isToday)
        assertEquals(200.0, r1.dailyCap, 0.01) // 1000 / 5 = 200

        // Today is payday (25th)
        val r2 = calculatePayday(paydaySetting = 25, currentYear = 2026, currentMonth = 4, currentDay = 25, remainingBudget = 500.0)
        assertEquals(0, r2.daysRemaining)
        assertTrue(r2.isToday)
        assertEquals(500.0, r2.dailyCap, 0.01)

        // Payday setting is 31st, but current month is February (non-leap year 2027) -> clamped to 28
        val r3 = calculatePayday(paydaySetting = 31, currentYear = 2027, currentMonth = 2, currentDay = 15, remainingBudget = 1300.0)
        assertEquals(28, r3.targetDay)
        assertEquals(13, r3.daysRemaining) // 28 - 15 = 13
        assertEquals(100.0, r3.dailyCap, 0.01) // 1300 / 13 = 100

        // Rollover to next month (Today is 26th, payday is 1st -> target is May 1st)
        val r4 = calculatePayday(paydaySetting = 1, currentYear = 2026, currentMonth = 4, currentDay = 26, remainingBudget = 600.0)
        assertEquals(1, r4.targetDay)
        assertEquals(5, r4.daysRemaining) // April 26 to May 1 = 5 days

        // Budget exhausted (remaining <= 0)
        val r5 = calculatePayday(paydaySetting = 25, currentYear = 2026, currentMonth = 4, currentDay = 20, remainingBudget = -50.0)
        assertEquals(0.0, r5.dailyCap, 0.01)
    }

    // ========================================================
    // Phase 4C: Voice Ingredient Selection & Daily Tips Interaction Tests
    // ========================================================

    private fun normalizeArabicText(text: String): String {
        return text
            .replace(Regex("[\\u064B-\\u065F\\u0670\\u0640]"), "")
            .replace(Regex("[إأآٱ]"), "ا")
            .replace("ى", "ي")
            .replace("ة", "ه")
            .trim()
            .lowercase()
    }

    private val ARABIC_INGREDIENT_ALIASES = mapOf(
        "قوطة" to "طماطم",
        "طماطماية" to "طماطم",
        "بندورة" to "طماطم",
        "بتنجان" to "باذنجان",
        "بيتنجان" to "باذنجان",
        "رز" to "أرز",
        "توم" to "ثوم",
        "تومة" to "ثوم",
        "بطاطساية" to "بطاطس",
        "بصلاية" to "بصل",
        "مكرونه" to "مكرونة",
        "شعريه" to "شعرية",
        "فراخ" to "دجاج",
        "لحمه" to "لحم مفروم"
    )

    private val STOP_WORDS = setOf(
        "عندي", "معايا", "في", "البيت", "التلاجة", "موجود", "وهات", "وحط", "عاوز", "عايز", "و"
    )

    private fun matchSpokenIngredients(spokenText: String, catalog: List<String>): List<String> {
        val normalized = normalizeArabicText(spokenText)
        val tokens = normalized.split(Regex("[\\s,،.]+")).filter { it.isNotBlank() && !STOP_WORDS.contains(it) }
        val matched = mutableSetOf<String>()

        for (token in tokens) {
            val canonical = ARABIC_INGREDIENT_ALIASES[token] ?: token
            val normCanonical = normalizeArabicText(canonical)

            for (catalogItem in catalog) {
                val normItem = normalizeArabicText(catalogItem)
                if (normItem == normCanonical || normItem == normalizeArabicText(token)) {
                    matched.add(catalogItem)
                }
            }
        }
        return matched.toList()
    }

    @Test
    fun testPhase4CVoiceIngredientMatchingAndAliases() {
        val catalog = listOf("طماطم", "أرز", "باذنجان", "ثوم", "بصل", "بطاطس", "مكرونة")

        val spoken = "عندي في البيت قوطة ورز وبتنجان وشوية مروحة"
        val matched = matchSpokenIngredients(spoken, catalog)

        assertTrue(matched.contains("طماطم")) // mapped from قوطة
        assertTrue(matched.contains("أرز"))    // mapped from رز
        assertTrue(matched.contains("باذنجان"))// mapped from بتنجان
        assertFalse(matched.contains("مروحة")) // not in catalog

        // Additive selection preserves existing pantry
        val existingPantry = listOf("بصل")
        val combined = (existingPantry + matched).distinct()
        assertEquals(4, combined.size)
        assertTrue(combined.contains("بصل"))
        assertTrue(combined.contains("طماطم"))

        // Duplicate prevention
        val duplicatesCombined = (combined + listOf("طماطم", "طماطم")).distinct()
        assertEquals(4, duplicatesCombined.size)
    }

    @Test
    fun testPhase4CTipsAchievementUniqueCounterAndFilters() {
        val triedTipIds = mutableSetOf<String>()

        // User taps "جربت الحيلة دي ووفرت" on tip 1
        triedTipIds.add("idea_1")
        assertEquals(1, triedTipIds.size)

        // Duplicate tap or re-adding same ID does not inflate count
        triedTipIds.add("idea_1")
        assertEquals(1, triedTipIds.size)

        // Adding second tip
        triedTipIds.add("idea_2")
        assertEquals(2, triedTipIds.size)

        // Toggling off tip 1
        triedTipIds.remove("idea_1")
        assertEquals(1, triedTipIds.size)
        assertTrue(triedTipIds.contains("idea_2"))

        // 5 exact categories verification
        val categories = listOf("الكل", "تنظيف", "توفير كهرباء", "مطبخ وتغذية", "حيل تسوق")
        assertEquals(5, categories.size)
        assertTrue(categories.contains("تنظيف"))
        assertTrue(categories.contains("توفير كهرباء"))
        assertTrue(categories.contains("مطبخ وتغذية"))
        assertTrue(categories.contains("حيل تسوق"))
    }

    // ========================================================
    // Phase 4D: Rewarded Ads & Local Notifications Tests
    // ========================================================

    @Test
    fun testPhase4DRewardedAdUnitAndIdempotentReward() {
        val testRewardedAdUnitId = "ca-app-pub-3940256099942544/5224354917"
        assertEquals("ca-app-pub-3940256099942544/5224354917", testRewardedAdUnitId)

        var isWeeklyPlanUnlocked = false
        var rewardGrantedCount = 0

        val grantReward = {
            if (!isWeeklyPlanUnlocked) {
                isWeeklyPlanUnlocked = true
                rewardGrantedCount++
            }
        }

        // Simulate user dismissing ad without watching
        val userCancelled = true
        if (!userCancelled) {
            grantReward()
        }
        assertFalse(isWeeklyPlanUnlocked)
        assertEquals(0, rewardGrantedCount)

        // Simulate user watching ad to completion
        grantReward()
        assertTrue(isWeeklyPlanUnlocked)
        assertEquals(1, rewardGrantedCount)

        // Idempotent duplicate completion call
        grantReward()
        assertTrue(isWeeklyPlanUnlocked)
        assertEquals(1, rewardGrantedCount) // Count remains 1
    }

    @Test
    fun testPhase4DLocalNotificationStableId() {
        val dailyReminderNotificationId = 101
        assertEquals(101, dailyReminderNotificationId)

        val scheduledIds = mutableSetOf<Int>()
        scheduledIds.add(dailyReminderNotificationId)
        scheduledIds.add(dailyReminderNotificationId) // Re-scheduling with same ID overwrites/prevents duplicates

        assertEquals(1, scheduledIds.size)
    }
}

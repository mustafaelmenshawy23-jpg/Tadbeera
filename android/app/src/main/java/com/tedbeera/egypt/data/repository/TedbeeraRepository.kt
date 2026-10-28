package com.tedbeera.egypt.data.repository

import com.tedbeera.egypt.data.local.AppDatabase
import com.tedbeera.egypt.data.local.entity.ChallengeEntity
import com.tedbeera.egypt.data.local.entity.SavedBudgetEntity
import com.tedbeera.egypt.data.local.entity.SavedRecipeEntity
import com.tedbeera.egypt.data.local.entity.ShoppingItemEntity
import com.tedbeera.egypt.data.model.BudgetCategoryType
import com.tedbeera.egypt.data.model.BudgetPlan
import com.tedbeera.egypt.data.model.BudgetSlice
import com.tedbeera.egypt.data.model.DailyChallenge
import com.tedbeera.egypt.data.model.DailyIdea
import com.tedbeera.egypt.data.model.Ingredient
import com.tedbeera.egypt.data.model.Recipe
import com.tedbeera.egypt.data.model.RecipeMatchResult
import com.tedbeera.egypt.data.seed.SeedData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

class TedbeeraRepository(private val db: AppDatabase) {

    // --- FOOD & RECIPES ---

    fun getCommonIngredients(): List<String> = SeedData.commonIngredients

    fun filterRecipes(
        selectedIngredients: Set<String>,
        isVeryBudgetFilter: Boolean,
        isQuickFilter: Boolean,
        usesLeftoversFilter: Boolean
    ): List<RecipeMatchResult> {
        val allRecipes = SeedData.recipes

        return allRecipes.filter { recipe ->
            // Filter by boolean flags if enabled
            val matchesBudget = !isVeryBudgetFilter || recipe.isVeryBudget
            val matchesQuick = !isQuickFilter || recipe.isQuick
            val matchesLeftovers = !usesLeftoversFilter || recipe.usesLeftovers
            matchesBudget && matchesQuick && matchesLeftovers
        }.map { recipe ->
            val requiredNames = recipe.ingredients.map { it.name }
            val available = recipe.ingredients.filter { ing ->
                selectedIngredients.any { sel -> ing.name.contains(sel, ignoreCase = true) || sel.contains(ing.name, ignoreCase = true) }
            }
            val missing = recipe.ingredients.filterNot { ing ->
                selectedIngredients.any { sel -> ing.name.contains(sel, ignoreCase = true) || sel.contains(ing.name, ignoreCase = true) }
            }

            val isComplete = missing.isEmpty()

            RecipeMatchResult(
                recipe = recipe,
                availableCount = available.size,
                totalCount = recipe.ingredients.size,
                missingIngredients = missing,
                isCompleteMatch = isComplete
            )
        }.sortedWith(
            compareByDescending<RecipeMatchResult> { it.isCompleteMatch }
                .thenByDescending { it.availableCount.toDouble() / it.totalCount.coerceAtLeast(1) }
        )
    }

    val savedRecipes: Flow<List<SavedRecipeEntity>> = db.recipeDao().getAllSavedRecipes()

    fun isRecipeSaved(recipeId: String): Flow<Boolean> = db.recipeDao().isRecipeSaved(recipeId)

    suspend fun saveRecipe(recipe: Recipe) = withContext(Dispatchers.IO) {
        val entity = SavedRecipeEntity(
            recipeId = recipe.id,
            name = recipe.name,
            prepTimeMinutes = recipe.prepTimeMinutes,
            budgetCategory = recipe.budgetCategory,
            estimatedCostEgp = recipe.estimatedCostEgp,
            ingredientsJson = recipe.ingredients.joinToString(";") { "${it.name}:${it.quantity}" },
            stepsJson = recipe.steps.joinToString(";")
        )
        db.recipeDao().insertSavedRecipe(entity)
    }

    suspend fun removeSavedRecipe(recipeId: String) = withContext(Dispatchers.IO) {
        db.recipeDao().deleteSavedRecipeById(recipeId)
    }

    suspend fun addMissingIngredientsToShoppingList(missing: List<Ingredient>) = withContext(Dispatchers.IO) {
        if (missing.isEmpty()) return@withContext
        val items = missing.map {
            ShoppingItemEntity(
                name = it.name,
                quantity = if (it.quantity.isNotBlank()) it.quantity else "1",
                estimatedUnitPrice = 0.0,
                isChecked = false
            )
        }
        db.shoppingDao().insertItemsBatch(items)
    }

    // --- BUDGET CALCULATOR ENGINE ---

    companion object {
        fun normalizePercentagesTo100(percentages: List<Int>): List<Int> {
            if (percentages.isEmpty()) return emptyList()
            val nonNegative = percentages.map { it.coerceAtLeast(0) }
            val sum = nonNegative.sum()
            if (sum == 0) {
                val base = 100 / percentages.size
                val rem = 100 % percentages.size
                return List(percentages.size) { i -> base + if (i < rem) 1 else 0 }
            }
            if (sum == 100) return nonNegative

            var runningSum = 0
            val result = mutableListOf<Int>()
            for (i in 0 until nonNegative.size - 1) {
                val calculated = ((nonNegative[i].toDouble() / sum) * 100).roundToInt().coerceIn(0, 100)
                result.add(calculated)
                runningSum += calculated
            }
            val last = (100 - runningSum).coerceIn(0, 100)
            result.add(last)

            // Final sanity check to guarantee strict 100% invariant
            val diff = 100 - result.sum()
            if (diff != 0) {
                result[0] = (result[0] + diff).coerceAtLeast(0)
            }
            return result
        }

        fun redistributePercentages(
            targetIndex: Int,
            newPercentage: Int,
            currentPercentages: List<Int>
        ): List<Int> {
            val size = currentPercentages.size
            if (size <= 1 || targetIndex !in 0 until size) {
                return currentPercentages
            }

            val clampedTarget = newPercentage.coerceIn(0, 100)
            val result = currentPercentages.toMutableList()
            result[targetIndex] = clampedTarget

            val otherIndices = (0 until size).filter { it != targetIndex }
            val remaining = 100 - clampedTarget

            val currentOthersSum = otherIndices.sumOf { currentPercentages[it].coerceAtLeast(0) }

            if (currentOthersSum > 0) {
                var runningAllocated = 0
                for (i in 0 until otherIndices.size - 1) {
                    val idx = otherIndices[i]
                    val ratio = currentPercentages[idx].toDouble() / currentOthersSum
                    val allocated = (ratio * remaining).roundToInt().coerceIn(0, remaining)
                    result[idx] = allocated
                    runningAllocated += allocated
                }
                val lastIdx = otherIndices.last()
                result[lastIdx] = (remaining - runningAllocated).coerceIn(0, remaining)
            } else {
                val base = remaining / otherIndices.size
                var rem = remaining % otherIndices.size
                for (idx in otherIndices) {
                    result[idx] = base + if (rem > 0) 1 else 0
                    if (rem > 0) rem--
                }
            }

            // Invariant assurance: ensure sum is identically 100
            val diff = 100 - result.sum()
            if (diff != 0) {
                val adjustIdx = otherIndices.firstOrNull() ?: targetIndex
                result[adjustIdx] = (result[adjustIdx] + diff).coerceAtLeast(0)
            }
            return result
        }
    }

    fun calculateBudget(
        category: BudgetCategoryType,
        totalAmount: Double,
        customPercentages: List<Int>? = null
    ): BudgetPlan {
        val safeTotal = if (totalAmount < 0.0) 0.0 else totalAmount

        val defaultSlices = when (category) {
            BudgetCategoryType.GROCERIES_WEEK -> listOf(
                Triple("أساسيات وتموين البيت", 50, "زيت، سكر، أرز، مكرونة، دقيق وبقوليات تكفي الأسبوع."),
                Triple("خضار وفاكهة طازجة", 30, "اشتري الخضار الموسمي من سوق الخضار الأسبوعي لتوفير ملحوظ."),
                Triple("طوارئ ونثريات بقالة", 20, "مبلغ احتياطي لبن، زبادي، أو نواقص مفاجئة أثناء الأسبوع.")
            )
            BudgetCategoryType.SCHOOL_EXPENSES -> listOf(
                Triple("أدوات مدرسية وكشاكيل", 40, "شراء من الفجالة أو المكتبات بالجملة بداية كل فصل دراسي."),
                Triple("مستلزمات ملابس وتغذية", 40, "تحضير اللانش بوكس البيتي يوفر أكثر من 70% مقارنة بالشراء اليومي."),
                Triple("أنشطة ومصروفات طارئة", 20, "احتياطي للرحلات والكتب الخارجية المصورة.")
            )
            BudgetCategoryType.HOME_EMERGENCY -> listOf(
                Triple("صيانة وأعطال مفاجئة", 45, "سباكة، كهرباء، أو قطع غيار أدوات منزلية أساسية."),
                Triple("أدوية وعلاجات إسعافات", 35, "صيدلية البيت، خافض حرارة، مسكنات ومستلزمات أولية."),
                Triple("احتياطي مرن", 20, "لأي ظرف غير متوقع خلال الشهر لمنع الاستدانة.")
            )
        }

        val rawPercentages = if (customPercentages != null && customPercentages.size == defaultSlices.size) {
            customPercentages
        } else {
            defaultSlices.map { it.second }
        }

        // Strictly enforce 100% total
        val normalizedPercentages = normalizePercentagesTo100(rawPercentages)

        val slices = defaultSlices.mapIndexed { index, item ->
            val pct = normalizedPercentages[index]
            val amount = (safeTotal * pct) / 100.0
            BudgetSlice(
                id = "slice_${index}",
                name = item.first,
                percentage = pct,
                calculatedAmount = amount,
                practicalTip = item.third
            )
        }

        return BudgetPlan(
            category = category,
            totalAmount = safeTotal,
            slices = slices
        )
    }

    val savedBudgets: Flow<List<SavedBudgetEntity>> = db.budgetDao().getAllSavedBudgets()

    suspend fun saveBudgetPlan(plan: BudgetPlan) = withContext(Dispatchers.IO) {
        val json = plan.slices.joinToString(";") { "${it.name}:${it.percentage}:${it.calculatedAmount}" }
        val entity = SavedBudgetEntity(
            categoryName = plan.category.titleArabic,
            totalAmountEgp = plan.totalAmount,
            allocationsJson = json
        )
        db.budgetDao().insertSavedBudget(entity)
    }

    suspend fun deleteSavedBudget(id: Long) = withContext(Dispatchers.IO) {
        db.budgetDao().deleteSavedBudgetById(id)
    }

    // --- DAILY CHALLENGE & IDEAS ---

    fun getTodayDateKey(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return sdf.format(Date())
    }

    suspend fun getOrInitTodayChallenge(): ChallengeEntity = withContext(Dispatchers.IO) {
        val todayKey = getTodayDateKey()
        val existing = db.challengeDao().getChallengeForDateSync(todayKey)
        if (existing != null) {
            existing
        } else {
            val generated = SeedData.getChallengeForDateKey(todayKey)
            val newEntity = ChallengeEntity(
                dateKey = todayKey,
                challengeId = generated.id,
                title = generated.title,
                description = generated.description,
                impactTag = generated.impactTag,
                isCompleted = false,
                completedAtTimestamp = null
            )
            db.challengeDao().insertChallengeIfAbsent(newEntity)
            db.challengeDao().getChallengeForDateSync(todayKey) ?: newEntity
        }
    }

    fun observeTodayChallenge(): Flow<ChallengeEntity?> {
        val todayKey = getTodayDateKey()
        return db.challengeDao().getChallengeForDate(todayKey)
    }

    suspend fun toggleChallengeCompletion(dateKey: String, isCompleted: Boolean) = withContext(Dispatchers.IO) {
        val timestamp = if (isCompleted) System.currentTimeMillis() else null
        db.challengeDao().updateCompletion(dateKey, isCompleted, timestamp)
    }

    fun getAllDailyIdeas(): List<DailyIdea> = SeedData.dailyIdeas

    // --- SHOPPING LIST ---

    val shoppingItems: Flow<List<ShoppingItemEntity>> = db.shoppingDao().getAllShoppingItems()

    suspend fun addShoppingItem(name: String, quantity: String, unitPrice: Double = 0.0) = withContext(Dispatchers.IO) {
        if (name.isBlank()) return@withContext
        val entity = ShoppingItemEntity(
            name = name.trim(),
            quantity = if (quantity.isBlank()) "1" else quantity.trim(),
            estimatedUnitPrice = unitPrice.coerceAtLeast(0.0),
            isChecked = false
        )
        db.shoppingDao().insertItem(entity)
    }

    suspend fun toggleShoppingItemCheck(id: Long, isChecked: Boolean) = withContext(Dispatchers.IO) {
        db.shoppingDao().toggleItemCheck(id, isChecked)
    }

    suspend fun deleteShoppingItem(id: Long) = withContext(Dispatchers.IO) {
        db.shoppingDao().deleteItemById(id)
    }

    suspend fun clearCheckedShoppingItems() = withContext(Dispatchers.IO) {
        db.shoppingDao().deleteCheckedItems()
    }

    // --- PRIVACY CONTROL: ERASE ALL APPLICATION DATA ---

    suspend fun clearAllApplicationData() = withContext(Dispatchers.IO) {
        db.recipeDao().deleteAllSavedRecipes()
        db.budgetDao().deleteAllSavedBudgets()
        db.shoppingDao().deleteAllShoppingItems()
        db.challengeDao().deleteAllChallenges()
    }
}

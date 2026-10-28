package com.tedbeera.egypt.data.model

data class Ingredient(
    val name: String,
    val quantity: String = ""
)

data class Recipe(
    val id: String,
    val name: String,
    val prepTimeMinutes: Int,
    val ingredients: List<Ingredient>,
    val steps: List<String>,
    val budgetCategory: String, // "اقتصادي جداً", "متوسط", "عائلي"
    val estimatedCostEgp: Int, // Cost estimate in EGP
    val isVeryBudget: Boolean = false,
    val isQuick: Boolean = false, // < 20 minutes
    val usesLeftovers: Boolean = false, // استغلال بواقي الأكل
    val tags: List<String> = emptyList()
)

data class RecipeMatchResult(
    val recipe: Recipe,
    val availableCount: Int,
    val totalCount: Int,
    val missingIngredients: List<Ingredient>,
    val isCompleteMatch: Boolean
)

enum class BudgetCategoryType(val titleArabic: String) {
    GROCERIES_WEEK("أسبوع بقالة"),
    SCHOOL_EXPENSES("مصاريف مدارس"),
    HOME_EMERGENCY("طوارئ البيت")
}

data class BudgetSlice(
    val id: String,
    val name: String,
    val percentage: Int, // e.g. 50
    val calculatedAmount: Double,
    val practicalTip: String
)

data class BudgetPlan(
    val category: BudgetCategoryType,
    val totalAmount: Double,
    val slices: List<BudgetSlice>,
    val timestamp: Long = System.currentTimeMillis()
)

data class DailyIdea(
    val id: String,
    val title: String,
    val category: String, // أنشطة عائلية، تنظيم وصيانة، تنظيم المذاكرة، تقليل الهدر
    val description: String,
    val practicalTip: String,
    val timeRequired: String,
    val tags: List<String>
)

data class DailyChallenge(
    val id: String,
    val title: String,
    val description: String,
    val impactTag: String,
    val dateKey: String = "",
    val isCompleted: Boolean = false
)

data class ShoppingItem(
    val id: Long = 0,
    val name: String,
    val quantity: String = "1",
    val estimatedUnitPrice: Double = 0.0,
    val isChecked: Boolean = false
)

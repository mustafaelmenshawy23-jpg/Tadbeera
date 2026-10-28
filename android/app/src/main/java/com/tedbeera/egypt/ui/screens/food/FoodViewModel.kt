package com.tedbeera.egypt.ui.screens.food

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tedbeera.egypt.data.model.Ingredient
import com.tedbeera.egypt.data.model.Recipe
import com.tedbeera.egypt.data.model.RecipeMatchResult
import com.tedbeera.egypt.data.repository.TedbeeraRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class FoodUiState(
    val availableIngredients: List<String> = emptyList(),
    val selectedIngredients: Set<String> = emptySet(),
    val isVeryBudgetFilter: Boolean = false,
    val isQuickFilter: Boolean = false,
    val usesLeftoversFilter: Boolean = false,
    val matchedRecipes: List<RecipeMatchResult> = emptyList(),
    val selectedRecipeDetails: Recipe? = null,
    val userFeedbackMessage: String? = null
)

class FoodViewModel(private val repository: TedbeeraRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(
        FoodUiState(
            availableIngredients = repository.getCommonIngredients()
        )
    )
    val uiState: StateFlow<FoodUiState> = _uiState.asStateFlow()

    val savedRecipeIds: StateFlow<Set<String>> = repository.savedRecipes
        .combine(MutableStateFlow(Unit)) { savedList, _ ->
            savedList.map { it.recipeId }.toSet()
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    init {
        updateRecipeMatches()
    }

    fun toggleIngredient(name: String) {
        val current = _uiState.value.selectedIngredients.toMutableSet()
        if (current.contains(name)) {
            current.remove(name)
        } else {
            current.add(name)
        }
        _uiState.value = _uiState.value.copy(selectedIngredients = current)
        updateRecipeMatches()
    }

    fun clearSelectedIngredients() {
        _uiState.value = _uiState.value.copy(selectedIngredients = emptySet())
        updateRecipeMatches()
    }

    fun toggleVeryBudgetFilter() {
        _uiState.value = _uiState.value.copy(isVeryBudgetFilter = !_uiState.value.isVeryBudgetFilter)
        updateRecipeMatches()
    }

    fun toggleQuickFilter() {
        _uiState.value = _uiState.value.copy(isQuickFilter = !_uiState.value.isQuickFilter)
        updateRecipeMatches()
    }

    fun toggleLeftoversFilter() {
        _uiState.value = _uiState.value.copy(usesLeftoversFilter = !_uiState.value.usesLeftoversFilter)
        updateRecipeMatches()
    }

    fun selectRecipeForDetails(recipe: Recipe?) {
        _uiState.value = _uiState.value.copy(selectedRecipeDetails = recipe)
    }

    fun toggleSaveRecipe(recipe: Recipe, isCurrentlySaved: Boolean) {
        viewModelScope.launch {
            if (isCurrentlySaved) {
                repository.removeSavedRecipe(recipe.id)
                showTemporaryFeedback("تمت إزالة الوجبة من المحفوظات")
            } else {
                repository.saveRecipe(recipe)
                showTemporaryFeedback("تم حفظ الوجبة في المحفوظات بنجاح")
            }
        }
    }

    fun addMissingToShoppingList(missing: List<Ingredient>) {
        if (missing.isEmpty()) return
        viewModelScope.launch {
            repository.addMissingIngredientsToShoppingList(missing)
            showTemporaryFeedback("تمت إضافة ${missing.size} مكونات لقائمة النواقص بنجاح")
        }
    }

    fun clearFeedbackMessage() {
        _uiState.value = _uiState.value.copy(userFeedbackMessage = null)
    }

    private fun showTemporaryFeedback(message: String) {
        _uiState.value = _uiState.value.copy(userFeedbackMessage = message)
    }

    private fun updateRecipeMatches() {
        val matches = repository.filterRecipes(
            selectedIngredients = _uiState.value.selectedIngredients,
            isVeryBudgetFilter = _uiState.value.isVeryBudgetFilter,
            isQuickFilter = _uiState.value.isQuickFilter,
            usesLeftoversFilter = _uiState.value.usesLeftoversFilter
        )
        _uiState.value = _uiState.value.copy(matchedRecipes = matches)
    }
}

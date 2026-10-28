package com.tedbeera.egypt.ui.screens.saved

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tedbeera.egypt.data.local.entity.SavedBudgetEntity
import com.tedbeera.egypt.data.local.entity.SavedRecipeEntity
import com.tedbeera.egypt.data.local.entity.ShoppingItemEntity
import com.tedbeera.egypt.data.repository.TedbeeraRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class SavedTab(val titleArabic: String) {
    RECIPES("الوجبات المحفوظة"),
    BUDGETS("خطط الميزانية"),
    SHOPPING("قائمة النواقص")
}

data class SavedUiState(
    val currentTab: SavedTab = SavedTab.SHOPPING,
    val isClearAllDataDialogOpen: Boolean = false,
    val isAddItemDialogOpen: Boolean = false,
    val feedbackMessage: String? = null
)

class SavedViewModel(private val repository: TedbeeraRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(SavedUiState())
    val uiState: StateFlow<SavedUiState> = _uiState.asStateFlow()

    val savedRecipes: StateFlow<List<SavedRecipeEntity>> = repository.savedRecipes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val savedBudgets: StateFlow<List<SavedBudgetEntity>> = repository.savedBudgets
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val shoppingItems: StateFlow<List<ShoppingItemEntity>> = repository.shoppingItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectTab(tab: SavedTab) {
        _uiState.value = _uiState.value.copy(currentTab = tab)
    }

    // Recipe operations
    fun removeSavedRecipe(recipeId: String) {
        viewModelScope.launch {
            repository.removeSavedRecipe(recipeId)
            _uiState.value = _uiState.value.copy(feedbackMessage = "تم حذف الوجبة من المحفوظات")
        }
    }

    // Budget operations
    fun removeSavedBudget(budgetId: Long) {
        viewModelScope.launch {
            repository.deleteSavedBudget(budgetId)
            _uiState.value = _uiState.value.copy(feedbackMessage = "تم حذف خطة الميزانية")
        }
    }

    // Shopping list operations
    fun addShoppingItem(name: String, quantity: String, unitPrice: Double) {
        viewModelScope.launch {
            repository.addShoppingItem(name, quantity, unitPrice)
            _uiState.value = _uiState.value.copy(
                isAddItemDialogOpen = false,
                feedbackMessage = "تمت إضافة العنصر لقائمة النواقص"
            )
        }
    }

    fun toggleShoppingItem(id: Long, isChecked: Boolean) {
        viewModelScope.launch {
            repository.toggleShoppingItemCheck(id, isChecked)
        }
    }

    fun deleteShoppingItem(id: Long) {
        viewModelScope.launch {
            repository.deleteShoppingItem(id)
        }
    }

    fun clearCheckedShoppingItems() {
        viewModelScope.launch {
            repository.clearCheckedShoppingItems()
            _uiState.value = _uiState.value.copy(feedbackMessage = "تم مسح العناصر المكتملة")
        }
    }

    // Privacy Wipe
    fun openClearAllDataDialog(isOpen: Boolean) {
        _uiState.value = _uiState.value.copy(isClearAllDataDialogOpen = isOpen)
    }

    fun confirmClearAllData() {
        viewModelScope.launch {
            repository.clearAllApplicationData()
            _uiState.value = _uiState.value.copy(
                isClearAllDataDialogOpen = false,
                feedbackMessage = "تم مسح جميع بيانات التطبيق المحلية بنجاح"
            )
        }
    }

    fun openAddItemDialog(isOpen: Boolean) {
        _uiState.value = _uiState.value.copy(isAddItemDialogOpen = isOpen)
    }

    fun clearFeedbackMessage() {
        _uiState.value = _uiState.value.copy(feedbackMessage = null)
    }
}

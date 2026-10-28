package com.tedbeera.egypt.ui.screens.budget

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tedbeera.egypt.data.model.BudgetCategoryType
import com.tedbeera.egypt.data.model.BudgetPlan
import com.tedbeera.egypt.data.model.BudgetSlice
import com.tedbeera.egypt.data.repository.TedbeeraRepository
import com.tedbeera.egypt.data.seed.SeedData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BudgetUiState(
    val amountInput: String = "1500",
    val selectedCategory: BudgetCategoryType = BudgetCategoryType.GROCERIES_WEEK,
    val slicePercentages: List<Int> = listOf(50, 30, 20),
    val currentPlan: BudgetPlan? = null,
    val validationError: String? = null,
    val practicalTips: List<String> = emptyList(),
    val feedbackMessage: String? = null
)

class BudgetViewModel(private val repository: TedbeeraRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(
        BudgetUiState(practicalTips = SeedData.practicalBudgetTips)
    )
    val uiState: StateFlow<BudgetUiState> = _uiState.asStateFlow()

    init {
        recalculatePlan()
    }

    fun onAmountChanged(newText: String) {
        // Strip out non-numeric except decimal
        val clean = newText.filter { it.isDigit() || it == '.' }
        if (clean.count { it == '.' } > 1) return

        _uiState.value = _uiState.value.copy(
            amountInput = clean,
            validationError = null
        )
        recalculatePlan()
    }

    fun onCategorySelected(category: BudgetCategoryType) {
        val defaultPcts = when (category) {
            BudgetCategoryType.GROCERIES_WEEK -> listOf(50, 30, 20)
            BudgetCategoryType.SCHOOL_EXPENSES -> listOf(40, 40, 20)
            BudgetCategoryType.HOME_EMERGENCY -> listOf(45, 35, 20)
        }
        _uiState.value = _uiState.value.copy(
            selectedCategory = category,
            slicePercentages = defaultPcts
        )
        recalculatePlan()
    }

    fun applyPreset(percentages: List<Int>) {
        val normalized = TedbeeraRepository.normalizePercentagesTo100(percentages)
        _uiState.value = _uiState.value.copy(slicePercentages = normalized)
        recalculatePlan()
    }

    fun updatePercentage(index: Int, newPercentage: Int) {
        val current = _uiState.value.slicePercentages
        if (index !in current.indices) return

        val redistributed = TedbeeraRepository.redistributePercentages(
            targetIndex = index,
            newPercentage = newPercentage,
            currentPercentages = current
        )

        _uiState.value = _uiState.value.copy(slicePercentages = redistributed)
        recalculatePlan()
    }

    fun saveCurrentPlan() {
        val plan = _uiState.value.currentPlan ?: return
        viewModelScope.launch {
            repository.saveBudgetPlan(plan)
            _uiState.value = _uiState.value.copy(
                feedbackMessage = "تم حفظ خطة الميزانية في المحفوظات بنجاح"
            )
        }
    }

    fun clearFeedbackMessage() {
        _uiState.value = _uiState.value.copy(feedbackMessage = null)
    }

    private fun recalculatePlan() {
        val raw = _uiState.value.amountInput
        if (raw.isBlank()) {
            _uiState.value = _uiState.value.copy(
                currentPlan = null,
                validationError = "يرجى كتابة المبلغ المتاح بالمصري للبدء"
            )
            return
        }

        val parsed = raw.toDoubleOrNull()
        if (parsed == null || parsed <= 0.0) {
            _uiState.value = _uiState.value.copy(
                currentPlan = null,
                validationError = "المبلغ لازم يكون رقم موجب أكبر من الصفر"
            )
            return
        }

        val plan = repository.calculateBudget(
            category = _uiState.value.selectedCategory,
            totalAmount = parsed,
            customPercentages = _uiState.value.slicePercentages
        )

        _uiState.value = _uiState.value.copy(
            currentPlan = plan,
            validationError = null
        )
    }
}

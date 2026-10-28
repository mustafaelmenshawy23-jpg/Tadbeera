package com.tedbeera.egypt.ui.screens.daily

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tedbeera.egypt.data.local.entity.ChallengeEntity
import com.tedbeera.egypt.data.model.DailyIdea
import com.tedbeera.egypt.data.repository.TedbeeraRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class DailyUiState(
    val selectedCategoryFilter: String? = null,
    val searchQuery: String = "",
    val feedbackMessage: String? = null
)

class DailyViewModel(private val repository: TedbeeraRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(DailyUiState())
    val uiState: StateFlow<DailyUiState> = _uiState.asStateFlow()

    val todayChallenge: StateFlow<ChallengeEntity?> = repository.observeTodayChallenge()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val allIdeas: List<DailyIdea> = repository.getAllDailyIdeas()

    init {
        ensureTodayChallengeInitialized()
    }

    private fun ensureTodayChallengeInitialized() {
        viewModelScope.launch {
            repository.getOrInitTodayChallenge()
        }
    }

    fun toggleChallengeCompletion() {
        val current = todayChallenge.value ?: return
        val newStatus = !current.isCompleted
        viewModelScope.launch {
            repository.toggleChallengeCompletion(current.dateKey, newStatus)
            _uiState.value = _uiState.value.copy(
                feedbackMessage = if (newStatus) "عاش! مبروك إنجاز تحدي النهارده 🎉" else "تم إلغاء تحديد الإنجاز"
            )
        }
    }

    fun onCategoryFilterChanged(category: String?) {
        _uiState.value = _uiState.value.copy(selectedCategoryFilter = category)
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun clearFeedbackMessage() {
        _uiState.value = _uiState.value.copy(feedbackMessage = null)
    }
}

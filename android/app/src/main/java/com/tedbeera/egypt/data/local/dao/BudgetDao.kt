package com.tedbeera.egypt.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tedbeera.egypt.data.local.entity.SavedBudgetEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BudgetDao {
    @Query("SELECT * FROM saved_budgets ORDER BY savedAtTimestamp DESC")
    fun getAllSavedBudgets(): Flow<List<SavedBudgetEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSavedBudget(budget: SavedBudgetEntity): Long

    @Query("DELETE FROM saved_budgets WHERE id = :id")
    suspend fun deleteSavedBudgetById(id: Long)

    @Query("DELETE FROM saved_budgets")
    suspend fun deleteAllSavedBudgets()
}

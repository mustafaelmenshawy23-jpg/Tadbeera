package com.tedbeera.egypt.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_budgets")
data class SavedBudgetEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val categoryName: String,
    val totalAmountEgp: Double,
    val allocationsJson: String,
    val savedAtTimestamp: Long = System.currentTimeMillis()
)

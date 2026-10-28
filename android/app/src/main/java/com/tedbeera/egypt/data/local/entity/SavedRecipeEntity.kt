package com.tedbeera.egypt.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_recipes")
data class SavedRecipeEntity(
    @PrimaryKey
    val recipeId: String,
    val name: String,
    val prepTimeMinutes: Int,
    val budgetCategory: String,
    val estimatedCostEgp: Int,
    val ingredientsJson: String, // Stored as comma-separated or serialized
    val stepsJson: String,
    val savedAtTimestamp: Long = System.currentTimeMillis()
)

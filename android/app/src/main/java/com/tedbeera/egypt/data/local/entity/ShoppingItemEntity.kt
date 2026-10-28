package com.tedbeera.egypt.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "shopping_items")
data class ShoppingItemEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val quantity: String = "1",
    val estimatedUnitPrice: Double = 0.0,
    val isChecked: Boolean = false,
    val addedAtTimestamp: Long = System.currentTimeMillis()
)

package com.tedbeera.egypt.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "daily_challenges",
    indices = [Index(value = ["dateKey"], unique = true)]
)
data class ChallengeEntity(
    @PrimaryKey
    val dateKey: String, // "yyyy-MM-dd"
    val challengeId: String,
    val title: String,
    val description: String,
    val impactTag: String,
    val isCompleted: Boolean = false,
    val completedAtTimestamp: Long? = null
)

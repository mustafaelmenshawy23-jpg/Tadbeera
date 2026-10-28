package com.tedbeera.egypt.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tedbeera.egypt.data.local.entity.ChallengeEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ChallengeDao {
    @Query("SELECT * FROM daily_challenges WHERE dateKey = :dateKey LIMIT 1")
    fun getChallengeForDate(dateKey: String): Flow<ChallengeEntity?>

    @Query("SELECT * FROM daily_challenges WHERE dateKey = :dateKey LIMIT 1")
    suspend fun getChallengeForDateSync(dateKey: String): ChallengeEntity?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertChallengeIfAbsent(challenge: ChallengeEntity): Long

    @Query("UPDATE daily_challenges SET isCompleted = :isCompleted, completedAtTimestamp = :timestamp WHERE dateKey = :dateKey")
    suspend fun updateCompletion(dateKey: String, isCompleted: Boolean, timestamp: Long?)

    @Query("SELECT * FROM daily_challenges WHERE isCompleted = 1 ORDER BY completedAtTimestamp DESC")
    fun getCompletedChallenges(): Flow<List<ChallengeEntity>>

    @Query("DELETE FROM daily_challenges")
    suspend fun deleteAllChallenges()
}

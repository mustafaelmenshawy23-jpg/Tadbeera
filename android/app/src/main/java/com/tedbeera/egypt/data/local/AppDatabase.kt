package com.tedbeera.egypt.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.tedbeera.egypt.data.local.dao.BudgetDao
import com.tedbeera.egypt.data.local.dao.ChallengeDao
import com.tedbeera.egypt.data.local.dao.RecipeDao
import com.tedbeera.egypt.data.local.dao.ShoppingDao
import com.tedbeera.egypt.data.local.entity.ChallengeEntity
import com.tedbeera.egypt.data.local.entity.SavedBudgetEntity
import com.tedbeera.egypt.data.local.entity.SavedRecipeEntity
import com.tedbeera.egypt.data.local.entity.ShoppingItemEntity

@Database(
    entities = [
        SavedRecipeEntity::class,
        SavedBudgetEntity::class,
        ShoppingItemEntity::class,
        ChallengeEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun recipeDao(): RecipeDao
    abstract fun budgetDao(): BudgetDao
    abstract fun shoppingDao(): ShoppingDao
    abstract fun challengeDao(): ChallengeDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "tedbeera_database"
                )
                    // Safe non-destructive behavior
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

package com.tedbeera.egypt.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tedbeera.egypt.data.local.entity.SavedRecipeEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RecipeDao {
    @Query("SELECT * FROM saved_recipes ORDER BY savedAtTimestamp DESC")
    fun getAllSavedRecipes(): Flow<List<SavedRecipeEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM saved_recipes WHERE recipeId = :recipeId)")
    fun isRecipeSaved(recipeId: String): Flow<Boolean>

    @Query("SELECT EXISTS(SELECT 1 FROM saved_recipes WHERE recipeId = :recipeId)")
    suspend fun isRecipeSavedSync(recipeId: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSavedRecipe(recipe: SavedRecipeEntity)

    @Query("DELETE FROM saved_recipes WHERE recipeId = :recipeId")
    suspend fun deleteSavedRecipeById(recipeId: String)

    @Query("DELETE FROM saved_recipes")
    suspend fun deleteAllSavedRecipes()
}

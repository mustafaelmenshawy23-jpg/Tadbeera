package com.tedbeera.egypt

import com.tedbeera.egypt.data.model.Ingredient
import com.tedbeera.egypt.data.model.Recipe
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class IngredientMatchingTest {

    private val sampleRecipe = Recipe(
        id = "test_shakshouka",
        name = "شكشوكة",
        prepTimeMinutes = 15,
        ingredients = listOf(
            Ingredient("بيض", "3"),
            Ingredient("طماطم", "2"),
            Ingredient("بصل", "1")
        ),
        steps = listOf("خطوة 1"),
        budgetCategory = "اقتصادي",
        estimatedCostEgp = 30
    )

    @Test
    fun testPartialMatchDoesNotClaimCompleteMatch() {
        // User has only eggs and onions, missing tomatoes
        val userIngredients = setOf("بيض", "بصل")

        val available = sampleRecipe.ingredients.filter { ing ->
            userIngredients.any { sel -> ing.name.contains(sel) }
        }
        val missing = sampleRecipe.ingredients.filterNot { ing ->
            userIngredients.any { sel -> ing.name.contains(sel) }
        }

        assertEquals(2, available.size)
        assertEquals(1, missing.size)
        assertEquals("طماطم", missing[0].name)
        assertFalse("Must NOT claim complete match when an ingredient is missing", missing.isEmpty())
    }

    @Test
    fun testCompleteMatchWhenAllIngredientsAvailable() {
        val userIngredients = setOf("بيض", "بصل", "طماطم", "بطاطس")

        val missing = sampleRecipe.ingredients.filterNot { ing ->
            userIngredients.any { sel -> ing.name.contains(sel) }
        }

        assertTrue("Should be complete match when all ingredients exist", missing.isEmpty())
    }
}

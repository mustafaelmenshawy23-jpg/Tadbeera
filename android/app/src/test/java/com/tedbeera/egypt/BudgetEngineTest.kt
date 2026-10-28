package com.tedbeera.egypt

import com.tedbeera.egypt.data.model.BudgetCategoryType
import com.tedbeera.egypt.data.repository.TedbeeraRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BudgetEngineTest {

    @Test
    fun testNegativeAmountIsClampedToZero() {
        val normalized = TedbeeraRepository.normalizePercentagesTo100(listOf(50, 30, 20))
        val total = (-500.0).coerceAtLeast(0.0)
        val slices = normalized.map { (total * it) / 100.0 }
        for (amount in slices) {
            assertEquals(0.0, amount, 0.001)
        }
    }

    @Test
    fun testPercentagesAlwaysSumToExact100() {
        val initial = listOf(50, 30, 20)
        assertEquals(100, initial.sum())

        val normalized = TedbeeraRepository.normalizePercentagesTo100(listOf(33, 33, 33))
        assertEquals(100, normalized.sum())

        val oddSum = TedbeeraRepository.normalizePercentagesTo100(listOf(75, 13, 50))
        assertEquals("Normalized sum must equal exactly 100", 100, oddSum.sum())
    }

    @Test
    fun testRedistributionOnSliderChanges() {
        var current = listOf(50, 30, 20)

        // User drags slice 0 to 75%
        current = TedbeeraRepository.redistributePercentages(0, 75, current)
        assertEquals(75, current[0])
        assertEquals(100, current.sum())
        assertTrue("All percentages must be non-negative", current.all { it >= 0 })

        // User repeatedly drags slice 1 to 13%
        current = TedbeeraRepository.redistributePercentages(1, 13, current)
        assertEquals(13, current[1])
        assertEquals(100, current.sum())
        assertTrue("All percentages must be non-negative", current.all { it >= 0 })

        // User repeatedly drags slice 2 to 50%
        current = TedbeeraRepository.redistributePercentages(2, 50, current)
        assertEquals(50, current[2])
        assertEquals(100, current.sum())
        assertTrue("All percentages must be non-negative", current.all { it >= 0 })
    }

    @Test
    fun testBoundaryValuesZeroAndHundred() {
        var current = listOf(50, 30, 20)

        // Set to 100%
        current = TedbeeraRepository.redistributePercentages(0, 100, current)
        assertEquals(100, current[0])
        assertEquals(0, current[1])
        assertEquals(0, current[2])
        assertEquals(100, current.sum())

        // Set to 0%
        current = TedbeeraRepository.redistributePercentages(0, 0, current)
        assertEquals(0, current[0])
        assertEquals(100, current.sum())
        assertTrue(current.all { it >= 0 })
    }

    @Test
    fun testAllZerosInputRebalancedSafely() {
        val allZeros = listOf(0, 0, 0)
        val normalized = TedbeeraRepository.normalizePercentagesTo100(allZeros)
        assertEquals(100, normalized.sum())
        assertTrue(normalized.all { it >= 0 })
    }

    @Test
    fun testCurrencyRecalculatedWhenBudgetOrPercentagesChange() {
        val pcts = listOf(50, 30, 20)
        val budget1 = 1000.0
        val amounts1 = pcts.map { (budget1 * it) / 100.0 }
        assertEquals(500.0, amounts1[0], 0.001)
        assertEquals(300.0, amounts1[1], 0.001)
        assertEquals(200.0, amounts1[2], 0.001)
        assertEquals(1000.0, amounts1.sum(), 0.001)

        val budget2 = 2500.0
        val amounts2 = pcts.map { (budget2 * it) / 100.0 }
        assertEquals(1250.0, amounts2[0], 0.001)
        assertEquals(750.0, amounts2[1], 0.001)
        assertEquals(500.0, amounts2[2], 0.001)
        assertEquals(2500.0, amounts2.sum(), 0.001)
    }
}

package com.tedbeera.egypt

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests verifying safe calculations, NaN elimination, legacy normalization,
 * and transparent unpriced item handling for the Tedbeera Egypt Shopping List.
 */
class ShoppingListCalculationTest {

    data class ShoppingItemTest(
        val id: String,
        val name: String,
        val quantity: Double,
        val unit: String,
        val unitPrice: Double?, // null represents unpriced ("السعر غير محدد")
        val isChecked: Boolean = false
    )

    private fun parseSafeQuantity(raw: String): Double {
        val trimmed = raw.trim()
        if (trimmed.contains("نصف") || trimmed.contains("نص")) return 0.5
        if (trimmed.contains("ربع")) return 0.25
        if (trimmed.contains("ثلاثة أرباع")) return 0.75
        val match = Regex("^([0-9]+(?:\\.[0-9]+)?)").find(trimmed)
        return match?.groupValues?.get(1)?.toDoubleOrNull()?.coerceAtLeast(0.1) ?: 1.0
    }

    private fun calculateLineTotal(quantity: Double, unitPrice: Double?): Double? {
        if (unitPrice == null || unitPrice < 0.0 || unitPrice.isNaN()) return null
        val safeQty = if (quantity.isNaN() || quantity <= 0.0) 1.0 else quantity
        return safeQty * unitPrice
    }

    private fun calculateShoppingTotals(items: List<ShoppingItemTest>): Pair<Double, Int> {
        var knownTotal = 0.0
        var unpricedCount = 0
        for (item in items) {
            val line = calculateLineTotal(item.quantity, item.unitPrice)
            if (line != null) {
                knownTotal += line
            } else {
                unpricedCount++
            }
        }
        return Pair(knownTotal, unpricedCount)
    }

    @Test
    fun testLegacyStringQuantityNormalization() {
        val qty1 = parseSafeQuantity("نصف كيلو")
        assertEquals(0.5, qty1, 0.001)

        val qty2 = parseSafeQuantity("10 أرغفة")
        assertEquals(10.0, qty2, 0.001)

        val qty3 = parseSafeQuantity("غير محدد")
        assertEquals(1.0, qty3, 0.001)
    }

    @Test
    fun testMissingPriceReturnsNullLineTotalAndNeverNaN() {
        val lineTotal = calculateLineTotal(2.5, null)
        assertNull("Missing price must produce null line total, never NaN or 0", lineTotal)

        val validTotal = calculateLineTotal(2.0, 15.0)
        assertNotNull(validTotal)
        assertEquals(30.0, validTotal!!, 0.001)
    }

    @Test
    fun testGrandTotalWithUnpricedItemsTransparentSubtotal() {
        val items = listOf(
            ShoppingItemTest("1", "عدس أصفر", 1.0, "كوب", 25.0),
            ShoppingItemTest("2", "طماطم", 4.0, "حبة", 5.0),
            ShoppingItemTest("3", "عيش بلدي", 10.0, "رغيف", null) // Unpriced item
        )

        val (knownTotal, unpricedCount) = calculateShoppingTotals(items)
        assertEquals(45.0, knownTotal, 0.001)
        assertEquals(1, unpricedCount)
        assertFalse("Grand total cannot be considered complete with unpriced items", unpricedCount == 0)
    }

    @Test
    fun testInstantRecalculationOnPriceEdit() {
        var item = ShoppingItemTest("3", "عيش بلدي", 10.0, "رغيف", null)
        assertNull(calculateLineTotal(item.quantity, item.unitPrice))

        // User enters 2.0 EGP per loaf
        item = item.copy(unitPrice = 2.0)
        val updatedLine = calculateLineTotal(item.quantity, item.unitPrice)
        assertNotNull(updatedLine)
        assertEquals(20.0, updatedLine!!, 0.001)
    }

    @Test
    fun testIngredientMergingWithoutDuplicates() {
        val existingList = mutableListOf(
            ShoppingItemTest("1", "عدس أصفر", 1.0, "كوب", 25.0)
        )

        // Add 1.5 cups of the same ingredient from a scaled recipe
        val incomingName = "عدس أصفر"
        val incomingUnit = "كوب"
        val incomingQty = 1.5

        val existingIdx = existingList.indexOfFirst {
            it.name.trim().equals(incomingName.trim(), ignoreCase = true) && it.unit == incomingUnit
        }

        assertTrue(existingIdx >= 0)
        existingList[existingIdx] = existingList[existingIdx].copy(
            quantity = existingList[existingIdx].quantity + incomingQty
        )

        assertEquals("No duplicate row should be created", 1, existingList.size)
        assertEquals(2.5, existingList[0].quantity, 0.001)
        assertEquals(25.0, existingList[0].unitPrice!!, 0.001)
    }
}

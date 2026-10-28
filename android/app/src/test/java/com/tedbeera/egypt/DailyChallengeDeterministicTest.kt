package com.tedbeera.egypt

import com.tedbeera.egypt.data.seed.SeedData
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class DailyChallengeDeterministicTest {

    @Test
    fun testSameDateKeyAlwaysYieldsSameChallenge() {
        val testDate = "2026-10-25"
        val challenge1 = SeedData.getChallengeForDateKey(testDate)
        val challenge2 = SeedData.getChallengeForDateKey(testDate)

        assertEquals("Same date must yield identical challenge ID", challenge1.id, challenge2.id)
        assertEquals("Same date must yield identical title", challenge1.title, challenge2.title)
    }

    @Test
    fun testMultipleDatesAreMappedToValidPoolChallenges() {
        val dates = listOf("2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27")
        for (date in dates) {
            val challenge = SeedData.getChallengeForDateKey(date)
            assertNotNull(challenge.id)
            assertNotNull(challenge.title)
            assertEquals(date, challenge.dateKey)
        }
    }
}

package com.tedbeera.egypt.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val titleArabic: String, val icon: ImageVector) {
    object Food : Screen("food", "تدبيرة الأكل", Icons.Default.RestaurantMenu)
    object Budget : Screen("budget", "تدبيرة الفلوس", Icons.Default.Payments)
    object Daily : Screen("daily", "تدبيرة اليوم", Icons.Default.Lightbulb)
    object Saved : Screen("saved", "المحفوظات والنواقص", Icons.Default.Bookmark)
}

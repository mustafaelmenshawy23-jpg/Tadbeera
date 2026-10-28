package com.tedbeera.egypt.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import com.tedbeera.egypt.ui.screens.budget.BudgetScreen
import com.tedbeera.egypt.ui.screens.budget.BudgetViewModel
import com.tedbeera.egypt.ui.screens.daily.DailyScreen
import com.tedbeera.egypt.ui.screens.daily.DailyViewModel
import com.tedbeera.egypt.ui.screens.food.FoodScreen
import com.tedbeera.egypt.ui.screens.food.FoodViewModel
import com.tedbeera.egypt.ui.screens.saved.SavedScreen
import com.tedbeera.egypt.ui.screens.saved.SavedViewModel
import com.tedbeera.egypt.ui.theme.PrimaryBlue
import com.tedbeera.egypt.ui.theme.SurfaceWhite
import com.tedbeera.egypt.ui.theme.TextSecondary

@Composable
fun TedbeeraNavHost(
    navController: NavHostController,
    foodViewModel: FoodViewModel,
    budgetViewModel: BudgetViewModel,
    dailyViewModel: DailyViewModel,
    savedViewModel: SavedViewModel,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Food.route,
        modifier = modifier
    ) {
        composable(Screen.Food.route) {
            FoodScreen(viewModel = foodViewModel)
        }
        composable(Screen.Budget.route) {
            BudgetScreen(viewModel = budgetViewModel)
        }
        composable(Screen.Daily.route) {
            DailyScreen(viewModel = dailyViewModel)
        }
        composable(Screen.Saved.route) {
            SavedScreen(viewModel = savedViewModel)
        }
    }
}

@Composable
fun TedbeeraBottomBar(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val items = listOf(
        Screen.Food,
        Screen.Budget,
        Screen.Daily,
        Screen.Saved
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    NavigationBar(
        modifier = modifier,
        containerColor = SurfaceWhite,
        contentColor = PrimaryBlue
    ) {
        items.forEach { screen ->
            val isSelected = currentRoute == screen.route
            NavigationBarItem(
                icon = { Icon(screen.icon, contentDescription = screen.titleArabic) },
                label = {
                    Text(
                        text = screen.titleArabic,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                },
                selected = isSelected,
                onClick = {
                    if (currentRoute != screen.route) {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryBlue,
                    selectedTextColor = PrimaryBlue,
                    indicatorColor = PrimaryBlue.copy(alpha = 0.12f),
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary
                )
            )
        }
    }
}

package com.tedbeera.egypt

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.rememberNavController
import com.tedbeera.egypt.ui.navigation.TedbeeraBottomBar
import com.tedbeera.egypt.ui.navigation.TedbeeraNavHost
import com.tedbeera.egypt.ui.screens.budget.BudgetViewModel
import com.tedbeera.egypt.ui.screens.daily.DailyViewModel
import com.tedbeera.egypt.ui.screens.food.FoodViewModel
import com.tedbeera.egypt.ui.screens.saved.SavedViewModel
import com.tedbeera.egypt.ui.theme.LightBackground
import com.tedbeera.egypt.ui.theme.PrimaryBlue
import com.tedbeera.egypt.ui.theme.SurfaceWhite
import com.tedbeera.egypt.ui.theme.TedbeeraEgyptTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as TedbeeraApp
        val repository = app.repository

        val factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return when {
                    modelClass.isAssignableFrom(FoodViewModel::class.java) ->
                        FoodViewModel(repository) as T
                    modelClass.isAssignableFrom(BudgetViewModel::class.java) ->
                        BudgetViewModel(repository) as T
                    modelClass.isAssignableFrom(DailyViewModel::class.java) ->
                        DailyViewModel(repository) as T
                    modelClass.isAssignableFrom(SavedViewModel::class.java) ->
                        SavedViewModel(repository) as T
                    else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
                }
            }
        }

        val viewModelProvider = ViewModelProvider(this, factory)
        val foodViewModel = viewModelProvider[FoodViewModel::class.java]
        val budgetViewModel = viewModelProvider[BudgetViewModel::class.java]
        val dailyViewModel = viewModelProvider[DailyViewModel::class.java]
        val savedViewModel = viewModelProvider[SavedViewModel::class.java]

        setContent {
            TedbeeraEgyptTheme {
                MainAppScaffold(
                    foodViewModel = foodViewModel,
                    budgetViewModel = budgetViewModel,
                    dailyViewModel = dailyViewModel,
                    savedViewModel = savedViewModel
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScaffold(
    foodViewModel: FoodViewModel,
    budgetViewModel: BudgetViewModel,
    dailyViewModel: DailyViewModel,
    savedViewModel: SavedViewModel
) {
    val navController = rememberNavController()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "تدبيرة – Tedbeera Egypt",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = SurfaceWhite
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = PrimaryBlue,
                    titleContentColor = SurfaceWhite
                )
            )
        },
        bottomBar = {
            Column {
                com.tedbeera.egypt.ui.components.AdMobBanner(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
                TedbeeraBottomBar(navController = navController)
            }
        },
        containerColor = LightBackground
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            TedbeeraNavHost(
                navController = navController,
                foodViewModel = foodViewModel,
                budgetViewModel = budgetViewModel,
                dailyViewModel = dailyViewModel,
                savedViewModel = savedViewModel
            )
        }
    }
}

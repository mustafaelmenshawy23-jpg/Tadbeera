package com.tedbeera.egypt.ui.screens.food

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tedbeera.egypt.data.model.Recipe
import com.tedbeera.egypt.data.model.RecipeMatchResult
import com.tedbeera.egypt.ui.components.EmptyStateCard
import com.tedbeera.egypt.ui.components.PracticalDisclaimerCard
import com.tedbeera.egypt.ui.components.SectionHeader
import com.tedbeera.egypt.ui.theme.*

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun FoodScreen(
    viewModel: FoodViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val savedIds by viewModel.savedRecipeIds.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.userFeedbackMessage) {
        uiState.userFeedbackMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearFeedbackMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = LightBackground
    ) { paddingValues ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SectionHeader(
                    title = "تدبيرة الأكل 🍲",
                    subtitle = "علّم على المكونات الموجودة في مطبخك وهنقولك تطبخ إيه حالا بدون تكاليف إضافية."
                )
            }

            // Ingredient Selector Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "مكونات متوفرة عندك (${uiState.selectedIngredients.size})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryBlue
                            )
                            if (uiState.selectedIngredients.isNotEmpty()) {
                                TextButton(onClick = { viewModel.clearSelectedIngredients() }) {
                                    Text("مسح التحديد", color = AlertRed, fontSize = 13.sp)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // FlowRow of 13 Egyptian ingredients
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            uiState.availableIngredients.forEach { ingredient ->
                                val isSelected = uiState.selectedIngredients.contains(ingredient)
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { viewModel.toggleIngredient(ingredient) },
                                    label = {
                                        Text(
                                            text = ingredient,
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                            )
                                        )
                                    },
                                    leadingIcon = if (isSelected) {
                                        {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp),
                                                tint = SurfaceWhite
                                            )
                                        }
                                    } else null,
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = PrimaryBlue,
                                        selectedLabelColor = SurfaceWhite,
                                        containerColor = SurfaceVariant,
                                        labelColor = TextPrimary
                                    ),
                                    shape = RoundedCornerShape(20.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Smart Filter Chips
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "فلاتر ذكية سريعة:",
                        style = MaterialTheme.typography.labelLarge,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        item {
                            FilterChip(
                                selected = uiState.isVeryBudgetFilter,
                                onClick = { viewModel.toggleVeryBudgetFilter() },
                                label = { Text("💰 اقتصادي جداً") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AccentYellow,
                                    selectedLabelColor = TextPrimary
                                )
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.isQuickFilter,
                                onClick = { viewModel.toggleQuickFilter() },
                                label = { Text("⚡ أقل من 20 دقيقة") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AccentYellow,
                                    selectedLabelColor = TextPrimary
                                )
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.usesLeftoversFilter,
                                onClick = { viewModel.toggleLeftoversFilter() },
                                label = { Text("♻️ استغلال بواقي الأكل") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AccentYellow,
                                    selectedLabelColor = TextPrimary
                                )
                            )
                        }
                    }
                }
            }

            // Results Counter & Disclaimer
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "الوصفات المقترحة (${uiState.matchedRecipes.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "تكلفة تقديرية وغير ملزمة",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                        color = TextSecondary
                    )
                }
            }

            // Recipe List
            if (uiState.matchedRecipes.isEmpty()) {
                item {
                    EmptyStateCard(
                        title = "مفيش وصفات مطابقة للفلاتر دي",
                        description = "جرب تلغي بعض الفلاتر أو تختار مكونات أكتر متوفرة في بيتك لعرض أفكار أكلات متنوعة.",
                        icon = Icons.Default.SearchOff
                    )
                }
            } else {
                items(uiState.matchedRecipes) { matchResult ->
                    val isSaved = savedIds.contains(matchResult.recipe.id)
                    RecipeCard(
                        matchResult = matchResult,
                        isSaved = isSaved,
                        onCardClick = { viewModel.selectRecipeForDetails(matchResult.recipe) },
                        onSaveToggle = { viewModel.toggleSaveRecipe(matchResult.recipe, isSaved) },
                        onAddMissing = { viewModel.addMissingToShoppingList(matchResult.missingIngredients) }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Recipe Details Dialog
    uiState.selectedRecipeDetails?.let { recipe ->
        RecipeDetailsDialog(
            recipe = recipe,
            onDismiss = { viewModel.selectRecipeForDetails(null) },
            onAddMissing = {
                val match = uiState.matchedRecipes.find { it.recipe.id == recipe.id }
                match?.let { viewModel.addMissingToShoppingList(it.missingIngredients) }
            }
        )
    }
}

@Composable
fun RecipeCard(
    matchResult: RecipeMatchResult,
    isSaved: Boolean,
    onCardClick: () -> Unit,
    onSaveToggle: () -> Unit,
    onAddMissing: () -> Unit
) {
    val recipe = matchResult.recipe

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCardClick() },
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Title & Bookmark
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = recipe.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "⏱️ ${recipe.prepTimeMinutes} دقيقة",
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                            color = TextSecondary
                        )
                        Text(
                            text = "•",
                            color = TextSecondary
                        )
                        Surface(
                            color = SoftHighlight.copy(alpha = 0.45f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "🏷️ تكلفة تقديرية: ~${recipe.estimatedCostEgp} ج.م",
                                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                                color = PrimaryBlueDark,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = "سعر تقريبي يختلف حسب تاريخ الشراء والمنطقة",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp),
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                IconButton(onClick = onSaveToggle) {
                    Icon(
                        imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                        contentDescription = "حفظ الوجبة",
                        tint = if (isSaved) PrimaryBlue else TextSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Ingredient match status badge
            if (matchResult.isCompleteMatch) {
                Surface(
                    color = SuccessGreenLight,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = SuccessGreen,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "جاهزة بالكامل بمكوناتك الحالية!",
                            color = SuccessGreen,
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            } else {
                Surface(
                    color = SoftHighlight.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.ShoppingCart,
                            contentDescription = null,
                            tint = PrimaryBlueDark,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "متوفر ${matchResult.availableCount} من ${matchResult.totalCount} مكونات (ناقصك ${matchResult.missingIngredients.size})",
                            color = PrimaryBlueDark,
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Actions row: Add missing ingredients
            if (matchResult.missingIngredients.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "النواقص: " + matchResult.missingIngredients.take(2).joinToString("، ") { it.name } +
                                if (matchResult.missingIngredients.size > 2) "..." else "",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                        color = TextSecondary,
                        modifier = Modifier.weight(1f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    OutlinedButton(
                        onClick = onAddMissing,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AddShoppingCart,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("إضافة النواقص", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun RecipeDetailsDialog(
    recipe: Recipe,
    onDismiss: () -> Unit,
    onAddMissing: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = recipe.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = PrimaryBlue
            )
        },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text("⏱️ وقت التحضير: ${recipe.prepTimeMinutes} دقيقة", fontSize = 13.sp)
                        Text("🏷️ التكلفة: ~${recipe.estimatedCostEgp} ج.م", fontSize = 13.sp, color = PrimaryBlue)
                    }
                    Text(
                        text = "التكلفة تقديرية استرشادية وغير ملزمة وفق أسعار السوق المعتادة.",
                        fontSize = 11.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Divider(color = BorderLight)
                }

                item {
                    Text(
                        text = "المكونات المطلوبة:",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(recipe.ingredients) { ing ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("• ${ing.name}", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        Text(ing.quantity, color = TextSecondary, fontSize = 14.sp)
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Divider(color = BorderLight)
                    Text(
                        text = "خطوات التحضير:",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(recipe.steps.indices.toList()) { index ->
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "${index + 1}. ",
                            fontWeight = FontWeight.Bold,
                            color = PrimaryBlue,
                            fontSize = 14.sp
                        )
                        Text(
                            text = recipe.steps[index],
                            fontSize = 14.sp,
                            lineHeight = 22.sp,
                            color = TextPrimary
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
            ) {
                Text("تمام، فهمت")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = {
                onAddMissing()
                onDismiss()
            }) {
                Text("إضافة النواقص للنوتة")
            }
        }
    )
}

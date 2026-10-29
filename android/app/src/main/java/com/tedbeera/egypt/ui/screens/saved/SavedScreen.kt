package com.tedbeera.egypt.ui.screens.saved

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tedbeera.egypt.data.local.entity.SavedBudgetEntity
import com.tedbeera.egypt.data.local.entity.SavedRecipeEntity
import com.tedbeera.egypt.data.local.entity.ShoppingItemEntity
import com.tedbeera.egypt.ui.components.EmptyStateCard
import com.tedbeera.egypt.ui.components.SectionHeader
import com.tedbeera.egypt.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SavedScreen(
    viewModel: SavedViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val savedRecipes by viewModel.savedRecipes.collectAsState()
    val savedBudgets by viewModel.savedBudgets.collectAsState()
    val shoppingItems by viewModel.shoppingItems.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.feedbackMessage) {
        uiState.feedbackMessage?.let {
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
                    title = "المحفوظات والنواقص 📋",
                    subtitle = "كل وصفاتك المحفوظة، خطط الميزانية، وقائمة طلبات السوق في مكان واحد أوفلاين."
                )
            }

            // Tab Navigation Row
            item {
                TabRow(
                    selectedTabIndex = uiState.currentTab.ordinal,
                    containerColor = SurfaceWhite,
                    contentColor = PrimaryBlue,
                    indicator = { tabPositions ->
                        if (uiState.currentTab.ordinal < tabPositions.size) {
                            TabRowDefaults.SecondaryIndicator(
                                modifier = Modifier.tabIndicatorOffset(tabPositions[uiState.currentTab.ordinal]),
                                color = PrimaryBlue
                            )
                        }
                    }
                ) {
                    SavedTab.values().forEach { tab ->
                        val count = when (tab) {
                            SavedTab.RECIPES -> savedRecipes.size
                            SavedTab.BUDGETS -> savedBudgets.size
                            SavedTab.SHOPPING -> shoppingItems.size
                        }
                        Tab(
                            selected = uiState.currentTab == tab,
                            onClick = { viewModel.selectTab(tab) },
                            text = {
                                Text(
                                    text = "${tab.titleArabic} ($count)",
                                    fontWeight = if (uiState.currentTab == tab) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 13.sp
                                )
                            }
                        )
                    }
                }
            }

            // TAB CONTENT
            when (uiState.currentTab) {
                SavedTab.SHOPPING -> {
                    // Shopping List Tab
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(14.dp)
                                    .fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val totalCost = shoppingItems.sumOf { it.estimatedUnitPrice }
                                Column {
                                    Text(
                                        text = "إجمالي التكلفة المتوقعة:",
                                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                                        color = TextSecondary
                                    )
                                    Text(
                                        text = "${totalCost.toInt()} ج.م تقريباً",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryBlue
                                    )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    if (shoppingItems.any { it.isChecked }) {
                                        OutlinedButton(
                                            onClick = { viewModel.clearCheckedShoppingItems() },
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Text("مسح المكتمل", fontSize = 12.sp, color = TextSecondary)
                                        }
                                    }
                                    Button(
                                        onClick = { viewModel.openAddItemDialog(true) },
                                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("إضافة طلب", fontSize = 13.sp)
                                    }
                                }
                            }
                        }
                    }

                    if (shoppingItems.isEmpty()) {
                        item {
                            EmptyStateCard(
                                title = "لا توجد نواقص حالياً.. دولاب خزينك تمام!",
                                description = "تقدر تضيف طلبات بالضغط على زر 'إضافة طلب' أو من أي وصفة تختارها في تدبيرة الأكل.",
                                icon = Icons.Default.ShoppingCart
                            )
                        }
                    } else {
                        items(shoppingItems, key = { it.id }) { item ->
                            ShoppingItemRow(
                                item = item,
                                onToggle = { viewModel.toggleShoppingItem(item.id, !item.isChecked) },
                                onDelete = { viewModel.deleteShoppingItem(item.id) }
                            )
                        }
                    }
                }

                SavedTab.RECIPES -> {
                    if (savedRecipes.isEmpty()) {
                        item {
                            EmptyStateCard(
                                title = "لسه مفيش عناصر محفوظة.. احفظ اللي يعجبك وارجع له وقت ما تحتاجه.",
                                description = "اضغط على علامة الحفظ في أي وصفة من تدبيرة الأكل للرجوع ليها بدون نت.",
                                icon = Icons.Default.BookmarkBorder
                            )
                        }
                    } else {
                        items(savedRecipes, key = { it.recipeId }) { saved ->
                            SavedRecipeRow(
                                recipe = saved,
                                onDelete = { viewModel.removeSavedRecipe(saved.recipeId) }
                            )
                        }
                    }
                }

                SavedTab.BUDGETS -> {
                    if (savedBudgets.isEmpty()) {
                        item {
                            EmptyStateCard(
                                title = "لسه مفيش عناصر محفوظة.. احفظ اللي يعجبك وارجع له وقت ما تحتاجه.",
                                description = "قسّم ميزانيتك في تدبيرة الفلوس واضغط 'حفظ الخطة' للرجوع ليها في أي وقت.",
                                icon = Icons.Default.Savings
                            )
                        }
                    } else {
                        items(savedBudgets, key = { it.id }) { budget ->
                            SavedBudgetRow(
                                budget = budget,
                                onDelete = { viewModel.removeSavedBudget(budget.id) }
                            )
                        }
                    }
                }
            }

            // PRIVACY CONTROL SECTION
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Divider(color = BorderLight)
                Spacer(modifier = Modifier.height(8.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = AlertRedLight.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "🔒 الخصوصية ومسح البيانات",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = AlertRed
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "جميع بياناتك محفوظة محلياً على جهازك فقط ولا يتم إرسالها لأي خادم. مسح البيانات سيحذف كل المحفوظات والتحديات نهائياً.",
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedButton(
                            onClick = { viewModel.openClearAllDataDialog(true) },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AlertRed),
                            border = androidx.compose.foundation.BorderStroke(1.dp, AlertRed),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.DeleteForever, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("مسح جميع بيانات التطبيق", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Add Shopping Item Dialog
    if (uiState.isAddItemDialogOpen) {
        AddShoppingItemDialog(
            onDismiss = { viewModel.openAddItemDialog(false) },
            onConfirm = { name, qty, price ->
                viewModel.addShoppingItem(name, qty, price)
            }
        )
    }

    // Clear All Application Data Confirmation Dialog
    if (uiState.isClearAllDataDialogOpen) {
        AlertDialog(
            onDismissRequest = { viewModel.openClearAllDataDialog(false) },
            icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = AlertRed) },
            title = {
                Text(
                    text = "مسح جميع بيانات التطبيق؟",
                    fontWeight = FontWeight.Bold,
                    color = AlertRed
                )
            },
            text = {
                Text(
                    text = "هذا الإجراء سيقوم بحذف جميع الوجبات المحفوظة، خطط الميزانية، وتحديات الأيام وقوائم النواقص نهائياً من ذاكرة جهازك. لا يمكن التراجع عن هذا الإجراء.",
                    style = MaterialTheme.typography.bodyMedium,
                    lineHeight = 22.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.confirmClearAllData() },
                    colors = ButtonDefaults.buttonColors(containerColor = AlertRed)
                ) {
                    Text("مسح جميع البيانات")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { viewModel.openClearAllDataDialog(false) }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun ShoppingItemRow(
    item: ShoppingItemEntity,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Checkbox(
                    checked = item.isChecked,
                    onCheckedChange = { onToggle() },
                    colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = item.name,
                        style = MaterialTheme.typography.bodyLarge.copy(
                            textDecoration = if (item.isChecked) TextDecoration.LineThrough else TextDecoration.None
                        ),
                        fontWeight = FontWeight.Medium,
                        color = if (item.isChecked) TextSecondary else TextPrimary
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "الكمية: ${item.quantity}",
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                            color = TextSecondary
                        )
                        if (item.estimatedUnitPrice > 0.0) {
                            Text(
                                text = "• ~${item.estimatedUnitPrice.toInt()} ج.م",
                                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                                color = PrimaryBlue
                            )
                        }
                    }
                }
            }

            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "حذف العنصر",
                    tint = TextSecondary
                )
            }
        }
    }
}

@Composable
fun SavedRecipeRow(
    recipe: SavedRecipeEntity,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(14.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = recipe.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "⏱️ ${recipe.prepTimeMinutes} دقيقة • 🏷️ تكلفة تقديرية: ~${recipe.estimatedCostEgp} ج.م",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = PrimaryBlueDark,
                    fontWeight = FontWeight.Medium
                )
            }

            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "إزالة من المحفوظات",
                    tint = AlertRed
                )
            }
        }
    }
}

@Composable
fun SavedBudgetRow(
    budget: SavedBudgetEntity,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = budget.categoryName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryBlue
                    )
                    Text(
                        text = "المبلغ: ${budget.totalAmountEgp.toInt()} ج.م",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                        fontWeight = FontWeight.SemiBold
                    )
                }

                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.DeleteOutline,
                        contentDescription = "حذف الخطة",
                        tint = AlertRed
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Allocations breakdown from saved string
            val slices = budget.allocationsJson.split(";").filter { it.isNotBlank() }
            slices.forEach { sliceStr ->
                val parts = sliceStr.split(":")
                if (parts.size >= 3) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(parts[0], fontSize = 12.sp, color = TextPrimary)
                        Text("${parts[1]}% (${parts[2].toDoubleOrNull()?.toInt() ?: 0} ج.م)", fontSize = 12.sp, color = TextSecondary)
                    }
                }
            }
        }
    }
}

@Composable
fun AddShoppingItemDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, quantity: String, price: Double) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("1") }
    var priceInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "إضافة طلب جديد لقائمة النواقص",
                fontWeight = FontWeight.Bold,
                color = PrimaryBlue,
                fontSize = 16.sp
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        errorMessage = null
                    },
                    label = { Text("اسم الصنف (مثال: جبنة قريش)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = { Text("الكمية (مثال: نصف كيلو أو 2 كيس)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = priceInput,
                    onValueChange = { priceInput = it.filter { ch -> ch.isDigit() || ch == '.' } },
                    label = { Text("سعر تقديري بالجنيه (اختياري)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                if (errorMessage != null) {
                    Text(errorMessage!!, color = AlertRed, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isBlank()) {
                        errorMessage = "يرجى كتابة اسم الصنف"
                    } else {
                        val parsedPrice = priceInput.toDoubleOrNull() ?: 0.0
                        onConfirm(name, quantity, parsedPrice)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
            ) {
                Text("إضافة")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("إلغاء")
            }
        }
    )
}

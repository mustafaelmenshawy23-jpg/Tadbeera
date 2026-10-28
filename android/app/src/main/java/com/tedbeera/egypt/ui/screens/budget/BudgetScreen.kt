package com.tedbeera.egypt.ui.screens.budget

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tedbeera.egypt.data.model.BudgetCategoryType
import com.tedbeera.egypt.ui.components.PracticalDisclaimerCard
import com.tedbeera.egypt.ui.components.SectionHeader
import com.tedbeera.egypt.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BudgetScreen(
    viewModel: BudgetViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
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
                    title = "تدبيرة الفلوس 💵",
                    subtitle = "قسّم ميزانيتك بمرونة وواقعية، واعرف كل بند محتاج كام بالجنيه المصري عشان مفيش حاجة تزنقك."
                )
            }

            // Input Card: Amount & Category
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "المبلغ المتاح للتخطيط:",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = uiState.amountInput,
                            onValueChange = { viewModel.onAmountChanged(it) },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("مثال: 1500") },
                            trailingIcon = {
                                Text(
                                    text = "ج.م",
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryBlue,
                                    modifier = Modifier.padding(horizontal = 12.dp)
                                )
                            },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            isError = uiState.validationError != null,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PrimaryBlue,
                                unfocusedBorderColor = BorderLight
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )

                        if (uiState.validationError != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = uiState.validationError!!,
                                color = AlertRed,
                                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "نوع التدبيرة المطلوبة:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            BudgetCategoryType.values().forEach { cat ->
                                val isSelected = uiState.selectedCategory == cat
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { viewModel.onCategorySelected(cat) },
                                    label = { Text(cat.titleArabic, fontSize = 13.sp) },
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

            // Required Disclaimer Banner
            item {
                PracticalDisclaimerCard(
                    text = "حسبة استرشادية لمساعدتك في الترتيب وليست استشارة مالية ملزمة. تقدر تعدل النسب حسب ظروف بيتك."
                )
            }

            // Calculated Slices Breakdown
            uiState.currentPlan?.let { plan ->
                // Preset Selection Chips
                item {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "نماذج توزيع مقترحة وسريعة:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextSecondary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            val presets = when (uiState.selectedCategory) {
                                BudgetCategoryType.GROCERIES_WEEK -> listOf(
                                    "متوازن" to listOf(50, 30, 20),
                                    "توفير أقصى" to listOf(60, 25, 15),
                                    "طازج وخضار" to listOf(40, 45, 15)
                                )
                                BudgetCategoryType.SCHOOL_EXPENSES -> listOf(
                                    "متوازن" to listOf(40, 40, 20),
                                    "بداية العام" to listOf(55, 30, 15),
                                    "تغذية يومية" to listOf(25, 55, 20)
                                )
                                BudgetCategoryType.HOME_EMERGENCY -> listOf(
                                    "متوازن" to listOf(45, 35, 20),
                                    "طبي وصحي" to listOf(30, 50, 20),
                                    "صيانة منزلية" to listOf(55, 25, 20)
                                )
                            }

                            presets.forEach { (label, pcts) ->
                                val isSelected = uiState.slicePercentages == pcts
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { viewModel.applyPreset(pcts) },
                                    label = { Text(label, fontSize = 12.sp) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = AccentYellow,
                                        selectedLabelColor = TextPrimary,
                                        containerColor = SurfaceWhite,
                                        labelColor = TextPrimary
                                    )
                                )
                            }
                        }
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "التقسيمة المقترحة (الإجمالي: ${plan.totalAmount.toInt()} ج.م):",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Surface(
                            color = SuccessGreenLight,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "✅ الإجمالي: 100%",
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                items(plan.slices.indices.toList()) { index ->
                    val slice = plan.slices[index]
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        shape = RoundedCornerShape(14.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        color = if (index == 0) PrimaryBlue else if (index == 1) AccentYellow else SoftHighlight,
                                        modifier = Modifier.size(12.dp),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {}
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = slice.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                }
                                Surface(
                                    color = SurfaceVariant,
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = "${slice.percentage}%",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryBlue,
                                        fontSize = 13.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "${slice.calculatedAmount.toInt()} جنيه مصري",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold,
                                color = PrimaryBlue
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = slice.practicalTip,
                                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                                color = TextSecondary,
                                lineHeight = 18.sp
                            )

                            // Percentage Steppers & Synchronized Slider
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                OutlinedButton(
                                    onClick = { viewModel.updatePercentage(index, (slice.percentage - 5).coerceAtLeast(0)) },
                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("-5%", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                Slider(
                                    value = slice.percentage.toFloat(),
                                    onValueChange = { viewModel.updatePercentage(index, it.toInt()) },
                                    valueRange = 0f..100f,
                                    modifier = Modifier.weight(1f),
                                    colors = SliderDefaults.colors(
                                        thumbColor = PrimaryBlue,
                                        activeTrackColor = PrimaryBlue
                                    )
                                )

                                OutlinedButton(
                                    onClick = { viewModel.updatePercentage(index, (slice.percentage + 5).coerceAtMost(100)) },
                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("+5%", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Save Plan Action
                item {
                    Button(
                        onClick = { viewModel.saveCurrentPlan() },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.BookmarkAdd, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "حفظ خطة الميزانية في المحفوظات",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }
            }

            // Practical Egyptian Saving Strategies
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Savings, contentDescription = null, tint = AccentYellow)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "وصايا تدبيرة لمصروف البيت المصري:",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        uiState.practicalTips.forEach { tip ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Text("💡 ", fontSize = 13.sp)
                                Text(
                                    text = tip,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                                    color = TextPrimary,
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

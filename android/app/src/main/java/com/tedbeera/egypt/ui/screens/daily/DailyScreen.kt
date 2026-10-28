package com.tedbeera.egypt.ui.screens.daily

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tedbeera.egypt.data.local.entity.ChallengeEntity
import com.tedbeera.egypt.data.model.DailyIdea
import com.tedbeera.egypt.ui.components.EmptyStateCard
import com.tedbeera.egypt.ui.components.SectionHeader
import com.tedbeera.egypt.ui.components.ShareUtils
import com.tedbeera.egypt.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyScreen(
    viewModel: DailyViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val todayChallenge by viewModel.todayChallenge.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    val categories = listOf(
        "الكل",
        "تقليل الهدر وإعادة الاستخدام",
        "تنظيم وصيانة المنزل",
        "أنشطة عائلية مجانية",
        "تنظيم المذاكرة والمهام"
    )

    val filteredIdeas = remember(uiState.selectedCategoryFilter, uiState.searchQuery) {
        viewModel.allIdeas.filter { idea ->
            val matchesCat = uiState.selectedCategoryFilter == null ||
                    uiState.selectedCategoryFilter == "الكل" ||
                    idea.category == uiState.selectedCategoryFilter
            val matchesSearch = uiState.searchQuery.isBlank() ||
                    idea.title.contains(uiState.searchQuery, ignoreCase = true) ||
                    idea.description.contains(uiState.searchQuery, ignoreCase = true)
            matchesCat && matchesSearch
        }
    }

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
                    title = "تدبيرة اليوم 💡",
                    subtitle = "أفكار عملية وتحدي يومي بسيط يصنع فرق كبير في بيتك وميزانيتك."
                )
            }

            // Signature Feature: تدبيرتك النهارده
            item {
                todayChallenge?.let { challenge ->
                    DailyChallengeCard(
                        challenge = challenge,
                        onToggleCompletion = { viewModel.toggleChallengeCompletion() },
                        onShare = { ShareUtils.shareDailyChallengeAchievement(context, challenge.title) }
                    )
                }
            }

            // Search Bar & Filter Chips
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = uiState.searchQuery,
                        onValueChange = { viewModel.onSearchQueryChanged(it) },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("ابحث في أفكار التوفير والمنزل...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryBlue,
                            unfocusedBorderColor = BorderLight
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(categories) { cat ->
                            val isSelected = (cat == "الكل" && uiState.selectedCategoryFilter == null) ||
                                    uiState.selectedCategoryFilter == cat
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    viewModel.onCategoryFilterChanged(if (cat == "الكل") null else cat)
                                },
                                label = { Text(cat, fontSize = 12.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = PrimaryBlue,
                                    selectedLabelColor = SurfaceWhite,
                                    containerColor = SurfaceWhite,
                                    labelColor = TextPrimary
                                )
                            )
                        }
                    }
                }
            }

            // List of Curated Ideas
            if (filteredIdeas.isEmpty()) {
                item {
                    EmptyStateCard(
                        title = "مفيش أفكار مطابقة للبحث",
                        description = "جرب كلمات بحث تانية أو اختر كل التصنيفات لمشاهدة جميع الأفكار العملية.",
                        icon = Icons.Default.LightbulbOutline
                    )
                }
            } else {
                items(filteredIdeas) { idea ->
                    DailyIdeaCard(idea = idea)
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun DailyChallengeCard(
    challenge: ChallengeEntity,
    onToggleCompletion: () -> Unit,
    onShare: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (challenge.isCompleted) SuccessGreenLight else SoftHighlight.copy(alpha = 0.35f)
        ),
        shape = RoundedCornerShape(18.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(
                if (challenge.isCompleted) SuccessGreen else AccentYellow
            )
        )
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = if (challenge.isCompleted) SuccessGreen else PrimaryBlue,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = if (challenge.isCompleted) "تم إنجاز تحدي اليوم! 🎉" else "🎯 تدبيرتك النهارده",
                        color = SurfaceWhite,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }

                Text(
                    text = challenge.dateKey,
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = TextSecondary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = challenge.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = challenge.description,
                style = MaterialTheme.typography.bodyMedium,
                color = TextPrimary,
                lineHeight = 22.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Action row: Toggle complete + Share
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(vertical = 4.dp)
                ) {
                    Checkbox(
                        checked = challenge.isCompleted,
                        onCheckedChange = { onToggleCompletion() },
                        colors = CheckboxDefaults.colors(checkedColor = SuccessGreen)
                    )
                    Text(
                        text = if (challenge.isCompleted) "أنجزت التحدي بنجاح" else "علّم كـ مُنجز",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (challenge.isCompleted) SuccessGreen else TextPrimary
                    )
                }

                IconButton(onClick = onShare) {
                    Icon(
                        imageVector = Icons.Default.Share,
                        contentDescription = "مشاركة الإنجاز",
                        tint = PrimaryBlue
                    )
                }
            }
        }
    }
}

@Composable
fun DailyIdeaCard(idea: DailyIdea) {
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
                Surface(
                    color = SurfaceVariant,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = idea.category,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp),
                        color = TextSecondary
                    )
                }
                Text(
                    text = "⏱️ ${idea.timeRequired}",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = TextSecondary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = idea.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = idea.description,
                style = MaterialTheme.typography.bodyMedium,
                color = TextPrimary,
                lineHeight = 22.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Surface(
                color = LightBackground,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("💡", fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = idea.practicalTip,
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                        color = PrimaryBlueDark,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

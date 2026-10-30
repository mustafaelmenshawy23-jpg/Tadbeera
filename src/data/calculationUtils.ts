import { BudgetCategoryDef, ExpenseRecord, DEFAULT_BUDGET_CATEGORIES } from './seedData';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number | null; // null represents unpriced item ("السعر غير محدد")
  isChecked: boolean;
}

export interface ShoppingTotals {
  knownTotal: number;
  pendingKnownTotal: number;
  purchasedKnownTotal: number;
  unpricedCount: number;
  totalItems: number;
  isFullyPriced: boolean;
  allUnpriced: boolean;
}

export interface WhatsAppShoppingShareResult {
  message: string;
  unpurchasedCount: number;
  unpricedCount: number;
  knownTotal: number;
  isEmpty: boolean;
}

export interface TedbeeraBackupData {
  familySize: number;
  budgetAmount: string;
  categories: BudgetCategoryDef[];
  categoryPercentages: number[];
  expenses: ExpenseRecord[];
  shoppingItems: ShoppingItem[];
  savedRecipeIds: string[];
  savedTipIds: string[];
  savedBudgets: any[];
  selectedIngredients: string[];
  dailyCompleted?: Record<string, boolean>;
  triedTipIds?: string[];
  paydayDay?: number | null;
  weeklyPlanUnlocked?: boolean;
  reminderEnabled?: boolean;
  householdProfile?: Record<string, unknown> | null;
  inventoryItems?: Record<string, unknown>[];
  householdTasks?: Record<string, unknown>[];
  savingsGoals?: Record<string, unknown>[];
}

export const REWARD_PLAN_STORAGE_KEY = 'tedbeera_phase4d_weekly_plan_unlocked';
export const REMINDER_STORAGE_KEY = 'tedbeera_phase4d_reminder_enabled';

export interface TedbeeraBackupPayload {
  app: string;
  backupVersion: number;
  exportedAt: string;
  data: TedbeeraBackupData;
}

/**
 * Parses any quantity representation into a safe, positive number.
 * Gracefully handles legacy strings like "نصف كيلو", "10 أرغفة", "2", numbers, or null/undefined.
 */
export function parseSafeQuantity(val: unknown): number {
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val) || val <= 0) return 1;
    return Math.round(val * 100) / 100;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 1;

    // Common Arabic fraction expressions
    if (trimmed.includes('نصف') || trimmed.includes('نص')) return 0.5;
    if (trimmed.includes('ربع')) return 0.25;
    if (trimmed.includes('ثلاثة أرباع') || trimmed.includes('تلات أرباع')) return 0.75;
    if (trimmed.includes('ثلث')) return 0.33;

    // Match leading numeric portion (e.g., "10 أرغفة" -> 10, "1.5 كيلو" -> 1.5)
    const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)/);
    if (match) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed * 100) / 100;
      }
    }
  }

  return 1;
}

/**
 * Parses any price representation into a safe non-negative number or null if missing/empty.
 * Prevents NaN, Infinity, and invalid string conversions.
 */
export function parseSafePrice(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;

  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val) || val < 0) return null;
    return Math.round(val * 100) / 100;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'السعر غير محدد' || trimmed === 'غير محدد') return null;

    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return null;
    return Math.round(parsed * 100) / 100;
  }

  return null;
}

/**
 * Calculates the line total for a shopping item safely.
 * Returns null if the price is unspecified, ensuring transparency instead of misleading 0 EGP.
 */
export function calculateLineTotal(quantity: unknown, unitPrice: unknown): number | null {
  const qty = parseSafeQuantity(quantity);
  const price = parseSafePrice(unitPrice);

  if (price === null) return null;
  return Math.round((qty * price) * 100) / 100;
}

/**
 * Formats a unit price or line total in Egyptian Arabic.
 * Returns "السعر غير محدد" when the price is missing or null.
 */
export function formatPriceDisplay(price: number | null): string {
  if (price === null || isNaN(price)) {
    return 'السعر غير محدد';
  }
  return `${Math.round(price * 10) / 10} ج.م`;
}

/**
 * Calculates comprehensive, transparent totals for the shopping list.
 * Separates known totals from unpriced items to avoid misleading totals.
 */
export function calculateShoppingTotals(items: ShoppingItem[]): ShoppingTotals {
  let knownTotal = 0;
  let pendingKnownTotal = 0;
  let purchasedKnownTotal = 0;
  let unpricedCount = 0;

  for (const item of items) {
    const line = calculateLineTotal(item.quantity, item.unitPrice);
    if (line !== null) {
      knownTotal += line;
      if (item.isChecked) {
        purchasedKnownTotal += line;
      } else {
        pendingKnownTotal += line;
      }
    } else {
      unpricedCount++;
    }
  }

  const totalItems = items.length;
  return {
    knownTotal: Math.round(knownTotal),
    pendingKnownTotal: Math.round(pendingKnownTotal),
    purchasedKnownTotal: Math.round(purchasedKnownTotal),
    unpricedCount,
    totalItems,
    isFullyPriced: unpricedCount === 0,
    allUnpriced: unpricedCount === totalItems && totalItems > 0
  };
}

/**
 * Migrates and normalizes legacy shopping records from older versions of the app
 * without deleting or corrupting valid user data.
 */
export function normalizeShoppingItem(raw: any): ShoppingItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: 'طلب جديد',
      quantity: 1,
      unit: 'حبة',
      unitPrice: null,
      isChecked: false
    };
  }

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : Math.random().toString(36).substring(2, 9);
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'صنف';
  const quantity = parseSafeQuantity(raw.quantity);

  // Extract or preserve unit
  let unit = 'حبة';
  if (typeof raw.unit === 'string' && raw.unit.trim()) {
    unit = raw.unit.trim();
  } else if (typeof raw.quantity === 'string') {
    const trimmedQty = raw.quantity.trim();
    if (trimmedQty.includes('كيلو')) unit = 'كيلو';
    else if (trimmedQty.includes('جرام')) unit = 'جرام';
    else if (trimmedQty.includes('رغيف') || trimmedQty.includes('أرغفة')) unit = 'رغيف';
    else if (trimmedQty.includes('كوب')) unit = 'كوب';
    else if (trimmedQty.includes('علبة')) unit = 'علبة';
    else if (trimmedQty.includes('كيس')) unit = 'كيس';
  }

  // Determine unitPrice
  let unitPrice: number | null = null;
  if (raw.unitPrice !== undefined && raw.unitPrice !== null && raw.unitPrice !== '') {
    unitPrice = parseSafePrice(raw.unitPrice);
  } else if (raw.estimatedPrice !== undefined && raw.estimatedPrice !== null && raw.estimatedPrice !== '') {
    const est = parseSafePrice(raw.estimatedPrice);
    if (est !== null && est > 0 && quantity > 0) {
      unitPrice = Math.round((est / quantity) * 10) / 10;
    }
  }

  const isChecked = Boolean(raw.isChecked);

  return {
    id,
    name,
    quantity,
    unit,
    unitPrice,
    isChecked
  };
}

/**
 * Normalizes an entire array of shopping items, safely filtering out nulls.
 */
export function normalizeShoppingItemsList(rawList: unknown): ShoppingItem[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter(item => item && typeof item === 'object')
    .map(item => normalizeShoppingItem(item));
}

/**
 * Reconciles budget allocations to ensure exact sum reconciliation with the total budget.
 */
export function reconcileBudgetAllocations(
  totalBudget: number,
  percentages: number[],
  categories: BudgetCategoryDef[],
  expenses: ExpenseRecord[]
) {
  const safeTotal = Math.max(0, isNaN(totalBudget) ? 0 : totalBudget);
  const totalAllocatedRaw = categories.map((cat, i) => {
    const pct = percentages[i] || 0;
    return Math.round((safeTotal * pct) / 100);
  });

  // Reconcile rounding drift so sum(allocated) === safeTotal exactly
  const allocatedSum = totalAllocatedRaw.reduce((a, b) => a + b, 0);
  const drift = safeTotal - allocatedSum;
  if (drift !== 0 && totalAllocatedRaw.length > 0) {
    totalAllocatedRaw[0] += drift;
  }

  return categories.map((cat, i) => {
    const pct = percentages[i] || 0;
    const allocated = totalAllocatedRaw[i];
    const spent = expenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => {
        const amt = parseSafePrice(e.amount) || 0;
        return sum + amt;
      }, 0);
    const remaining = allocated - spent;
    const isOverBudget = spent > allocated;
    const usagePct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

    return {
      ...cat,
      percentage: pct,
      allocated,
      spent: Math.round(spent),
      remaining: Math.round(remaining),
      isOverBudget,
      usagePct
    };
  });
}

/**
 * Formats unpurchased shopping list items for sharing directly via WhatsApp.
 * Accurately reports known subtotals and explicitly handles unpriced items without misleading totals.
 */
export function formatWhatsAppShoppingMessage(items: ShoppingItem[]): WhatsAppShoppingShareResult {
  const unpurchased = items.filter(item => !item.isChecked);
  if (unpurchased.length === 0) {
    return {
      message: '',
      unpurchasedCount: 0,
      unpricedCount: 0,
      knownTotal: 0,
      isEmpty: true
    };
  }

  let knownTotal = 0;
  let unpricedCount = 0;
  const lines: string[] = [];

  for (const item of unpurchased) {
    const qty = parseSafeQuantity(item.quantity);
    const unit = (item.unit || 'حبة').trim();
    const lineTotal = calculateLineTotal(qty, item.unitPrice);

    if (lineTotal !== null) {
      knownTotal += lineTotal;
      lines.push(`▫️ ${item.name} (${qty} ${unit}) - ${Math.round(lineTotal)} ج.م`);
    } else {
      unpricedCount++;
      lines.push(`▫️ ${item.name} (${qty} ${unit}) - سعر غير محدد`);
    }
  }

  knownTotal = Math.round(knownTotal);

  let summaryLine = '';
  if (unpricedCount === 0) {
    summaryLine = `💰 الإجمالي التقديري: ${knownTotal} ج.م`;
  } else if (unpricedCount === unpurchased.length) {
    summaryLine = `💰 الإجمالي التقديري: غير محدد (جميع الأصناف بدون تسعير - ${unpricedCount} صنف)`;
  } else {
    summaryLine = `💰 الإجمالي التقديري: ${knownTotal} ج.م (للأصناف المسعرة فقط - يوجد ${unpricedCount} صنف بدون تسعير)`;
  }

  const message = [
    '🛒 قائمة طلبات البيت من تطبيق تدبيرة مصر:',
    '',
    ...lines,
    '',
    '-------------------------',
    summaryLine,
    '',
    '📱 تم الإنشاء عبر تطبيق تدبيرة مصر 🇪🇬'
  ].join('\n');

  return {
    message,
    unpurchasedCount: unpurchased.length,
    unpricedCount,
    knownTotal,
    isEmpty: false
  };
}

/**
 * Constructs a standardized, versioned JSON backup payload for Tedbeera Egypt.
 */
export function createBackupPayload(data: TedbeeraBackupData): TedbeeraBackupPayload {
  return {
    app: 'Tedbeera Egypt',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      familySize: Math.max(1, data.familySize || 4),
      budgetAmount: String(data.budgetAmount || '2500'),
      categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : DEFAULT_BUDGET_CATEGORIES,
      categoryPercentages: Array.isArray(data.categoryPercentages) ? data.categoryPercentages : DEFAULT_BUDGET_CATEGORIES.map(c => c.defaultPct),
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      shoppingItems: normalizeShoppingItemsList(data.shoppingItems || []),
      savedRecipeIds: Array.isArray(data.savedRecipeIds) ? data.savedRecipeIds : [],
      savedTipIds: Array.isArray(data.savedTipIds) ? data.savedTipIds : [],
      savedBudgets: Array.isArray(data.savedBudgets) ? data.savedBudgets : [],
      selectedIngredients: Array.isArray(data.selectedIngredients) ? data.selectedIngredients : ['بيض', 'طماطم', 'بصل'],
      dailyCompleted: data.dailyCompleted && typeof data.dailyCompleted === 'object' ? data.dailyCompleted : {},
      householdProfile: data.householdProfile && typeof data.householdProfile === 'object' ? data.householdProfile : null,
      inventoryItems: Array.isArray(data.inventoryItems) ? data.inventoryItems.filter(item => item && typeof item === 'object') : [],
      householdTasks: Array.isArray(data.householdTasks) ? data.householdTasks.filter(item => item && typeof item === 'object') : [],
      savingsGoals: Array.isArray(data.savingsGoals) ? data.savingsGoals.filter(item => item && typeof item === 'object') : []
    }
  };
}

/**
 * Validates and normalizes an imported JSON backup object.
 * Protects against malformed data, schema mismatches, and corrupted state.
 */
export function validateBackupPayload(raw: unknown): { isValid: boolean; error?: string; normalizedData?: TedbeeraBackupData } {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, error: 'الملف غير صالح: لا يحتوي على كائن بيانات JSON صالح.' };
  }

  const obj = raw as Record<string, any>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, any>;

  // Basic signature validation: requires at least one recognized data domain or Tedbeera signature
  const hasAppTag = typeof obj.app === 'string' && obj.app.toLowerCase().includes('tedbeera');
  const hasKnownFields = 'familySize' in data || 'budgetAmount' in data || 'categories' in data || 'shoppingItems' in data || 'expenses' in data;

  if (!hasAppTag && !hasKnownFields) {
    return { isValid: false, error: 'الملف لا ينتمي لتطبيق تدبيرة مصر أو بياناته غير متوافقة.' };
  }

  // Normalize family size
  const familySize = typeof data.familySize === 'number' && !isNaN(data.familySize) && data.familySize >= 1
    ? Math.round(data.familySize)
    : 4;

  // Normalize budget amount
  const budgetAmount = typeof data.budgetAmount === 'string' && data.budgetAmount.trim()
    ? data.budgetAmount.trim()
    : typeof data.budgetAmount === 'number' && !isNaN(data.budgetAmount)
    ? String(data.budgetAmount)
    : '2500';

  // Normalize categories
  let categories: BudgetCategoryDef[] = DEFAULT_BUDGET_CATEGORIES;
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    const validCats = data.categories.filter((c: any) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string');
    if (validCats.length > 0) {
      categories = validCats.map((c: any) => ({
        id: String(c.id),
        name: String(c.name),
        defaultPct: typeof c.defaultPct === 'number' ? c.defaultPct : 10,
        tip: String(c.tip || ''),
        iconName: String(c.iconName || 'Wallet'),
        isCustom: Boolean(c.isCustom)
      }));
    }
  }

  // Normalize category percentages ensuring 100% sum
  let categoryPercentages: number[] = categories.map(c => c.defaultPct);
  if (Array.isArray(data.categoryPercentages) && data.categoryPercentages.length === categories.length) {
    const numbers = data.categoryPercentages.map((p: any) => typeof p === 'number' && !isNaN(p) ? Math.max(0, Math.round(p)) : 0);
    const sum = numbers.reduce((a: number, b: number) => a + b, 0);
    if (sum === 100) {
      categoryPercentages = numbers;
    } else if (sum > 0) {
      // Re-scale proportionally to exact 100%
      let running = 0;
      const res: number[] = [];
      for (let i = 0; i < numbers.length - 1; i++) {
        const scaled = Math.round((numbers[i] / sum) * 100);
        res.push(scaled);
        running += scaled;
      }
      res.push(100 - running);
      categoryPercentages = res;
    }
  }

  // Normalize expenses safely
  const expenses: ExpenseRecord[] = [];
  if (Array.isArray(data.expenses)) {
    for (const exp of data.expenses) {
      if (exp && typeof exp === 'object') {
        const amt = parseSafePrice(exp.amount);
        if (amt !== null && amt >= 0) {
          expenses.push({
            id: String(exp.id || Math.random().toString(36).substring(2, 8)),
            categoryId: String(exp.categoryId || 'food'),
            amount: amt,
            date: String(exp.date || new Date().toISOString().split('T')[0]),
            description: String(exp.description || 'مصروف عام')
          });
        }
      }
    }
  }

  // Normalize shopping items
  const shoppingItems = normalizeShoppingItemsList(data.shoppingItems);

  // Normalize IDs & Arrays
  const savedRecipeIds = Array.isArray(data.savedRecipeIds) ? data.savedRecipeIds.filter(id => typeof id === 'string') : [];
  const savedTipIds = Array.isArray(data.savedTipIds) ? data.savedTipIds.filter(id => typeof id === 'string') : [];
  const savedBudgets = Array.isArray(data.savedBudgets) ? data.savedBudgets.filter(b => b && typeof b === 'object') : [];
  const selectedIngredients = Array.isArray(data.selectedIngredients) && data.selectedIngredients.length > 0
    ? data.selectedIngredients.filter(i => typeof i === 'string')
    : ['بيض', 'طماطم', 'بصل'];
  const dailyCompleted = data.dailyCompleted && typeof data.dailyCompleted === 'object' ? data.dailyCompleted : {};
  const triedTipIds = Array.isArray(data.triedTipIds) ? data.triedTipIds.filter((id: any) => typeof id === 'string') : [];
  const paydayDay = typeof data.paydayDay === 'number' && data.paydayDay >= 1 && data.paydayDay <= 31 ? Math.round(data.paydayDay) : null;
  const weeklyPlanUnlocked = typeof data.weeklyPlanUnlocked === 'boolean' ? data.weeklyPlanUnlocked : false;
  const reminderEnabled = typeof data.reminderEnabled === 'boolean' ? data.reminderEnabled : false;
  const householdProfile = data.householdProfile && typeof data.householdProfile === 'object' && !Array.isArray(data.householdProfile) ? data.householdProfile : null;
  const inventoryItems = Array.isArray(data.inventoryItems) ? data.inventoryItems.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) : [];
  const householdTasks = Array.isArray(data.householdTasks) ? data.householdTasks.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) : [];
  const savingsGoals = Array.isArray(data.savingsGoals) ? data.savingsGoals.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) : [];

  return {
    isValid: true,
    normalizedData: {
      familySize,
      budgetAmount,
      categories,
      categoryPercentages,
      expenses,
      shoppingItems,
      savedRecipeIds,
      savedTipIds,
      savedBudgets,
      selectedIngredients,
      dailyCompleted,
      triedTipIds,
      paydayDay,
      weeklyPlanUnlocked,
      reminderEnabled,
      householdProfile,
      inventoryItems,
      householdTasks,
      savingsGoals
    }
  };
}

// ========================================================
// PHASE 4B: VISUAL BUDGET ANALYTICS & PAYDAY CYCLE ENGINE
// ========================================================

export interface CategorySpendingAnalytics {
  progressPercentage: number; // Uncapped true spending percentage (e.g. 135%)
  visualPercentage: number;   // Capped 0-100% for CSS bar width
  colorStatus: 'green' | 'amber' | 'red';
  isOverBudget: boolean;
  exceededAmount: number;     // actualSpent - allocatedAmount if > 0
  remainingAmount: number;    // allocatedAmount - actualSpent if >= 0
}

/**
 * Calculates category spending progress percentage, overrun warnings, and dynamic color codes.
 * Safely handles 0 or missing allocations without NaN or Infinity.
 */
export function calculateCategoryAnalytics(allocatedAmount: number, actualSpent: number): CategorySpendingAnalytics {
  const safeAllocated = typeof allocatedAmount === 'number' && !isNaN(allocatedAmount) ? Math.max(0, allocatedAmount) : 0;
  const safeSpent = typeof actualSpent === 'number' && !isNaN(actualSpent) ? Math.max(0, actualSpent) : 0;

  let progressPercentage = 0;
  if (safeAllocated > 0) {
    progressPercentage = Math.round((safeSpent / safeAllocated) * 1000) / 10;
  } else if (safeSpent > 0) {
    // 0 allocation with positive spending -> over budget
    progressPercentage = 100;
  } else {
    progressPercentage = 0;
  }

  const visualPercentage = Math.min(100, Math.max(0, progressPercentage));

  let colorStatus: 'green' | 'amber' | 'red' = 'green';
  if (progressPercentage >= 100 || (safeAllocated === 0 && safeSpent > 0)) {
    colorStatus = 'red';
  } else if (progressPercentage >= 80) {
    colorStatus = 'amber';
  } else {
    colorStatus = 'green';
  }

  const isOverBudget = safeSpent > safeAllocated;
  const exceededAmount = isOverBudget ? safeSpent - safeAllocated : 0;
  const remainingAmount = !isOverBudget ? safeAllocated - safeSpent : 0;

  return {
    progressPercentage,
    visualPercentage,
    colorStatus,
    isOverBudget,
    exceededAmount,
    remainingAmount
  };
}

export interface PaydayCountdownResult {
  isConfigured: boolean;
  paydayDay: number;
  isToday: boolean;
  daysRemaining: number;
  effectivePayday: number;
  nextPaydayDate: Date;
  dailyCap: number | null; // null if remainingBudget <= 0 or unconfigured
  isBudgetExhausted: boolean;
}

/**
 * Helper to compute the number of days in a given year and month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculates next payday date and remaining days countdown.
 * Defensively handles month lengths (e.g. day 31 in Feb/Apr), leap years, year rollovers,
 * and eliminates negative countdown or timezone offset errors.
 */
export function calculatePaydayCountdown(
  paydayDay: number | null | undefined,
  remainingBudget: number,
  referenceDate: Date = new Date()
): PaydayCountdownResult {
  if (typeof paydayDay !== 'number' || isNaN(paydayDay) || paydayDay < 1 || paydayDay > 31) {
    return {
      isConfigured: false,
      paydayDay: 0,
      isToday: false,
      daysRemaining: 0,
      effectivePayday: 0,
      nextPaydayDate: referenceDate,
      dailyCap: null,
      isBudgetExhausted: remainingBudget <= 0
    };
  }

  const clampedPayday = Math.min(31, Math.max(1, Math.round(paydayDay)));
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDate = referenceDate.getDate();

  // Normalize today at midnight local time
  const todayMidnight = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);

  // Check this month's effective payday
  const thisMonthMaxDays = getDaysInMonth(currentYear, currentMonth);
  const thisMonthEffectiveDay = Math.min(clampedPayday, thisMonthMaxDays);
  const thisMonthPaydayDate = new Date(currentYear, currentMonth, thisMonthEffectiveDay, 0, 0, 0, 0);

  let isToday = false;
  let daysRemaining = 0;
  let targetPaydayDate: Date;
  let effectivePayday = thisMonthEffectiveDay;

  if (todayMidnight.getTime() === thisMonthPaydayDate.getTime()) {
    isToday = true;
    daysRemaining = 0;
    targetPaydayDate = thisMonthPaydayDate;
  } else if (todayMidnight.getTime() < thisMonthPaydayDate.getTime()) {
    // Payday is still to come this month
    targetPaydayDate = thisMonthPaydayDate;
    const diffMs = targetPaydayDate.getTime() - todayMidnight.getTime();
    daysRemaining = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  } else {
    // Payday has already passed this month -> scheduled for next month
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthMaxDays = getDaysInMonth(nextMonthYear, nextMonth);
    const nextMonthEffectiveDay = Math.min(clampedPayday, nextMonthMaxDays);

    targetPaydayDate = new Date(nextMonthYear, nextMonth, nextMonthEffectiveDay, 0, 0, 0, 0);
    effectivePayday = nextMonthEffectiveDay;

    const diffMs = targetPaydayDate.getTime() - todayMidnight.getTime();
    daysRemaining = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Calculate daily spending cap: dailyCap = remainingBudget / remainingDays
  const isBudgetExhausted = remainingBudget <= 0;
  let dailyCap: number | null = null;
  if (!isBudgetExhausted) {
    const divisor = Math.max(1, daysRemaining);
    dailyCap = Math.max(0, Math.round(remainingBudget / divisor));
  }

  return {
    isConfigured: true,
    paydayDay: clampedPayday,
    isToday,
    daysRemaining,
    effectivePayday,
    nextPaydayDate: targetPaydayDate,
    dailyCap,
    isBudgetExhausted
  };
}

export interface DonutSegment {
  categoryId: string;
  categoryName: string;
  spent: number;
  allocated: number;
  sharePercentage: number;   // % of total spending (sums to 100% of spending)
  budgetPercentage: number;  // % of allocated budget used
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

export const DONUT_PALETTE = [
  '#0D47A1', // Tedbeera Deep Blue
  '#047857', // Emerald Green
  '#D97706', // Warm Amber
  '#7C3AED', // Vivid Purple
  '#DB2777', // Rose Pink
  '#0284C7', // Sky Blue
  '#EA580C', // Orange
  '#4F46E5'  // Indigo
];

/**
 * Calculates SVG stroke-dasharray and dashoffset for responsive donut chart segments.
 * Excludes categories with 0 spending from visible segments without modifying budget allocations.
 */
export function calculateDonutSegments(
  categoriesWithSpending: { id: string; name: string; allocated: number; spent: number }[],
  totalSpent: number,
  radius: number = 38
): DonutSegment[] {
  if (totalSpent <= 0) return [];

  const circumference = 2 * Math.PI * radius; // ≈ 238.761
  let currentOffset = 0;
  const segments: DonutSegment[] = [];

  const activeCategories = categoriesWithSpending.filter(c => c.spent > 0);

  activeCategories.forEach((cat, idx) => {
    const sharePercentage = Math.round((cat.spent / totalSpent) * 1000) / 10;
    const segmentArc = (cat.spent / totalSpent) * circumference;
    const budgetPercentage = cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 1000) / 10 : 100;
    const color = DONUT_PALETTE[idx % DONUT_PALETTE.length];

    segments.push({
      categoryId: cat.id,
      categoryName: cat.name,
      spent: cat.spent,
      allocated: cat.allocated,
      sharePercentage,
      budgetPercentage,
      color,
      strokeDasharray: `${segmentArc} ${circumference - segmentArc}`,
      strokeDashoffset: -currentOffset
    });

    currentOffset += segmentArc;
  });

  return segments;
}

// ========================================================
// PHASE 4C: ARABIC VOICE RECOGNITION & INGREDIENT MATCHING
// ========================================================

export type VoiceRecognitionState =
  | 'idle'
  | 'listening'
  | 'success'
  | 'no-match'
  | 'permission-denied'
  | 'unsupported'
  | 'error';

/**
 * Normalizes Arabic text for resilient matching:
 * - Strips diacritics (tashkeel).
 * - Normalizes variants of Alef (أ, إ, آ, ٱ -> ا).
 * - Normalizes Yaa and Alef Maksura (ى, ي -> ي).
 * - Normalizes Taa Marbuta and Haa (ة, ه -> ه).
 * - Strips punctuation and extraneous symbols.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';

  return text
    // Strip diacritics
    .replace(/[\u064B-\u0652\u0670]/g, '')
    // Normalize Alefs
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Yaa
    .replace(/[ىي]/g, 'ي')
    // Normalize Taa Marbuta
    .replace(/[ةه]/g, 'ه')
    // Replace punctuation and symbols with space
    .replace(/[,.،؛!؟\-_/\\()\[\]{}"'":]/g, ' ')
    // Normalize repeated whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Common Egyptian and colloquial Arabic aliases mapped to canonical catalog ingredients.
 */
export const ARABIC_INGREDIENT_ALIASES: Record<string, string[]> = {
  'بيض': ['بيض', 'بيضة', 'بيضان', 'بيضات', 'بيضتين'],
  'طماطم': ['طماطم', 'قوطة', 'قوطه', 'بندورة', 'بندوره', 'طماطماية', 'طماطمايه'],
  'بصل': ['بصل', 'بصلة', 'بصله', 'بصلاية', 'بصلايه', 'بصلتين', 'بصلات'],
  'بطاطس': ['بطاطس', 'بطاطا', 'بطاطساية', 'بطاطسايه', 'بطاطستين'],
  'أرز': ['أرز', 'ارز', 'رز', 'الرز'],
  'مكرونة': ['مكرونة', 'مكرونه', 'سباجيتي', 'مقرونة', 'مقرونه'],
  'عدس أصفر': ['عدس أصفر', 'عدس اصفر', 'عدس'],
  'عدس بجبة': ['عدس بجبة', 'عدس بجبه', 'عدس اسمر', 'عدس بني'],
  'فول': ['فول', 'فول مدمس', 'فول تدميس', 'فوله'],
  'جبنة': ['جبنة', 'جبنه', 'جبن', 'جبنة بيضا', 'جبنة رومي'],
  'تونة': ['تونة', 'تونه', 'علبة تونة', 'علبة تونه'],
  'بواقي فراخ': ['بواقي فراخ', 'فراخ', 'دجاج', 'بواقي دجاج', 'ورك فراخ', 'صدور فراخ'],
  'بواقي لحمة': ['بواقي لحمة', 'بواقي لحمه', 'لحمة', 'لحمه', 'لحم', 'بواقي لحم'],
  'باذنجان': ['باذنجان', 'بتنجان', 'بدنجان', 'بتنجانة', 'بتنجانه'],
  'فلفل رومي': ['فلفل رومي', 'فلفل رومى', 'فلفل اخضر', 'فلفل بارد', 'فلفل'],
  'ثوم': ['ثوم', 'توم', 'تومة', 'تومه', 'ثومة', 'ثومه']
};

export const ARABIC_SPEECH_STOP_WORDS = new Set([
  'عندي', 'معايا', 'في', 'البيت', 'التلاجة', 'الثلاجة', 'موجود', 'فيه', 'و',
  'مع', 'كمان', 'هات', 'حط', 'عاوز', 'عايز', 'اشتريت', 'احسب', 'ليا', 'من',
  'الي', 'إلي', 'علي', 'على', 'ده', 'دي', 'دول', 'شويه', 'شوية', 'حبة', 'حبه',
  'كيلو', 'نص', 'نصف', 'ربع'
]);

export interface SpeechMatchResult {
  matchedIngredients: string[];
  unmatchedWords: string[];
  feedbackMessage: string;
}

/**
 * Matches spoken Arabic text against the available catalog of ingredients.
 * Resilient to colloquial Egyptian phrases like "عندي بيض وبطاطس وبصل".
 * Only matches against valid catalog items and avoids duplicates or hallucinations.
 */
export function matchSpokenIngredients(
  spokenText: string,
  catalog: string[]
): SpeechMatchResult {
  if (!spokenText || !spokenText.trim()) {
    return {
      matchedIngredients: [],
      unmatchedWords: [],
      feedbackMessage: 'ملقيناش مكونات مطابقة للكلام، جرّب تقول أسماء المكونات بوضوح.'
    };
  }

  const normalizedInput = normalizeArabicText(spokenText);
  const matchedSet = new Set<string>();

  // 1. Check known multi-word aliases and catalog items first
  catalog.forEach(catItem => {
    const normalizedCatItem = normalizeArabicText(catItem);
    const regex = new RegExp(`(^|\\s)${normalizedCatItem}(\\s|$)`, 'i');
    if (regex.test(normalizedInput)) {
      matchedSet.add(catItem);
    }

    const aliases = ARABIC_INGREDIENT_ALIASES[catItem] || [];
    aliases.forEach(alias => {
      const normalizedAlias = normalizeArabicText(alias);
      const aliasRegex = new RegExp(`(^|\\s)${normalizedAlias}(\\s|$)`, 'i');
      if (aliasRegex.test(normalizedInput)) {
        matchedSet.add(catItem);
      }
    });
  });

  // 2. Tokenize spoken text into words to detect unmatched meaningful words
  const words = normalizedInput
    .split(/\s+/)
    .filter(w => w.length > 1 && !ARABIC_SPEECH_STOP_WORDS.has(w));

  const unmatchedWords: string[] = [];

  words.forEach(word => {
    let isWordAccountedFor = false;

    for (const matchedItem of matchedSet) {
      const normMatched = normalizeArabicText(matchedItem);
      if (normMatched.includes(word) || word.includes(normMatched)) {
        isWordAccountedFor = true;
        break;
      }
      const aliases = ARABIC_INGREDIENT_ALIASES[matchedItem] || [];
      for (const alias of aliases) {
        const normAlias = normalizeArabicText(alias);
        if (normAlias.includes(word) || word.includes(normAlias)) {
          isWordAccountedFor = true;
          break;
        }
      }
      if (isWordAccountedFor) break;
    }

    if (!isWordAccountedFor) {
      unmatchedWords.push(word);
    }
  });

  const matchedList = Array.from(matchedSet);

  let feedbackMessage = '';
  if (matchedList.length > 0) {
    if (unmatchedWords.length === 0) {
      feedbackMessage = `تم اختيار ${matchedList.length} مكونات بنجاح (${matchedList.join('، ')}) ✨`;
    } else {
      feedbackMessage = `تم اختيار ${matchedList.length} مكونات مطابقة (${matchedList.join('، ')}). ملحوظة: لم يتم التعرف على (${unmatchedWords.slice(0, 3).join('، ')}) كمكون في القائمة.`;
    }
  } else {
    feedbackMessage = 'ملقيناش مكونات مطابقة للكلام، جرّب تقول أسماء المكونات بوضوح مثل: "عندي بيض وبطاطس وبصل".';
  }

  return {
    matchedIngredients: matchedList,
    unmatchedWords,
    feedbackMessage
  };
}

// ========================================================
// PHASE 4C: DAILY TIPS INTERACTION & PERSISTENCE HELPERS
// ========================================================

/**
 * Calculates distinct count of tried tips (ensures no duplicate counting).
 */
export function calculateUniqueAchievementCount(triedIds: string[]): number {
  if (!Array.isArray(triedIds)) return 0;
  return new Set(triedIds.filter(id => typeof id === 'string' && id.trim().length > 0)).size;
}

/**
 * Toggles a tip in the tried list while preserving Set uniqueness.
 */
export function toggleTriedTipId(currentList: string[], tipId: string): string[] {
  if (!tipId) return currentList;
  const set = new Set(currentList);
  if (set.has(tipId)) {
    set.delete(tipId);
  } else {
    set.add(tipId);
  }
  return Array.from(set);
}

/**
 * Toggles a tip in the saved/bookmarked list while preserving uniqueness.
 */
export function toggleSavedTipId(currentList: string[], tipId: string): string[] {
  if (!tipId) return currentList;
  const set = new Set(currentList);
  if (set.has(tipId)) {
    set.delete(tipId);
  } else {
    set.add(tipId);
  }
  return Array.from(set);
}


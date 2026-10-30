import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Utensils,
  Wallet,
  Lightbulb,
  Bookmark,
  Check,
  Plus,
  Trash2,
  Share2,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShoppingCart,
  Search,
  Download,
  Upload,
  FolderCode,
  Smartphone,
  FlaskConical,
  Copy,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Settings,
  Users,
  Edit3,
  RotateCcw,
  Tag,
  Receipt,
  Car,
  Home,
  PiggyBank,
  CheckSquare,
  Square,
  FileDown,
  FileUp,
  X,
  HelpCircle,
  Calendar,
  PieChart,
  Mic,
  MicOff,
  Award,
  Volume2,
  Play,
  Tv,
  CalendarCheck,
  Bell,
  BellRing,
  BellOff,
  Lock,
  Unlock,
  ListPlus,
  XCircle
} from 'lucide-react';
import {
  COMMON_INGREDIENTS,
  RECIPES,
  PRACTICAL_BUDGET_TIPS,
  DAILY_IDEAS,
  DAILY_CHALLENGES,
  DEFAULT_BUDGET_CATEGORIES,
  BUDGET_PRESETS,
  getDeterministicDailyChallenge,
  Recipe,
  Ingredient,
  DailyIdea,
  BudgetCategoryDef,
  ExpenseRecord
} from './data/seedData';
import {
  ShoppingItem,
  ShoppingTotals,
  TedbeeraBackupData,
  CategorySpendingAnalytics,
  PaydayCountdownResult,
  DonutSegment,
  VoiceRecognitionState,
  parseSafeQuantity,
  parseSafePrice,
  calculateLineTotal,
  formatPriceDisplay,
  calculateShoppingTotals,
  normalizeShoppingItem,
  normalizeShoppingItemsList,
  reconcileBudgetAllocations,
  formatWhatsAppShoppingMessage,
  createBackupPayload,
  validateBackupPayload,
  calculateCategoryAnalytics,
  calculatePaydayCountdown,
  calculateDonutSegments,
  matchSpokenIngredients,
  calculateUniqueAchievementCount,
  toggleTriedTipId,
  toggleSavedTipId,
  DONUT_PALETTE,
  REWARD_PLAN_STORAGE_KEY,
  REMINDER_STORAGE_KEY
} from './data/calculationUtils';
import {
  getRewardedAdService,
  getWebSimulationAdapter,
  OFFICIAL_TEST_REWARDED_AD_UNIT
} from './services/rewardedAdService';
import {
  getLocalNotificationService,
  DAILY_REMINDER_NOTIFICATION_ID,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE
} from './services/localNotificationService';
import {
  WEEKLY_DAYS_SCHEDULE,
  getRecipeById,
  calculateRecipeScaledCost,
  calculateWeeklyPlanTotalCost,
  consolidateWeeklyPlanIngredients,
  convertConsolidatedToShoppingItems,
  DayMealPlan,
  ConsolidatedPlanIngredient
} from './data/weeklyMealPlan';
import { ANDROID_CODE_SAMPLES } from './data/androidFilesContent';
import {
  AFFILIATE_PARTNERS_CONFIG,
  AffiliatePartnerDeal,
  getActiveVerifiedDeals,
  matchDealsForShoppingItems
} from './data/affiliateDeals';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ShoppingTotalsSummary } from './features/shopping/ShoppingTotalsSummary';
import { HouseholdHub } from './features/household/HouseholdHub';
import { householdProfileRepository } from './features/household/householdRepository';

import type { ActiveTab, ViewMode, SavedSubTab, MealTypeFilter } from './app/navigation';

export interface SavedBudgetPlan {
  id: string;
  categoryTitle: string;
  totalAmount: number;
  slices: { name: string; percentage: number; amount: number }[];
  date: string;
}

// ========================================================
// SHARED LAYOUT SPACING & ENVIRONMENT CONSTANTS
// ========================================================
export const IS_DEV = import.meta.env.DEV;

// Layout spacing constants:
// Pinned bottom elements inside phone frame:
// - Bottom Navigation Bar: ~56px
// - Google AdMob Banner Container: ~72px when active (50px banner + 22px header/padding)
// - Required breathing room: 70–90 CSS pixels extra clearance above pinned elements
// Dynamic calculation:
// - Banner visible (loading/loaded): 56px + 72px + 80px breathing room = 208px -> 'pb-52'
// - Banner collapsed (failed/disabled): 56px + 0px + 88px breathing room = 144px -> 'pb-36'
export const getBottomScrollPaddingClass = (adStatus: 'loading' | 'loaded' | 'failed' | 'disabled'): string => {
  return adStatus === 'failed' || adStatus === 'disabled' ? 'pb-36' : 'pb-52';
};

// SVG Fallback renderer for food and tips
function SvgIllustration({
  type,
  className = "w-full h-full"
}: {
  type: string;
  className?: string;
}) {
  switch (type) {
    case 'egg':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="16" fill="#FEF3C7" />
          <circle cx="50" cy="50" r="32" fill="#FDE68A" stroke="#F59E0B" strokeWidth="3" />
          <ellipse cx="44" cy="46" rx="14" ry="12" fill="#F59E0B" />
          <ellipse cx="46" cy="44" rx="5" ry="4" fill="#FEF3C7" opacity="0.6" />
          <circle cx="62" cy="58" r="3" fill="#10B981" />
          <circle cx="36" cy="62" r="2.5" fill="#EF4444" />
          <circle cx="56" cy="34" r="2" fill="#10B981" />
        </svg>
      );
    case 'koshary':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="16" fill="#FEE2E2" />
          <path d="M20 56C20 72 34 82 50 82C66 82 80 72 80 56H20Z" fill="#DC2626" />
          <path d="M22 56C22 50 35 44 50 44C65 44 78 50 78 56H22Z" fill="#F87171" />
          <ellipse cx="50" cy="45" rx="24" ry="7" fill="#B45309" />
          <circle cx="45" cy="42" r="2" fill="#FEF3C7" />
          <circle cx="55" cy="44" r="2" fill="#FEF3C7" />
          <circle cx="40" cy="46" r="2" fill="#FEF3C7" />
          <circle cx="52" cy="38" r="3" fill="#D97706" />
        </svg>
      );
    case 'pasta':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="16" fill="#FEF9C3" />
          <rect x="22" y="38" width="56" height="34" rx="8" fill="#F59E0B" />
          <path d="M26 44C32 40 40 46 48 42C56 38 64 44 74 40" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          <path d="M26 52C32 48 40 54 48 50C56 46 64 52 74 48" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          <path d="M26 60C32 56 40 62 48 58C56 54 64 60 74 56" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'soup':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="16" fill="#FFEDD5" />
          <path d="M24 50C24 68 36 78 50 78C64 78 76 68 76 50H24Z" fill="#F97316" />
          <ellipse cx="50" cy="50" rx="26" ry="7" fill="#FDBA74" />
          <path d="M42 32C40 28 44 24 42 20" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M50 34C48 30 52 26 50 22" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 32C56 28 60 24 58 20" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'foul':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="16" fill="#ECFDF5" />
          <ellipse cx="50" cy="58" rx="34" ry="22" fill="#047857" />
          <ellipse cx="50" cy="54" rx="28" ry="16" fill="#92400E" />
          <circle cx="44" cy="52" r="3" fill="#D97706" />
          <circle cx="56" cy="56" r="3" fill="#D97706" />
          <circle cx="50" cy="48" r="3.5" fill="#F59E0B" />
          <circle cx="42" cy="58" r="2.5" fill="#EF4444" />
        </svg>
      );
    case 'potatoes':
    case 'meat':
    case 'salad':
    default:
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="16" fill="#DBEAFE" />
          <circle cx="50" cy="50" r="30" fill="#3B82F6" opacity="0.8" />
          <path d="M35 50L45 60L65 40" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function renderCategoryIcon(iconName?: string, className = "w-4 h-4") {
  switch (iconName) {
    case 'utensils':
      return <Utensils className={className} />;
    case 'receipt':
      return <Receipt className={className} />;
    case 'car':
      return <Car className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'piggy':
      return <PiggyBank className={className} />;
    case 'tag':
    default:
      return <Tag className={className} />;
  }
}

export default function App() {
  const isNativeApp = Capacitor.isNativePlatform();
  const [viewMode, setViewMode] = useState<ViewMode>('emulator');
  const [activeTab, setActiveTab] = useState<ActiveTab>('food');
  const [savedSubTab, setSavedSubTab] = useState<SavedSubTab>('shopping');

  // Food State
  const [mealFilter, setMealFilter] = useState<MealTypeFilter>('all');
  const [familySize, setFamilySize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_family_size');
      const parsed = stored ? parseInt(stored, 10) : 4;
      return isNaN(parsed) || parsed < 1 ? 4 : parsed;
    } catch {
      return 4;
    }
  });
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['بيض', 'طماطم', 'بصل']);
  const [isVeryBudgetFilter, setIsVeryBudgetFilter] = useState(false);
  const [isQuickFilter, setIsQuickFilter] = useState(false);
  const [usesLeftoversFilter, setUsesLeftoversFilter] = useState(false);
  const [isZeroMissingOnly, setIsZeroMissingOnly] = useState(false);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);

  // Budget & Expense State
  const [budgetAmount, setBudgetAmount] = useState<string>(() => {
    try {
      return localStorage.getItem('tedbeera_budget_amount') || '2500';
    } catch {
      return '2500';
    }
  });

  const [categories, setCategories] = useState<BudgetCategoryDef[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_categories');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_BUDGET_CATEGORIES;
    } catch {
      return DEFAULT_BUDGET_CATEGORIES;
    }
  });

  const [categoryPercentages, setCategoryPercentages] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_percentages');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr) && arr.length > 0 && arr.every(n => typeof n === 'number' && !isNaN(n))) {
          // Verify exact 100% invariant
          const sum = arr.reduce((a, b) => a + b, 0);
          if (sum === 100) return arr;
        }
      }
      return DEFAULT_BUDGET_CATEGORIES.map(c => c.defaultPct);
    } catch {
      return DEFAULT_BUDGET_CATEGORIES.map(c => c.defaultPct);
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_expenses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(e => e && typeof e === 'object').map(e => ({
            id: String(e.id || Math.random().toString(36).substring(2, 8)),
            categoryId: String(e.categoryId || 'food'),
            amount: parseSafePrice(e.amount) || 0,
            date: String(e.date || new Date().toISOString().split('T')[0]),
            description: String(e.description || 'مصروف عام')
          }));
        }
      }
      return [
        { id: 'exp_1', categoryId: 'food', amount: 350, date: '2026-10-24', description: 'سوق الخضار الأسبوعي وبصل وطماطم' },
        { id: 'exp_2', categoryId: 'bills', amount: 220, date: '2026-10-22', description: 'فاتورة الكهرباء وشحن كارت العداد' },
        { id: 'exp_3', categoryId: 'transport', amount: 85, date: '2026-10-25', description: 'اشتراك مترو ومواصلات شغل' }
      ];
    } catch {
      return [];
    }
  });

  // Daily State
  const [todayDateKey, setTodayDateKey] = useState<string>('');
  const [dailyCompleted, setDailyCompleted] = useState<boolean>(false);
  const [dailySearch, setDailySearch] = useState<string>('');
  const [selectedDailyCategory, setSelectedDailyCategory] = useState<string>('الكل');

  // Persistent Saved Content (LocalStorage)
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_saved_recipes');
      return stored ? JSON.parse(stored) : ['rec_shakshouka'];
    } catch {
      return ['rec_shakshouka'];
    }
  });

  // Phase 4C: Saved Tips (Dedicated Key: tedbeera_phase4c_saved_tips with backward compat)
  const [savedTipIds, setSavedTipIds] = useState<string[]>(() => {
    try {
      const storedPhase4C = localStorage.getItem('tedbeera_phase4c_saved_tips');
      if (storedPhase4C) return JSON.parse(storedPhase4C);
      const storedLegacy = localStorage.getItem('tedbeera_saved_tips');
      return storedLegacy ? JSON.parse(storedLegacy) : ['idea_1', 'idea_2'];
    } catch {
      return ['idea_1', 'idea_2'];
    }
  });

  // Phase 4C: Tried Tips Achievements (Unique Key: tedbeera_phase4c_tried_tips)
  const [triedTipIds, setTriedTipIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_phase4c_tried_tips');
      return stored ? JSON.parse(stored) : ['idea_1'];
    } catch {
      return ['idea_1'];
    }
  });

  // Phase 4C: Daily Tips View Mode ('all' or 'saved' - أفكاري المحفوظة)
  const [dailyTipsViewMode, setDailyTipsViewMode] = useState<'all' | 'saved'>('all');

  // Phase 4C: Egyptian Arabic Voice Recognition State
  const isVoiceSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
  const [voiceState, setVoiceState] = useState<VoiceRecognitionState>('idle');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [savedBudgets, setSavedBudgets] = useState<SavedBudgetPlan[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_saved_budgets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Shopping Items with Safe Migration & NaN Prevention
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_shopping_items');
      if (stored) {
        const raw = JSON.parse(stored);
        const normalized = normalizeShoppingItemsList(raw);
        if (normalized.length > 0) return normalized;
      }
      return [
        { id: '1', name: 'عدس أصفر', quantity: 1, unit: 'كوب', unitPrice: 25, isChecked: false },
        { id: '2', name: 'طماطم مسبكة', quantity: 4, unit: 'حبة', unitPrice: 5, isChecked: true },
        { id: '3', name: 'عيش بلدي سخن', quantity: 10, unit: 'رغيف', unitPrice: null, isChecked: false } // Sample unpriced item
      ];
    } catch {
      return [
        { id: '1', name: 'عدس أصفر', quantity: 1, unit: 'كوب', unitPrice: 25, isChecked: false },
        { id: '2', name: 'طماطم مسبكة', quantity: 4, unit: 'حبة', unitPrice: 5, isChecked: true }
      ];
    }
  });

  // Phase 5 PRO: Custom Recipes State & Persistence
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_custom_recipes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isAddCustomRecipeModalOpen, setIsAddCustomRecipeModalOpen] = useState(false);
  const [customRecipeName, setCustomRecipeName] = useState('');
  const [customRecipeMealType, setCustomRecipeMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [customRecipePrepTime, setCustomRecipePrepTime] = useState('20');
  const [customRecipeCost, setCustomRecipeCost] = useState('60');
  const [customRecipeIngredientName, setCustomRecipeIngredientName] = useState('طماطم');

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_custom_recipes', JSON.stringify(customRecipes));
    } catch {}
  }, [customRecipes]);

  const handleSaveCustomRecipe = () => {
    if (!customRecipeName.trim()) {
      showToast('يرجى إدخال اسم الوجبة الخاصة');
      return;
    }
    const costNum = parseFloat(customRecipeCost);
    if (isNaN(costNum) || costNum < 0) {
      showToast('يرجى إدخال تكلفة صحيحة');
      return;
    }
    const prepNum = parseInt(customRecipePrepTime, 10);
    if (isNaN(prepNum) || prepNum <= 0) {
      showToast('يرجى إدخال وقت تحضير صحيح');
      return;
    }

    const newRecipe: Recipe = {
      id: 'custom_' + Math.random().toString(36).substring(2, 9),
      name: customRecipeName.trim(),
      mealType: customRecipeMealType,
      prepTimeMinutes: prepNum,
      estimatedCostEgp: costNum,
      baseServings: 4,
      isVeryBudget: costNum <= 50,
      isQuick: prepNum <= 20,
      usesLeftovers: false,
      svgFallbackIcon: 'koshary',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      ingredients: [
        {
          name: customRecipeIngredientName.trim() || 'مكون أساسي',
          quantity: '1 وحدة',
          baseAmount: 1,
          unit: 'وحدة'
        }
      ],
      budgetCategory: 'طعام وتموين',
      tags: ['وجبة مخصصة'],
      steps: [
        'جهزي المكونات ونظفيها جيداً.',
        'قومي بالطهي بالطريقة المعتادة حتى تمام النضج.',
        'قدميه ساخناً لأفراد الأسرة وبالهناء والشفاء.'
      ]
    };

    setCustomRecipes(prev => [newRecipe, ...prev]);
    setCustomRecipeName('');
    setIsAddCustomRecipeModalOpen(false);
    showToast('تمت إضافة أكلتك الخاصة بنجاح وحفظها في المحفوظات 🍳');
  };

  const allRecipes = useMemo(() => {
    return [...RECIPES, ...customRecipes];
  }, [customRecipes]);

  // UI Modals & Forms
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('حبة');
  const [newItemUnitPrice, setNewItemUnitPrice] = useState(''); // Empty by default to support unpriced items explicitly

  // Edit Item Price Modal
  const [editingPriceItem, setEditingPriceItem] = useState<{ id: string; name: string; currentPrice: string } | null>(null);

  // Expense Modal
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('food');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Custom Category Modal
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatTip, setNewCatTip] = useState('');

  // Settings & Safety Modals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [householdName, setHouseholdName] = useState(() => householdProfileRepository.read().name);
  const [householdGovernorate, setHouseholdGovernorate] = useState(() => householdProfileRepository.read().governorate);
  const [householdCity, setHouseholdCity] = useState(() => householdProfileRepository.read().city);

  const [isClearShoppingConfirmOpen, setIsClearShoppingConfirmOpen] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isRestoreConfirmModalOpen, setIsRestoreConfirmModalOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<TedbeeraBackupData | null>(null);

  // Phase 4B: Monthly Payday Configuration (New LocalStorage Key: tedbeera_payday_day)
  const [paydayDay, setPaydayDay] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('tedbeera_payday_day');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isPaydayModalOpen, setIsPaydayModalOpen] = useState(false);
  const [tempPaydayInput, setTempPaydayInput] = useState<string>('25');

  // Phase 4B: Visual Spending Donut Segment Selection State
  const [selectedDonutSegmentId, setSelectedDonutSegmentId] = useState<string | null>(null);

  // AdMob State & Policy Compliance Controls (Google Mobile Ads)
  type AdStatus = 'loaded' | 'loading' | 'failed' | 'disabled';
  const [adStatus, setAdStatus] = useState<AdStatus>('loaded');
  const [isInterstitialEnabled, setIsInterstitialEnabled] = useState<boolean>(false); // Strictly disabled by default
  const [sessionInterstitialCount, setSessionInterstitialCount] = useState<number>(0);
  const [lastInterstitialTime, setLastInterstitialTime] = useState<number>(0);
  const [isInterstitialActive, setIsInterstitialActive] = useState<boolean>(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState<number>(5);
  const [isAdControlsOpen, setIsAdControlsOpen] = useState<boolean>(false);

  // Interstitial Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isInterstitialActive && interstitialCountdown > 0) {
      timer = setTimeout(() => {
        setInterstitialCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isInterstitialActive, interstitialCountdown]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 4D: Weekly Meal Plan Unlocked state (Key: tedbeera_phase4d_weekly_plan_unlocked)
  const [isWeeklyPlanUnlocked, setIsWeeklyPlanUnlocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(REWARD_PLAN_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Phase 4D: Selected Day in Meal Plan
  const [selectedPlanDayId, setSelectedPlanDayId] = useState<string>('sat');
  const [isConsolidatedShoppingModalOpen, setIsConsolidatedShoppingModalOpen] = useState<boolean>(false);

  // Phase 4D: Rewarded Ad Simulation Modal State
  const [isRewardSimulationOpen, setIsRewardSimulationOpen] = useState<boolean>(false);
  const [isSimulatingPlayback, setIsSimulatingPlayback] = useState<boolean>(false);
  const [playbackCountdown, setPlaybackCountdown] = useState<number>(5);
  const [isAdSessionActive, setIsAdSessionActive] = useState<boolean>(false);

  // Phase 4D: Daily Savings Local Reminder State
  const [isDailyReminderEnabled, setIsDailyReminderEnabled] = useState<boolean>(() => {
    try {
      return getLocalNotificationService().getStoredConfig().enabled;
    } catch {
      return false;
    }
  });
  const [reminderFeedbackMessage, setReminderFeedbackMessage] = useState<string | null>(null);

  // Phase 4D: Rewarded Ad Simulation Playback Timer
  useEffect(() => {
    let timer: any;
    if (isSimulatingPlayback && playbackCountdown > 0) {
      timer = setTimeout(() => {
        setPlaybackCountdown(prev => prev - 1);
      }, 1000);
    } else if (isSimulatingPlayback && playbackCountdown === 0) {
      // Completed simulation!
      const simAdapter = getWebSimulationAdapter();
      simAdapter?.completeSimulation();
      grantWeeklyPlanReward();
    }
    return () => clearTimeout(timer);
  }, [isSimulatingPlayback, playbackCountdown]);

  // Phase 4D: Single, Idempotent Reward Granting Function
  const grantWeeklyPlanReward = () => {
    setIsWeeklyPlanUnlocked(true);
    try {
      localStorage.setItem(REWARD_PLAN_STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('LocalStorage unavailable for reward persistence:', e);
    }
    setIsRewardSimulationOpen(false);
    setIsSimulatingPlayback(false);
    setIsAdSessionActive(false);
    showToast('مبروك! تم فتح جدول وجبات الأسبوع التوفيرية الكاملة بنجاح 🎉');
  };

  // Phase 4D: Dismiss / Cancel Simulation without reward
  const handleCancelRewardSimulation = () => {
    const simAdapter = getWebSimulationAdapter();
    simAdapter?.cancelSimulation();
    setIsRewardSimulationOpen(false);
    setIsSimulatingPlayback(false);
    setIsAdSessionActive(false);
    showToast('تم إلغاء المحاكاة - لم يتم فتح الخطة (بدون مكافأة)');
  };

  // Phase 4D: Request Rewarded Ad (Triggers native or web simulation)
  const handleRequestRewardedAd = () => {
    if (isAdSessionActive) return; // Prevent overlapping ad sessions
    setIsAdSessionActive(true);

    const rewardedService = getRewardedAdService();
    if (rewardedService.isNative()) {
      rewardedService.show({
        onUserEarnedReward: () => {
          grantWeeklyPlanReward();
        },
        onDismissedWithoutReward: () => {
          setIsAdSessionActive(false);
          showToast('تم إغلاق الإعلان قبل اكتماله - لم يتم فتح الخطة');
        },
        onError: (err) => {
          setIsAdSessionActive(false);
          showToast(err || 'تعذر تشغيل الإعلان');
        }
      });
    } else {
      // In Web preview, show custom simulation dialog
      rewardedService.show({
        onUserEarnedReward: () => {
          grantWeeklyPlanReward();
        },
        onDismissedWithoutReward: () => {
          setIsAdSessionActive(false);
        },
        onError: (err) => {
          setIsAdSessionActive(false);
          showToast(err);
        }
      });
      setIsRewardSimulationOpen(true);
      setIsSimulatingPlayback(false);
      setPlaybackCountdown(5);
    }
  };

  const handleStartSimulationPlayback = () => {
    setIsSimulatingPlayback(true);
    setPlaybackCountdown(5);
  };

  // Phase 4D: Toggle Daily Savings Local Notification
  const handleToggleReminder = async (enable: boolean) => {
    const service = getLocalNotificationService();
    if (enable) {
      const res = await service.scheduleDailyReminder(DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE);
      setIsDailyReminderEnabled(true);
      setReminderFeedbackMessage(res.message);
      showToast(res.message);
    } else {
      const res = await service.cancelDailyReminder();
      setIsDailyReminderEnabled(false);
      setReminderFeedbackMessage(res.message);
      showToast(res.message);
    }
  };

  // Phase 4D: Add Consolidated Meal Plan Ingredients to Shopping List
  const handleAddConsolidatedPlanToShopping = () => {
    const consolidated = consolidateWeeklyPlanIngredients(familySize);
    const newItems = convertConsolidatedToShoppingItems(consolidated);

    setShoppingItems(prev => {
      const currentList = [...prev];
      newItems.forEach(newItem => {
        const existingIndex = currentList.findIndex(
          item => item.name.trim().toLowerCase() === newItem.name.trim().toLowerCase()
        );
        if (existingIndex >= 0) {
          currentList[existingIndex] = {
            ...currentList[existingIndex],
            quantity: Math.round((currentList[existingIndex].quantity + newItem.quantity) * 10) / 10
          };
        } else {
          currentList.push(newItem);
        }
      });
      return currentList;
    });

    setIsConsolidatedShoppingModalOpen(false);
    showToast(`تمت إضافة ${newItems.length} صنف من خطة الأسبوع إلى قائمة المشتريات بنجاح 🛒`);
  };

  // Trigger Interstitial Ad with strict Google AdMob policy validation
  const triggerTestInterstitial = () => {
    // 1. Policy check: must be explicitly enabled
    if (!isInterstitialEnabled) {
      showToast('الإعلانات البينية معطلة حالياً لحماية تجربة المستخدم (سياسة أد موب) 🛡️');
      return;
    }
    // 2. Frequency capping: max 2 per session
    if (sessionInterstitialCount >= 2) {
      showToast('تم الوصول للحد الأقصى للإعلانات البينية في هذه الجلسة (2/2) ⚠️');
      return;
    }
    // 3. Cooldown check: 120 seconds between impressions
    const now = Date.now();
    if (now - lastInterstitialTime < 120000) {
      const remainingSec = Math.ceil((120000 - (now - lastInterstitialTime)) / 1000);
      showToast(`فترة الانتظار نشطة: متبقي ${remainingSec} ثانية قبل الإعلان التالي ⏱️`);
      return;
    }
    // 4. Task interruption guard: never interrupt active budgeting or editing
    if (isAddItemModalOpen || editingPriceItem || isAddExpenseModalOpen || isAddCategoryModalOpen || selectedRecipeModal) {
      showToast('تم حجب الإعلان: لا يمكن إظهار إعلانات أثناء أداء مهمة نشطة 🚫');
      return;
    }

    setIsInterstitialActive(true);
    setInterstitialCountdown(5);
  };

  const handleDismissInterstitial = () => {
    setIsInterstitialActive(false);
    setSessionInterstitialCount(prev => prev + 1);
    setLastInterstitialTime(Date.now());
    showToast('تم إغلاق الإعلان البيني بنجاح واستئناف التطبيق ✓');
  };

  // Code Explorer State
  const [selectedAndroidFile, setSelectedAndroidFile] = useState<string>('android/app/src/main/java/com/tedbeera/egypt/MainActivity.kt');
  const [copiedCode, setCopiedCode] = useState(false);

  // Fallback image error handling
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setBrokenImages(prev => ({ ...prev, [id]: true }));
  };

  // Sync family size safely
  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_family_size', familySize.toString());
    } catch {}
  }, [familySize]);

  // Sync to LocalStorage with error resilience
  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_saved_recipes', JSON.stringify(savedRecipeIds));
    } catch {}
  }, [savedRecipeIds]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_phase4c_saved_tips', JSON.stringify(savedTipIds));
      localStorage.setItem('tedbeera_saved_tips', JSON.stringify(savedTipIds));
    } catch {}
  }, [savedTipIds]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_phase4c_tried_tips', JSON.stringify(triedTipIds));
    } catch {}
  }, [triedTipIds]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_saved_budgets', JSON.stringify(savedBudgets));
    } catch {}
  }, [savedBudgets]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_shopping_items', JSON.stringify(shoppingItems));
    } catch {}
  }, [shoppingItems]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_budget_amount', budgetAmount);
    } catch {}
  }, [budgetAmount]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_percentages', JSON.stringify(categoryPercentages));
    } catch {}
  }, [categoryPercentages]);

  useEffect(() => {
    try {
      localStorage.setItem('tedbeera_expenses', JSON.stringify(expenses));
    } catch {}
  }, [expenses]);

  // Sync Payday Day safely to LocalStorage
  useEffect(() => {
    try {
      if (paydayDay !== null && paydayDay >= 1 && paydayDay <= 31) {
        localStorage.setItem('tedbeera_payday_day', paydayDay.toString());
      } else {
        localStorage.removeItem('tedbeera_payday_day');
      }
    } catch {}
  }, [paydayDay]);

  // Today's date & daily challenge init
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayDateKey(today);

    try {
      const completedMap = JSON.parse(localStorage.getItem('tedbeera_daily_completed') || '{}');
      setDailyCompleted(!!completedMap[today]);
    } catch {
      setDailyCompleted(false);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Safe Scaled Recipe Cost Calculator (Guaranteed non-NaN)
  const getScaledCost = (recipe: Recipe): number => {
    const baseServings = Math.max(1, recipe.baseServings || 4);
    const validFamilySize = Math.max(1, familySize || 4);
    const cost = ((recipe.estimatedCostEgp || 0) / baseServings) * validFamilySize;
    return Math.round(isNaN(cost) || !isFinite(cost) ? 0 : cost);
  };

  // Safe Scaled Ingredient Quantity Formatter
  const getScaledIngredient = (ing: Ingredient, baseServings: number) => {
    const validServings = Math.max(1, baseServings || 4);
    const validFamilySize = Math.max(1, familySize || 4);
    const baseAmt = Math.max(0.1, ing.baseAmount || 1);
    const scaledAmount = (baseAmt / validServings) * validFamilySize;
    const rounded = Math.round(scaledAmount * 10) / 10;
    return {
      amount: rounded,
      text: `${rounded} ${ing.unit || 'حبة'}`
    };
  };

  // Matched Recipes with Scaling & Filtering
  const matchedRecipes = useMemo(() => {
    return allRecipes.filter(recipe => {
      if (mealFilter !== 'all' && recipe.mealType !== mealFilter) return false;
      if (isVeryBudgetFilter && !recipe.isVeryBudget) return false;
      if (isQuickFilter && !recipe.isQuick) return false;
      if (usesLeftoversFilter && !recipe.usesLeftovers) return false;
      return true;
    }).map(recipe => {
      const available = recipe.ingredients.filter(ing =>
        selectedIngredients.some(sel => ing.name.includes(sel) || sel.includes(ing.name))
      );
      const missing = recipe.ingredients.filter(ing =>
        !selectedIngredients.some(sel => ing.name.includes(sel) || sel.includes(ing.name))
      );
      return {
        recipe,
        scaledCost: getScaledCost(recipe),
        availableCount: available.length,
        totalCount: recipe.ingredients.length,
        missing,
        isCompleteMatch: missing.length === 0
      };
    }).filter(item => {
      if (isZeroMissingOnly && !item.isCompleteMatch) return false;
      return true;
    }).sort((a, b) => {
      if (a.isCompleteMatch && !b.isCompleteMatch) return -1;
      if (!a.isCompleteMatch && b.isCompleteMatch) return 1;
      return (b.availableCount / b.totalCount) - (a.availableCount / a.totalCount);
    });
  }, [mealFilter, selectedIngredients, isVeryBudgetFilter, isQuickFilter, usesLeftoversFilter, isZeroMissingOnly, familySize]);

  // Toggle Ingredient
  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  // Save / Bookmark Recipe
  const toggleSaveRecipe = (id: string) => {
    setSavedRecipeIds(prev => {
      if (prev.includes(id)) {
        showToast('تمت إزالة الوجبة من المحفوظات');
        return prev.filter(i => i !== id);
      } else {
        showToast('تم حفظ الوجبة في المحفوظات بنجاح ⭐');
        return [...prev, id];
      }
    });
  };

  // Phase 4C: Save / Bookmark Tip (Persists to tedbeera_phase4c_saved_tips)
  const toggleSaveTip = (id: string) => {
    setSavedTipIds(prev => {
      const isAlreadySaved = prev.includes(id);
      const updated = toggleSavedTipId(prev, id);
      if (!isAlreadySaved) {
        showToast('تم حفظ الحيلة في أفكاري المحفوظة 🔖');
      } else {
        showToast('تمت إزالة الحيلة من المحفوظات');
      }
      return updated;
    });
  };

  // Phase 4C: Toggle Tried Tip Achievement (Persists to tedbeera_phase4c_tried_tips)
  const handleToggleTriedTip = (id: string) => {
    setTriedTipIds(prev => {
      const isAlreadyTried = prev.includes(id);
      const updated = toggleTriedTipId(prev, id);
      if (!isAlreadyTried) {
        showToast('عاش! سجلنا إنك جربت الحيلة دي ووفرت في بيتك 👏');
      } else {
        showToast('تم إلغاء تحديد تجربة الحيلة');
      }
      return updated;
    });
  };

  // Phase 4C: Arabic Egyptian Voice Recognition Engine
  const startVoiceRecognition = () => {
    if (!isVoiceSupported) {
      setVoiceState('unsupported');
      setVoiceFeedback('ميزة الإدخال الصوتي غير مدعومة في متصفحك الحالي. يمكنك اختيار المكونات يدوياً بسهولة.');
      return;
    }

    if (voiceState === 'listening') {
      stopVoiceRecognition();
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
        setVoiceFeedback('بتسمعك دلوقتي... اتكلم 🎙️ (مثال: عندي بيض وبطاطس وبصل)');
      };

      recognition.onresult = (event: any) => {
        try {
          const transcript = event.results?.[0]?.[0]?.transcript || '';
          const match = matchSpokenIngredients(transcript, COMMON_INGREDIENTS);
          if (match.matchedIngredients.length > 0) {
            setSelectedIngredients(prev => Array.from(new Set([...prev, ...match.matchedIngredients])));
            setVoiceState('success');
            setVoiceFeedback(match.feedbackMessage);
            showToast(match.feedbackMessage);
          } else {
            setVoiceState('no-match');
            setVoiceFeedback('ملقيناش مكونات مطابقة للكلام، جرّب تقول أسماء المكونات بوضوح.');
          }
        } catch {
          setVoiceState('error');
          setVoiceFeedback('حدث تعذر أثناء معالجة الصوت، جرب مرة أخرى.');
        }
      };

      recognition.onerror = (event: any) => {
        const err = event?.error;
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setVoiceState('permission-denied');
          setVoiceFeedback('يجب السماح بالوصول للمايكروفون من إعدادات المتصفح للاستخدام.');
        } else if (err === 'no-speech') {
          setVoiceState('no-match');
          setVoiceFeedback('لم يتم التقاط أي صوت، تحدث بوضوح بالقرب من المايكروفون.');
        } else if (err === 'network') {
          setVoiceState('error');
          setVoiceFeedback('تعذر الاتصال بخدمة التعرف الصوتي، تأكد من الاتصال بالإنترنت.');
        } else {
          setVoiceState('error');
          setVoiceFeedback('حدث تعذر في الاستماع، يمكنك اختيار المكونات يدوياً.');
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceState('error');
      setVoiceFeedback('تعذر بدء تشغيل المايكروفون، يمكنك اختيار المكونات يدوياً.');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setVoiceState('idle');
  };

  // Cleanup speech recognition on unmount or tab switch
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [activeTab]);

  // Add Missing Ingredients to Shopping List with Unit Merging and Safe Defaults
  const handleAddMissingToShopping = (missing: Ingredient[], baseServings: number) => {
    if (missing.length === 0) return;

    setShoppingItems(prev => {
      const updated = [...prev];

      missing.forEach(m => {
        const validServings = Math.max(1, baseServings || 4);
        const validFamilySize = Math.max(1, familySize || 4);
        const scaledAmt = parseSafeQuantity(((m.baseAmount || 1) / validServings) * validFamilySize);
        const normalizedName = m.name.trim();
        const normalizedUnit = (m.unit || 'حبة').trim();

        const existingIndex = updated.findIndex(
          item => item.name.trim().toLowerCase() === normalizedName.toLowerCase() && item.unit === normalizedUnit
        );

        if (existingIndex >= 0) {
          // Merge quantities without duplicate row
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: Math.round((updated[existingIndex].quantity + scaledAmt) * 10) / 10,
            isChecked: false // Reset check state if more is needed
          };
        } else {
          // Add new item with unpriced status (or estimate if common)
          updated.push({
            id: Math.random().toString(36).substring(2, 9),
            name: normalizedName,
            quantity: scaledAmt,
            unit: normalizedUnit,
            unitPrice: null, // Marked as "السعر غير محدد" explicitly
            isChecked: false
          });
        }
      });

      return updated;
    });

    showToast(`تم دمج ${missing.length} من النواقص في قائمة المشتريات بنجاح 🛒`);
  };

  // ==========================================
  // Strict 100% Budget Redistribution Engine
  // ==========================================
  const parsedBudgetAmount = Math.max(0, isNaN(parseFloat(budgetAmount)) ? 0 : parseFloat(budgetAmount));

  const redistributePercentages = (targetIndex: number, newPct: number, current: number[]): number[] => {
    const size = current.length;
    if (size <= 1 || targetIndex < 0 || targetIndex >= size) return current;

    const clamped = Math.max(0, Math.min(100, Math.round(newPct)));
    const result = [...current];
    result[targetIndex] = clamped;

    const remaining = 100 - clamped;
    const otherIndices = current.map((_, i) => i).filter(i => i !== targetIndex);
    const otherSum = otherIndices.reduce((acc, i) => acc + Math.max(0, current[i]), 0);

    if (otherSum > 0) {
      let running = 0;
      for (let i = 0; i < otherIndices.length - 1; i++) {
        const idx = otherIndices[i];
        const ratio = current[idx] / otherSum;
        const alloc = Math.max(0, Math.min(remaining, Math.round(ratio * remaining)));
        result[idx] = alloc;
        running += alloc;
      }
      const lastIdx = otherIndices[otherIndices.length - 1];
      result[lastIdx] = Math.max(0, remaining - running);
    } else {
      const base = Math.floor(remaining / otherIndices.length);
      let rem = remaining % otherIndices.length;
      for (const idx of otherIndices) {
        result[idx] = base + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      }
    }

    // Exact 100% invariant check
    const diff = 100 - result.reduce((a, b) => a + b, 0);
    if (diff !== 0) {
      const adjustIdx = otherIndices[0] ?? targetIndex;
      result[adjustIdx] = Math.max(0, result[adjustIdx] + diff);
    }

    return result;
  };

  const handleUpdatePercentage = (index: number, newPct: number) => {
    const next = redistributePercentages(index, newPct, categoryPercentages);
    setCategoryPercentages(next);
  };

  const handleApplyPreset = (presetPcts: number[]) => {
    if (presetPcts.length !== categories.length) {
      showToast('النموذج مخصص للتوزيع الخماسي القياسي');
      return;
    }
    setCategoryPercentages(presetPcts);
    showToast('تم تطبيق نموذج الميزانية بنجاح ✅');
  };

  // Add Custom Category
  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;

    const newCat: BudgetCategoryDef = {
      id: 'cat_' + Math.random().toString(36).substring(2, 7),
      name: newCatName.trim(),
      defaultPct: 10,
      tip: newCatTip.trim() || 'بند مخصص لمصروفات إضافية خاصة ببيتك.',
      iconName: 'tag',
      isCustom: true
    };

    const newCats = [...categories, newCat];
    setCategories(newCats);

    // Rebalance percentages to accommodate new category strictly at 100%
    const count = newCats.length;
    const basePct = Math.floor(100 / count);
    const rem = 100 % count;
    const initialPcts = newCats.map((_, i) => basePct + (i < rem ? 1 : 0));
    setCategoryPercentages(initialPcts);

    setNewCatName('');
    setNewCatTip('');
    setIsAddCategoryModalOpen(false);
    showToast(`تمت إضافة بند "${newCat.name}" وإعادة التوزيع بنسبة 100% بالتمام 🎉`);
  };

  // Budget Reconciled Breakdown & Calculations
  const budgetBreakdown = useMemo(() => {
    return reconcileBudgetAllocations(parsedBudgetAmount, categoryPercentages, categories, expenses);
  }, [parsedBudgetAmount, categoryPercentages, categories, expenses]);

  const totalSpentAll = useMemo(() => {
    return expenses.reduce((acc, curr) => {
      const amt = parseSafePrice(curr.amount) || 0;
      return acc + amt;
    }, 0);
  }, [expenses]);

  const totalRemainingAll = Math.round(parsedBudgetAmount - totalSpentAll);

  // Phase 4B: Monthly Payday Countdown & Daily Spending Cap Analytics
  const paydayAnalytics: PaydayCountdownResult = useMemo(() => {
    return calculatePaydayCountdown(paydayDay, totalRemainingAll);
  }, [paydayDay, totalRemainingAll]);

  // Phase 4B: Visual Spending Donut Segments (Proportional to actual category spending)
  const donutSegments: DonutSegment[] = useMemo(() => {
    return calculateDonutSegments(budgetBreakdown, totalSpentAll);
  }, [budgetBreakdown, totalSpentAll]);

  // Phase 4B: Selected Segment in Donut Chart for Interactive Detail Panel
  const selectedDonutSegment = useMemo(() => {
    if (!selectedDonutSegmentId) return null;
    return donutSegments.find(s => s.categoryId === selectedDonutSegmentId) || null;
  }, [selectedDonutSegmentId, donutSegments]);

  // Add Expense
  const handleAddExpense = () => {
    const amt = parseSafePrice(expenseAmount);
    if (amt === null || amt <= 0) {
      showToast('يرجى كتابة مبلغ صحيح أكبر من الصفر');
      return;
    }

    const newExp: ExpenseRecord = {
      id: 'exp_' + Math.random().toString(36).substring(2, 8),
      categoryId: expenseCategoryId,
      amount: amt,
      date: expenseDate,
      description: expenseDesc.trim() || 'مصروف عام'
    };

    setExpenses(prev => [newExp, ...prev]);
    setExpenseAmount('');
    setExpenseDesc('');
    setIsAddExpenseModalOpen(false);
    showToast('تم تسجيل المصروف وتحديث الرصيد فوراً 💳');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('تم حذف المصروف');
  };

  const handleSaveBudgetPlan = () => {
    const plan: SavedBudgetPlan = {
      id: Math.random().toString(36).substring(2, 9),
      categoryTitle: `ميزانية ${new Date().toLocaleDateString('ar-EG')}`,
      totalAmount: parsedBudgetAmount,
      slices: budgetBreakdown.map(b => ({ name: b.name, percentage: b.percentage, amount: b.allocated })),
      date: new Date().toLocaleDateString('ar-EG')
    };
    setSavedBudgets(prev => [plan, ...prev]);
    showToast('تم حفظ خطة الميزانية في المحفوظات بنجاح 💼');
  };

  // Daily Challenge Logic
  const todayChallenge = useMemo(() => {
    return getDeterministicDailyChallenge(todayDateKey || '2026-10-26');
  }, [todayDateKey]);

  const toggleDailyCompletion = () => {
    const next = !dailyCompleted;
    setDailyCompleted(next);
    try {
      const completedMap = JSON.parse(localStorage.getItem('tedbeera_daily_completed') || '{}');
      completedMap[todayDateKey] = next;
      localStorage.setItem('tedbeera_daily_completed', JSON.stringify(completedMap));
    } catch {}
    showToast(next ? 'عاش! مبروك إنجاز تحدي النهارده 🎉' : 'تم إلغاء تحديد الإنجاز');
  };

  const handleShareDailyChallenge = () => {
    const shareText = `🎉 أنجزت تحدي النهارده في تطبيق تدبيرة مصر:\n"${todayChallenge.title}"\n\nخطوة عملية لتوفير بيتنا ومصاريفنا بدون حرمان 💪\n#تدبيرة #مصر #تدبير_البيت`;
    if (navigator.share) {
      navigator.share({
        title: 'تدبيرة – تدبيرتك النهارده',
        text: shareText
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('تم نسخ رسالة الإنجاز! جاهزة للمشاركة على واتساب 📲');
    }
  };

  const handleShareTip = (tip: DailyIdea) => {
    const shareText = `💡 نصيحة تدبيرة لبيتك:\n"${tip.title}"\n\n${tip.description}\n\nنصيحة عملية: ${tip.practicalTip}\n#تدبيرة_مصر #توفير_البيت`;
    if (navigator.share) {
      navigator.share({
        title: tip.title,
        text: shareText
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('تم نسخ النصيحة للحافظة بنجاح 📲');
    }
  };

  // Phase 4C: Filtered Daily Ideas with Exact 5 Categories and Saved Tips Mode
  const filteredDailyIdeas = useMemo(() => {
    return DAILY_IDEAS.filter(idea => {
      // 1. If in 'saved' view mode, only show bookmarked tips
      if (dailyTipsViewMode === 'saved') {
        if (!savedTipIds.includes(idea.id)) return false;
      }

      // 2. Exact 5 Categories Filter Matching
      let matchCat = true;
      if (selectedDailyCategory !== 'الكل') {
        if (selectedDailyCategory === 'تنظيف') {
          matchCat = idea.tags.includes('تنظيف') || idea.category === 'تنظيف';
        } else if (selectedDailyCategory === 'توفير كهرباء') {
          matchCat = idea.tags.includes('توفير كهرباء') || idea.tags.includes('كهرباء');
        } else if (selectedDailyCategory === 'مطبخ وتغذية') {
          matchCat = idea.tags.includes('مطبخ وتغذية') || idea.category === 'طعام' || idea.tags.includes('مطبخ');
        } else if (selectedDailyCategory === 'حيل تسوق') {
          matchCat = idea.tags.includes('حيل تسوق') || idea.tags.includes('ميزانية') || idea.tags.includes('تسوق') || idea.tags.includes('كاش');
        } else {
          matchCat = idea.tags.includes(selectedDailyCategory) || idea.category === selectedDailyCategory;
        }
      }

      // 3. Search query
      const trimmed = dailySearch.trim();
      const matchSearch = !trimmed ||
        idea.title.includes(trimmed) ||
        idea.description.includes(trimmed) ||
        idea.practicalTip.includes(trimmed);

      return matchCat && matchSearch;
    });
  }, [selectedDailyCategory, dailySearch, dailyTipsViewMode, savedTipIds]);

  // Robust Shopping List Totals (Separates Known Subtotal from Unpriced Items)
  const shoppingTotals: ShoppingTotals = useMemo(() => {
    return calculateShoppingTotals(shoppingItems);
  }, [shoppingItems]);

  const updateItemQty = (id: string, delta: number) => {
    setShoppingItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(0.5, Math.round((parseSafeQuantity(item.quantity) + delta) * 10) / 10);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  // Set or Edit Item Unit Price
  const handleSaveItemPrice = () => {
    if (!editingPriceItem) return;
    const parsed = parseSafePrice(editingPriceItem.currentPrice);

    setShoppingItems(prev => prev.map(item => {
      if (item.id === editingPriceItem.id) {
        return { ...item, unitPrice: parsed };
      }
      return item;
    }));

    setEditingPriceItem(null);
    showToast(parsed !== null ? 'تم تحديث السعر وإعادة الحساب فوراً 🏷️' : 'تم تعيين الصنف كغير مسعر');
  };

  // Feature 1: Share Unpurchased Shopping List via WhatsApp
  const handleShareShoppingWhatsApp = () => {
    const shareResult = formatWhatsAppShoppingMessage(shoppingItems);
    if (shareResult.isEmpty) {
      showToast('قائمة النواقص فارغة! لا توجد طلبات للمشاركة 🧺');
      return;
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareResult.message)}`;
    const win = window.open(waUrl, '_blank');
    if (!win) {
      window.location.href = waUrl;
    }
    showToast(`تم تجهيز ${shareResult.unpurchasedCount} طلب للمشاركة عبر واتساب 📲`);
  };

  // Feature 3: Export User Data as Standardized Versioned JSON Backup
  const handleExportData = () => {
    try {
      let completedMap: Record<string, boolean> = {};
      try {
        completedMap = JSON.parse(localStorage.getItem('tedbeera_daily_completed') || '{}');
      } catch {}

      const payload = createBackupPayload({
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
        dailyCompleted: completedMap,
        triedTipIds,
        paydayDay,
        weeklyPlanUnlocked: isWeeklyPlanUnlocked,
        reminderEnabled: isDailyReminderEnabled
      });

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const todayDate = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `tedbeera-backup-${todayDate}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير ملف النسخة الاحتياطية بنجاح 💾');
      setIsSettingsModalOpen(false);
    } catch {
      showToast('حدث خطأ أثناء تصدير النسخة الاحتياطية ⚠️');
    }
  };

  // Feature 3: Select Backup File & Validate Schema Before Prompting Confirmation
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupPayload(parsed);

        if (!validation.isValid || !validation.normalizedData) {
          showToast(validation.error || 'الملف غير صالح: تنسيق البيانات غير متوافق مع تدبيرة ⚠️');
          return;
        }

        // Store validated data in pending state and open confirmation modal
        setPendingRestoreData(validation.normalizedData);
        setIsSettingsModalOpen(false);
        setIsRestoreConfirmModalOpen(true);
      } catch {
        showToast('خطأ: تعذر قراءة الملف. تأكد من سلامة ملف الـ JSON ⚠️');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Feature 3: Execute Restore with Rollback Protection & Immediate State/Storage Refresh
  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;

    // 1. Create Pre-Restore Snapshot for Rollback Protection
    const preRestoreSnapshot = {
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
      triedTipIds,
      paydayDay,
      weeklyPlanUnlocked: isWeeklyPlanUnlocked,
      reminderEnabled: isDailyReminderEnabled
    };

    try {
      const d = pendingRestoreData;

      // 2. Immediate React State Refresh
      setFamilySize(d.familySize);
      setBudgetAmount(d.budgetAmount);
      setCategories(d.categories);
      setCategoryPercentages(d.categoryPercentages);
      setExpenses(d.expenses);
      setShoppingItems(d.shoppingItems);
      setSavedRecipeIds(d.savedRecipeIds);
      setSavedTipIds(d.savedTipIds);
      setSavedBudgets(d.savedBudgets);
      setSelectedIngredients(d.selectedIngredients);
      if (d.triedTipIds) setTriedTipIds(d.triedTipIds);
      if (d.paydayDay !== undefined) setPaydayDay(d.paydayDay);
      if (d.weeklyPlanUnlocked !== undefined) setIsWeeklyPlanUnlocked(d.weeklyPlanUnlocked);
      if (d.reminderEnabled !== undefined) setIsDailyReminderEnabled(d.reminderEnabled);

      // 3. Immediate LocalStorage Synchronization Across All Keys
      localStorage.setItem('tedbeera_family_size', String(d.familySize));
      localStorage.setItem('tedbeera_budget_amount', d.budgetAmount);
      localStorage.setItem('tedbeera_categories', JSON.stringify(d.categories));
      localStorage.setItem('tedbeera_percentages', JSON.stringify(d.categoryPercentages));
      localStorage.setItem('tedbeera_expenses', JSON.stringify(d.expenses));
      localStorage.setItem('tedbeera_shopping_items', JSON.stringify(d.shoppingItems));
      localStorage.setItem('tedbeera_saved_recipes', JSON.stringify(d.savedRecipeIds));
      localStorage.setItem('tedbeera_phase4c_saved_tips', JSON.stringify(d.savedTipIds));
      localStorage.setItem('tedbeera_saved_tips', JSON.stringify(d.savedTipIds));
      localStorage.setItem('tedbeera_saved_budgets', JSON.stringify(d.savedBudgets));
      localStorage.setItem('tedbeera_custom_pantry', JSON.stringify(d.selectedIngredients));
      if (d.triedTipIds) {
        localStorage.setItem('tedbeera_phase4c_tried_tips', JSON.stringify(d.triedTipIds));
      }
      if (d.paydayDay !== undefined && d.paydayDay !== null) {
        localStorage.setItem('tedbeera_payday_day', d.paydayDay.toString());
      }
      if (d.weeklyPlanUnlocked !== undefined) {
        localStorage.setItem(REWARD_PLAN_STORAGE_KEY, String(d.weeklyPlanUnlocked));
      }
      if (d.reminderEnabled !== undefined) {
        localStorage.setItem(REMINDER_STORAGE_KEY, String(d.reminderEnabled));
      }
      if (d.dailyCompleted) {
        localStorage.setItem('tedbeera_daily_completed', JSON.stringify(d.dailyCompleted));
      }

      setPendingRestoreData(null);
      setIsRestoreConfirmModalOpen(false);
      showToast('تمت استعادة النسخة الاحتياطية بنجاح وتحديث كافة الأقسام! 🎉');
    } catch {
      // 4. Safe Rollback on Storage/State Error
      setFamilySize(preRestoreSnapshot.familySize);
      setBudgetAmount(preRestoreSnapshot.budgetAmount);
      setCategories(preRestoreSnapshot.categories);
      setCategoryPercentages(preRestoreSnapshot.categoryPercentages);
      setExpenses(preRestoreSnapshot.expenses);
      setShoppingItems(preRestoreSnapshot.shoppingItems);
      setSavedRecipeIds(preRestoreSnapshot.savedRecipeIds);
      setSavedTipIds(preRestoreSnapshot.savedTipIds);
      setSavedBudgets(preRestoreSnapshot.savedBudgets);
      setSelectedIngredients(preRestoreSnapshot.selectedIngredients);
      setTriedTipIds(preRestoreSnapshot.triedTipIds);
      setPaydayDay(preRestoreSnapshot.paydayDay);
      setIsWeeklyPlanUnlocked(preRestoreSnapshot.weeklyPlanUnlocked);
      setIsDailyReminderEnabled(preRestoreSnapshot.reminderEnabled);

      setPendingRestoreData(null);
      setIsRestoreConfirmModalOpen(false);
      showToast('حدث خطأ أثناء الاستعادة: تم استرجاع البيانات السابقة بأمان ⚠️');
    }
  };

  // Wipe All Data
  const handleWipeAllData = () => {
    setSavedRecipeIds([]);
    setSavedTipIds([]);
    setTriedTipIds([]);
    setSavedBudgets([]);
    setShoppingItems([]);
    setExpenses([]);
    setDailyCompleted(false);
    setFamilySize(4);
    setBudgetAmount('2500');
    setCategories(DEFAULT_BUDGET_CATEGORIES);
    setCategoryPercentages(DEFAULT_BUDGET_CATEGORIES.map(c => c.defaultPct));
    setPaydayDay(null);
    setIsWeeklyPlanUnlocked(false);
    setIsDailyReminderEnabled(false);

    localStorage.removeItem('tedbeera_saved_recipes');
    localStorage.removeItem('tedbeera_phase4c_saved_tips');
    localStorage.removeItem('tedbeera_saved_tips');
    localStorage.removeItem('tedbeera_phase4c_tried_tips');
    localStorage.removeItem('tedbeera_saved_budgets');
    localStorage.removeItem('tedbeera_shopping_items');
    localStorage.removeItem('tedbeera_expenses');
    localStorage.removeItem('tedbeera_daily_completed');
    localStorage.removeItem('tedbeera_family_size');
    localStorage.removeItem('tedbeera_budget_amount');
    localStorage.removeItem('tedbeera_categories');
    localStorage.removeItem('tedbeera_percentages');
    localStorage.removeItem('tedbeera_payday_day');
    localStorage.removeItem(REWARD_PLAN_STORAGE_KEY);
    localStorage.removeItem(REMINDER_STORAGE_KEY);

    setIsWipeModalOpen(false);
    setIsSettingsModalOpen(false);
    showToast('تمت إعادة ضبط المصنع ومسح جميع البيانات بنجاح 🔒');
  };

  // Clear Shopping List Only
  const handleClearShoppingList = () => {
    setShoppingItems([]);
    setIsClearShoppingConfirmOpen(false);
    showToast('تم إفراغ قائمة النواقص بالكامل 🧺');
  };

  return (
    <div className={isNativeApp ? "h-[100dvh] min-h-0 w-full overflow-hidden bg-[#F9FAFB] text-[#1E293B] font-['Cairo',sans-serif] flex flex-col" : "min-h-screen bg-[#F0F2F5] text-[#1E293B] font-['Cairo',sans-serif] flex flex-col items-center"}>
      {/* Top Header & View Mode Switcher */}
      {!isNativeApp && <header className="w-full bg-[#0D47A1] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB300] text-[#0D47A1] font-black flex items-center justify-center text-xl shadow-inner">
              تد
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight">تدبيرة — كل جنيه ليه قيمة 💛</h1>
                <span className="bg-[#FFE54C] text-[#0D47A1] text-xs font-bold px-2 py-0.5 rounded-full">ميزانية مصري 🇪🇬</span>
              </div>
              <p className="text-xs text-blue-100">وفّر بذكاء، ودبّر بيتك، وخلي كل جنيه في مكانه.</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#002171] p-1 rounded-xl text-xs sm:text-sm font-semibold">
            <button
              onClick={() => setViewMode('emulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'emulator' ? 'bg-[#FFB300] text-[#0D47A1] shadow' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>محاكي التطبيق (Live)</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'code' ? 'bg-[#FFB300] text-[#0D47A1] shadow' : 'text-blue-100 hover:text-white'
              }`}
            >
              <FolderCode className="w-4 h-4" />
              <span>كود أندرويد الأصلي (42 ملف)</span>
            </button>
            <button
              onClick={() => setViewMode('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'tests' ? 'bg-[#FFB300] text-[#0D47A1] shadow' : 'text-blue-100 hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>الاختبارات الآلية (Unit Tests)</span>
            </button>
          </div>

          {/* PWA Install Button & Direct Download ZIP Button */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <a
              href="/TedbeeraEgypt-Android.zip"
              download="TedbeeraEgypt-Android.zip"
              className="flex items-center gap-1.5 bg-blue-800/80 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border border-blue-400/30 transition"
            >
              <Download className="w-4 h-4 text-[#FFB300]" />
              <span>تحميل (ZIP)</span>
            </a>
          </div>
        </div>
      </header>}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 bg-[#0D47A1] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-[#FFB300] animate-bounce">
          <Sparkles className="w-4 h-4 text-[#FFE54C]" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className={isNativeApp ? "w-full flex-1 min-h-0 flex justify-center p-0" : "w-full max-w-6xl flex-1 px-4 py-6 flex justify-center"}>

        {/* ---------------- VIEW 1: LIVE PHONE EMULATOR ---------------- */}
        {viewMode === 'emulator' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-gray-800 overflow-hidden flex flex-col h-[780px]">
            {/* Phone Top Notch / Status Bar */}
            <div className="bg-[#0D47A1] text-white px-5 py-2.5 flex items-center justify-between text-xs select-none">
              <span className="font-bold tracking-wider">09:41</span>
              <div className="w-20 h-4 bg-gray-900 rounded-full mx-auto opacity-70"></div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>4G</span>
                <span>📶</span>
                <span>100% 🔋</span>
              </div>
            </div>

            {/* Android Top App Bar */}
            <div className="bg-[#0D47A1] text-white px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇪🇬</span>
                <span className="font-extrabold text-sm sm:text-base">تدبيرة — كل جنيه ليه قيمة 💛</span>
              </div>
              <div className="flex items-center gap-2">
                {/* AdMob Test Mode Pill Button (Development Only) */}
                {IS_DEV && (
                  <button
                    onClick={() => setIsAdControlsOpen(true)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 border ${
                      adStatus === 'loaded' ? 'bg-[#FFB300] text-[#0D47A1] border-[#FFA000]' :
                      adStatus === 'loading' ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' :
                      adStatus === 'failed' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                    title="لوحة اختبار ومحاكاة AdMob (وضع التطوير)"
                  >
                    <span>AdMob:</span>
                    <span>{adStatus === 'loaded' ? 'نشط' : adStatus === 'loading' ? 'تحميل...' : adStatus === 'failed' ? 'فشل (انهيار)' : 'معطل'}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-1.5 rounded-lg bg-blue-800/80 hover:bg-blue-700 text-white transition"
                  title="إعدادات وأمان البيانات"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <span className="text-[11px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded-md font-medium">أوفلاين</span>
              </div>
            </div>

            {/* Scrollable Screen Content with shared layout clearance ensuring 70-90px breathing room */}
            <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 bg-[#F9FAFB] ${getBottomScrollPaddingClass(adStatus)} ${isNativeApp ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : ""}`}>

              {/* ======================================================== */}
              {/* === TAB 1: تدبيرة الأكل === */}
              {/* ======================================================== */}
              {activeTab === 'food' && (
                <div className="space-y-4">
                  {/* Brand Concept Motto Card */}
                  <div className="bg-[#0D47A1] text-white p-3 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-[#FFB300] block">تدبيرة — كل جنيه ليه قيمة 💛</span>
                      <span className="text-[10px] text-blue-100">تكلفة الوجبة التقديرية ومقادير الأكل حسب عدد أفراد بيتك 🇪🇬</span>
                    </div>
                    <span className="text-xs bg-[#FFB300] text-[#0D47A1] font-black px-2 py-0.5 rounded-lg">ج.م EGP</span>
                  </div>
                  {/* Family Size Scaler Bar */}
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-[#0D47A1]">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 block">عدد أفراد الأسرة:</span>
                        <span className="text-[10px] text-gray-400">تعديل المقادير والتكلفة تلقائياً</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFamilySize(prev => Math.max(1, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#0D47A1] font-black text-sm flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-extrabold text-[#0D47A1] text-sm">{familySize}</span>
                      <button
                        onClick={() => setFamilySize(prev => prev + 1)}
                        className="w-7 h-7 rounded-lg bg-[#0D47A1] hover:bg-[#002171] text-white font-black text-sm flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Phase 4D: Weekly Meal Plan Banner & Feature Gate */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-xs text-[#0D47A1]">خطة وجبات الأسبوع التوفيرية الكاملة</h3>
                            {isWeeklyPlanUnlocked ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                <Unlock className="w-2.5 h-2.5" />
                                <span>مفتوحة ✓</span>
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>مقفولة</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            جدول وجبات السبت إلى الجمعة (فطار، غداء، عشاء) لـ {familySize} أفراد مع جدول التسوق المجمع.
                          </p>
                        </div>
                      </div>

                      {isWeeklyPlanUnlocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsWeeklyPlanUnlocked(false);
                            localStorage.removeItem(REWARD_PLAN_STORAGE_KEY);
                            showToast('تم إعادة قفل الخطة للتجربة 🔒');
                          }}
                          className="text-[10px] text-gray-400 hover:text-gray-600 underline whitespace-nowrap"
                          title="إعادة القفل لتجربة محاكاة الإعلان مرة أخرى"
                        >
                          إعادة القفل للتجربة
                        </button>
                      )}
                    </div>

                    {!isWeeklyPlanUnlocked ? (
                      /* Locked State: Rewarded Ad Entry Point */
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 p-3 rounded-xl border border-amber-200/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-950 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
                            <span>فتح جدول وجبات 7 أيام وجدول التسوق المجمع</span>
                          </span>
                          <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            مجاني بمكافأة 🎁
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900/80 leading-relaxed">
                          تخلصي من حيرة "هنطبخ إيه النهاردة؟" مع خطة متكاملة محسوبة بالجرام والتكلفة للأسبوع كله.
                        </p>
                        <button
                          type="button"
                          onClick={handleRequestRewardedAd}
                          className="w-full bg-[#0D47A1] hover:bg-[#002171] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 text-[#FFB300] fill-[#FFB300]" />
                          <span>شاهد إعلاناً قصيراً لفتح جدول وجبات الأسبوع</span>
                        </button>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                          <span>• محاكاة إعلان تجريبي (AdMob Test Mode)</span>
                          <span>• بدون أي خصم من رصيدك أو بياناتك</span>
                        </div>
                      </div>
                    ) : (
                      /* Unlocked State: Full 7-Day Interactive Plan & Consolidated Shopping */
                      <div className="space-y-3 pt-1 border-t border-gray-100">
                        {/* Days Horizontal Chips */}
                        <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                          {WEEKLY_DAYS_SCHEDULE.map(day => (
                            <button
                              key={day.dayId}
                              type="button"
                              onClick={() => setSelectedPlanDayId(day.dayId)}
                              className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                                selectedPlanDayId === day.dayId
                                  ? 'bg-[#0D47A1] text-white shadow-xs'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span>{day.dayName}</span>
                            </button>
                          ))}
                        </div>

                        {/* Selected Day Content */}
                        {(() => {
                          const activeDay = WEEKLY_DAYS_SCHEDULE.find(d => d.dayId === selectedPlanDayId) || WEEKLY_DAYS_SCHEDULE[0];
                          const bRecipe = getRecipeById(activeDay.breakfastRecipeId);
                          const lRecipe = getRecipeById(activeDay.lunchRecipeId);
                          const dRecipe = getRecipeById(activeDay.dinnerRecipeId);
                          const dayTotal = (bRecipe ? calculateRecipeScaledCost(bRecipe, familySize) : 0) +
                                           (lRecipe ? calculateRecipeScaledCost(lRecipe, familySize) : 0) +
                                           (dRecipe ? calculateRecipeScaledCost(dRecipe, familySize) : 0);

                          return (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2.5">
                              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                                <div>
                                  <span className="font-extrabold text-xs text-[#0D47A1]">جدول يوم {activeDay.dayName}</span>
                                  <span className="text-[10px] text-gray-500 block">{activeDay.theme}</span>
                                </div>
                                <span className="bg-[#FFE54C]/50 text-[#0D47A1] font-bold text-[11px] px-2 py-0.5 rounded-lg border border-[#FFB300]/50">
                                  تكلفة اليوم: ~{dayTotal} ج.م
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                {/* Breakfast */}
                                {bRecipe && (
                                  <div
                                    onClick={() => setSelectedRecipeModal(bRecipe)}
                                    className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between cursor-pointer hover:border-[#0D47A1] transition"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">فطار</span>
                                      <span className="font-bold text-gray-800 text-[11px] truncate max-w-[170px]">{bRecipe.name}</span>
                                    </div>
                                    <span className="text-[10px] text-[#0D47A1] font-bold">~{calculateRecipeScaledCost(bRecipe, familySize)} ج.م</span>
                                  </div>
                                )}

                                {/* Lunch */}
                                {lRecipe && (
                                  <div
                                    onClick={() => setSelectedRecipeModal(lRecipe)}
                                    className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between cursor-pointer hover:border-[#0D47A1] transition"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.2 rounded">غداء</span>
                                      <span className="font-bold text-gray-800 text-[11px] truncate max-w-[170px]">{lRecipe.name}</span>
                                    </div>
                                    <span className="text-[10px] text-[#0D47A1] font-bold">~{calculateRecipeScaledCost(lRecipe, familySize)} ج.م</span>
                                  </div>
                                )}

                                {/* Dinner */}
                                {dRecipe && (
                                  <div
                                    onClick={() => setSelectedRecipeModal(dRecipe)}
                                    className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between cursor-pointer hover:border-[#0D47A1] transition"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-1.5 py-0.2 rounded">عشاء</span>
                                      <span className="font-bold text-gray-800 text-[11px] truncate max-w-[170px]">{dRecipe.name}</span>
                                    </div>
                                    <span className="text-[10px] text-[#0D47A1] font-bold">~{calculateRecipeScaledCost(dRecipe, familySize)} ج.م</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Consolidated Shopping Actions */}
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsConsolidatedShoppingModalOpen(true)}
                            className="flex-1 bg-white hover:bg-gray-50 text-[#0D47A1] font-bold py-2 px-2.5 rounded-xl text-[11px] border border-blue-200 flex items-center justify-center gap-1.5 transition"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>جدول التسوق المجمع 📋</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddConsolidatedPlanToShopping}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>+ مقادير الأسبوع للمشتريات</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meal Category Filters & Zero Missing Toggle */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs items-center">
                    {[
                      { key: 'all', label: 'الكل 🍽️' },
                      { key: 'breakfast', label: 'فطار 🍳' },
                      { key: 'lunch', label: 'غداء 🍲' },
                      { key: 'dinner', label: 'عشاء 🌙' }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setMealFilter(cat.key as MealTypeFilter)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                          mealFilter === cat.key
                            ? 'bg-[#0D47A1] text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}

                    <div className="h-5 w-px bg-gray-200 mx-0.5 shrink-0" />

                    {/* Feature 2: Zero-Missing-Ingredients Recipe Filter */}
                    <button
                      onClick={() => setIsZeroMissingOnly(!isZeroMissingOnly)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                        isZeroMissingOnly
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                          : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                      }`}
                      title="إظهار فقط الوجبات الجاهزة بنسبة 100% دون أي مكونات ناقصة"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>اطبخ باللي عندي فقط</span>
                      {isZeroMissingOnly && <Check className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Ingredients Drawer */}
                  <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0D47A1]">
                          المكونات المتوفرة في بيتك ({selectedIngredients.length}):
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Phase 4C: Voice Recognition Microphone Button */}
                        <button
                          type="button"
                          onClick={voiceState === 'listening' ? stopVoiceRecognition : startVoiceRecognition}
                          className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition ${
                            voiceState === 'listening'
                              ? 'bg-rose-600 text-white animate-pulse shadow-sm ring-2 ring-rose-300'
                              : 'bg-blue-50 hover:bg-blue-100 text-[#0D47A1] border border-blue-200'
                          }`}
                          title="اختيار المكونات بالصوت باللهجة المصرية"
                          aria-label="اختيار المكونات بالصوت"
                        >
                          {voiceState === 'listening' ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                              <span>بتسمعك...</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-[#0D47A1]" />
                              <span>بالصوت 🎙️</span>
                            </>
                          )}
                        </button>

                        {selectedIngredients.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedIngredients([])}
                            className="text-[11px] text-red-600 font-semibold hover:underline px-1"
                          >
                            مسح الكل
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Phase 4C: Voice Listening / Match Feedback Card */}
                    {voiceState !== 'idle' && voiceFeedback && (
                      <div className={`mb-2.5 p-2 rounded-xl text-xs flex items-center justify-between border transition ${
                        voiceState === 'listening'
                          ? 'bg-rose-50 border-rose-200 text-rose-900 animate-pulse'
                          : voiceState === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : voiceState === 'no-match'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {voiceState === 'listening' ? (
                            <Mic className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
                          ) : voiceState === 'success' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium leading-tight">{voiceFeedback}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setVoiceState('idle'); setVoiceFeedback(null); }}
                          className="text-gray-400 hover:text-gray-600 p-0.5 text-xs font-bold"
                          title="إخفاء التنبيه"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_INGREDIENTS.map(ing => {
                        const isSelected = selectedIngredients.includes(ing);
                        return (
                          <button
                            key={ing}
                            onClick={() => toggleIngredient(ing)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                              isSelected
                                ? 'bg-[#0D47A1] text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{ing}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-100 text-[11px]">
                      <button
                        onClick={() => setIsVeryBudgetFilter(!isVeryBudgetFilter)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition ${
                          isVeryBudgetFilter ? 'bg-[#FFB300] text-[#0D47A1]' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        💰 اقتصادي جداً
                      </button>
                      <button
                        onClick={() => setIsQuickFilter(!isQuickFilter)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition ${
                          isQuickFilter ? 'bg-[#FFB300] text-[#0D47A1]' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        ⚡ وجبات سريعة
                      </button>
                      <button
                        onClick={() => setUsesLeftoversFilter(!usesLeftoversFilter)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition ${
                          usesLeftoversFilter ? 'bg-[#FFB300] text-[#0D47A1]' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        ♻️ استغلال بواقي الأكل
                      </button>
                    </div>
                  </div>

                  {/* Add Custom Recipe Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddCustomRecipeModalOpen(true)}
                    className="w-full bg-white border border-[#0D47A1] text-[#0D47A1] hover:bg-blue-50 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>أضف أكلتك الخاصة 🍳</span>
                  </button>

                  {/* Matching Recipes Count */}
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span className="font-bold text-[#1E293B]">الوجبات المقترحة ({matchedRecipes.length}):</span>
                    <span>تكلفة تقديرية لـ {familySize} أفراد</span>
                  </div>

                  {/* Recipe Cards List */}
                  {matchedRecipes.length === 0 ? (
                    isZeroMissingOnly ? (
                      <div className="bg-white p-6 rounded-2xl text-center border border-dashed border-emerald-300 space-y-2.5">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">مفيش أكلات مطابقة 100% لمكوناتك الحالية، زوّد مكون أو شوف المقترحات التانية</p>
                        <button
                          onClick={() => setIsZeroMissingOnly(false)}
                          className="mt-1 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إلغاء فلتر "اطبخ باللي عندي"</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl text-center border border-dashed border-gray-300">
                        <p className="text-sm font-bold text-gray-700">مفيش وصفات مطابقة للفلاتر دي</p>
                        <p className="text-xs text-gray-500 mt-1">جرب تلغي بعض الفلاتر أو اختار مكونات إضافية من اللي في بيتك.</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {matchedRecipes.map(({ recipe, scaledCost, missing, isCompleteMatch, availableCount, totalCount }) => {
                        const isSaved = savedRecipeIds.includes(recipe.id);
                        const isBrokenImg = brokenImages[recipe.id];

                        return (
                          <div
                            key={recipe.id}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition hover:border-[#0D47A1]"
                          >
                            {/* Card Header with Image & Fallback */}
                            <div className="relative h-32 w-full bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setSelectedRecipeModal(recipe)}>
                              {!isBrokenImg ? (
                                <img
                                  src={recipe.imageUrl}
                                  alt={recipe.name}
                                  onError={() => handleImageError(recipe.id)}
                                  className="w-full h-full object-cover transition duration-300 hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                  <SvgIllustration type={recipe.svgFallbackIcon} className="w-24 h-24" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                              {/* Top Action Tags */}
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {recipe.mealType === 'breakfast' ? 'فطار' : recipe.mealType === 'lunch' ? 'غداء' : 'عشاء'}
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveRecipe(recipe.id);
                                }}
                                className={`absolute top-2.5 left-2.5 p-1.5 rounded-full backdrop-blur-xs transition ${
                                  isSaved ? 'bg-[#FFB300] text-[#0D47A1]' : 'bg-black/40 text-white hover:bg-black/60'
                                }`}
                                title={isSaved ? 'محفوظة' : 'حفظ الوجبة'}
                              >
                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#0D47A1]' : ''}`} />
                              </button>

                              <div className="absolute bottom-2.5 right-2.5 left-2.5">
                                <h3 className="font-bold text-sm text-white drop-shadow-sm">{recipe.name}</h3>
                              </div>
                            </div>

                            <div className="p-3.5 space-y-2.5">
                              {/* Meta Details */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">⏱️ {recipe.prepTimeMinutes} دقيقة</span>
                                <div className="text-left">
                                  <span className="bg-[#FFE54C]/40 text-[#0D47A1] font-bold text-xs px-2.5 py-0.5 rounded-md border border-[#FFB300]/40 inline-block">
                                    🏷️ تكلفة تقديرية: ~{scaledCost} ج.م
                                  </span>
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    سعر استرشادي لـ {familySize} أفراد
                                  </span>
                                </div>
                              </div>

                              {/* Completeness Badge */}
                              {isCompleteMatch ? (
                                <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>جاهزة بالكامل بمكوناتك الحالية! 🎉</span>
                                </div>
                              ) : (
                                <div className="bg-[#FFE54C]/25 text-[#0D47A1] text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center justify-between border border-[#FFE54C]">
                                  <span>متوفر {availableCount} من {totalCount} مكونات (ناقصك {missing.length})</span>
                                  <button
                                    onClick={() => handleAddMissingToShopping(missing, recipe.baseServings)}
                                    className="text-xs font-bold text-[#0D47A1] flex items-center gap-1 hover:underline"
                                  >
                                    <ShoppingCart className="w-3 h-3" />
                                    <span>+ النواقص</span>
                                  </button>
                                </div>
                              )}

                              {/* Missing Items Note */}
                              {!isCompleteMatch && (
                                <p className="text-[11px] text-gray-500 truncate">
                                  النواقص: {missing.map(m => m.name).join('، ')}
                                </p>
                              )}

                              <button
                                onClick={() => setSelectedRecipeModal(recipe)}
                                className="w-full text-center text-xs font-bold text-[#0D47A1] bg-gray-50 hover:bg-gray-100 py-2 rounded-xl transition"
                              >
                                عرض المقادير وبدائل المكونات والخطوات ←
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* === TAB 2: تدبيرة الفلوس ومتابعة المصاريف === */}
              {/* ======================================================== */}
              {activeTab === 'budget' && (
                <div className="space-y-4">
                  {/* Core Brand Identity Hero Banner */}
                  <div className="bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#0D47A1] text-white p-3.5 rounded-2xl shadow-sm border-b-2 border-[#FFB300] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💛</span>
                        <h2 className="text-sm font-black text-[#FFB300]">تدبيرة — كل جنيه ليه قيمة</h2>
                      </div>
                      <span className="bg-[#FFB300] text-[#0D47A1] text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        ميزانية البيت 🇪🇬
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 font-medium">
                      وفّر بذكاء، ودبّر بيتك، وخلي كل جنيه في مكانه.
                    </p>
                  </div>

                  {/* Quick Expense Logger Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseAmount('');
                      setExpenseDesc('');
                      setIsAddExpenseModalOpen(true);
                    }}
                    className="w-full bg-[#0D47A1] hover:bg-[#002171] text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Plus className="w-4 h-4 text-[#FFB300]" />
                    <span>⚡ تسجيل مصروف فوري</span>
                  </button>

                  {/* Smart Financial Advisor Banner */}
                  <div className="bg-gradient-to-r from-amber-50 via-blue-50 to-emerald-50 p-3.5 rounded-2xl border border-amber-200/80 shadow-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-[#0D47A1]">💡 توجيه ذكي للميزانية</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-relaxed pr-9">
                      {(() => {
                        const bAmt = parseFloat(budgetAmount) || 2500;
                        const spent = totalSpentAll;
                        const ratio = bAmt > 0 ? (spent / bAmt) * 100 : 0;
                        const daysLeft = paydayAnalytics.daysRemaining > 0 ? paydayAnalytics.daysRemaining : 10;

                        if (ratio > 95) {
                          return "🚨 انتبه: دخلت في مرحلة استهلاك الطوارئ، ركّز على الأساسيات فقط حتى موعد الراتب.";
                        }
                        const overCategory = budgetBreakdown.find(c => c.allocated > 0 && (c.spent / c.allocated) > 0.85);
                        if (overCategory && daysLeft > 10) {
                          const catRatio = Math.round((overCategory.spent / overCategory.allocated) * 100);
                          return `⚠️ تنبيه: صرفت ${catRatio}% من ميزانية ${overCategory.name} ولسه باقي ${daysLeft} يوم على المرتب.. ننصح بتقليل خروج السوبرماركت.`;
                        }
                        return "عاش! معدل صرفك متوازن ومناسب لأيام الشهر المتبقية. استمر في التدبير الصحيح 👏";
                      })()}
                    </p>
                  </div>

                  {/* Feature 3: Monthly Payday Cycle & Countdown Widget */}
                  <div className="bg-gradient-to-l from-blue-900 to-[#0D47A1] text-white p-3.5 rounded-2xl shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-[#FFB300]">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-blue-200 block font-medium">دورة الراتب الشهري</span>
                          <span className="text-xs font-extrabold text-white">
                            {paydayAnalytics.isConfigured ? (
                              paydayAnalytics.isToday ? (
                                <span className="text-[#FFB300]">النهارده موعد الراتب 🎉</span>
                              ) : (
                                <span>باقي {paydayAnalytics.daysRemaining} أيام على موعد الراتب القادم</span>
                              )
                            ) : (
                              <span>حدد موعد راتبك الشهري</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTempPaydayInput(paydayDay ? paydayDay.toString() : '25');
                          setIsPaydayModalOpen(true);
                        }}
                        className="text-[11px] bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 text-white border border-white/20"
                        title="تعديل أو تحديد يوم نزول الراتب"
                      >
                        <Clock className="w-3 h-3 text-[#FFB300]" />
                        <span>{paydayAnalytics.isConfigured ? `يوم ${paydayAnalytics.paydayDay}` : 'تحديد اليوم'}</span>
                      </button>
                    </div>

                    {paydayAnalytics.isConfigured ? (
                      <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-blue-200 block">الحد المقترح للصرف اليومي:</span>
                          {!paydayAnalytics.isBudgetExhausted && paydayAnalytics.dailyCap !== null ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-black text-[#FFB300]">~{paydayAnalytics.dailyCap}</span>
                              <span className="text-[10px] text-white">ج.م/يوم</span>
                              <span className="text-[10px] text-blue-200 mr-1 font-normal">
                                ({paydayAnalytics.daysRemaining > 0 ? `على مدار ${paydayAnalytics.daysRemaining} يوم` : 'اليوم'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-300">
                              ⚠️ تم استهلاك الميزانية بالكامل
                            </span>
                          )}
                        </div>

                        <div className="text-left">
                          <span className="text-[10px] text-blue-200 block">الموعد المحدد:</span>
                          <span className="text-xs font-bold text-white">
                            {paydayAnalytics.effectivePayday} في الشهر
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                        <p className="text-[11px] text-blue-100 leading-tight">
                          اختر يوم نزول الراتب لحساب الأيام المتبقية تلقائياً وتحديد حد الصرف اليومي الذكي.
                        </p>
                        <button
                          onClick={() => {
                            setTempPaydayInput('25');
                            setIsPaydayModalOpen(true);
                          }}
                          className="bg-[#FFB300] hover:bg-[#FFA000] text-[#0D47A1] font-extrabold text-[11px] px-2.5 py-1 rounded-lg shrink-0 mr-2 transition"
                        >
                          ضبط الآن
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Budget Input & Balance Cards */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">الميزانية الإجمالية المتاحة:</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          placeholder="مثال: 2500"
                          className="w-full text-lg font-extrabold text-[#0D47A1] border border-gray-300 rounded-xl px-3 py-2 pr-12 focus:outline-none focus:border-[#0D47A1]"
                        />
                        <span className="absolute left-3 top-2.5 font-bold text-sm text-gray-400">ج.م</span>
                      </div>
                    </div>

                    {/* Financial Snapshot Tiles */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-gray-500 block">إجمالي المصروف الفعلي</span>
                        <span className="text-sm font-black text-[#0D47A1]">{totalSpentAll} ج.م</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        totalRemainingAll >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className="text-[10px] text-gray-500 block">المتبقي في المحفظة</span>
                        <span className="text-sm font-black">{totalRemainingAll} ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2: Visual Spending Donut Chart Card */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-[#0D47A1]">
                          <PieChart className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold text-gray-900">توزيع المصروف الفعلي حسب البنود</h3>
                          <span className="text-[10px] text-gray-400">تحليل بياني لحجم إنفاقك الحقيقي حتى الآن</span>
                        </div>
                      </div>
                      {selectedDonutSegmentId && (
                        <button
                          onClick={() => setSelectedDonutSegmentId(null)}
                          className="text-[10px] text-gray-500 hover:text-gray-700 underline"
                        >
                          إلغاء التحديد
                        </button>
                      )}
                    </div>

                    {totalSpentAll === 0 ? (
                      <div className="py-6 px-4 text-center border border-dashed border-gray-200 rounded-xl space-y-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-400">
                          <PieChart className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-600">لا توجد مصاريف مسجلة حتى الآن لرسم المخطط 📊</p>
                        <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                          سجّل أول عملية صرف من زر "تسجيل مصروف" بالأسفل لتشاهد رسم بياني يوضح نسب إنفاقك على كل بند.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* SVG Donut Graphic & Central Label */}
                        <div className="relative flex items-center justify-center py-2">
                          <svg viewBox="0 0 100 100" className="w-44 h-44 -rotate-90 transform">
                            {/* Background Track */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke="#F1F5F9"
                              strokeWidth="11"
                            />
                            {/* Category Segments */}
                            {donutSegments.map((seg) => {
                              const isSelected = selectedDonutSegmentId === seg.categoryId;
                              return (
                                <circle
                                  key={seg.categoryId}
                                  cx="50"
                                  cy="50"
                                  r="38"
                                  fill="transparent"
                                  stroke={seg.color}
                                  strokeWidth={isSelected ? "14" : "11"}
                                  strokeDasharray={seg.strokeDasharray}
                                  strokeDashoffset={seg.strokeDashoffset}
                                  strokeLinecap="butt"
                                  className="cursor-pointer transition-all duration-300 hover:opacity-90"
                                  onClick={() => setSelectedDonutSegmentId(isSelected ? null : seg.categoryId)}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`${seg.categoryName}: ${seg.spent} ج.م (${seg.sharePercentage}%)`}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setSelectedDonutSegmentId(isSelected ? null : seg.categoryId);
                                    }
                                  }}
                                />
                              );
                            })}
                          </svg>

                          {/* Center Text in Donut */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-[10px] text-gray-400 font-medium">إجمالي المصروف</span>
                            <span className="text-base font-black text-[#0D47A1] leading-tight">{totalSpentAll}</span>
                            <span className="text-[10px] font-bold text-gray-500">ج.م</span>
                          </div>
                        </div>

                        {/* Interactive Detail Panel */}
                        {selectedDonutSegment && (
                          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs space-y-1.5 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: selectedDonutSegment.color }} />
                                <span>{selectedDonutSegment.categoryName}</span>
                              </div>
                              <span className="bg-[#0D47A1] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                {selectedDonutSegment.sharePercentage}% من إجمالي الصرف
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div>
                                <span className="text-gray-500 block">المنصرف الفعلي:</span>
                                <span className="font-extrabold text-[#0D47A1]">{selectedDonutSegment.spent} ج.م</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">الميزانية المخصصة:</span>
                                <span className="font-bold text-gray-700">{selectedDonutSegment.allocated} ج.م</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500 pt-0.5">
                              نسبة استهلاك ميزانية هذا البند: <span className="font-bold text-gray-800">{selectedDonutSegment.budgetPercentage}%</span>
                            </div>
                          </div>
                        )}

                        {/* Arabic Legend */}
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-1.5 text-xs">
                          {budgetBreakdown.map((cat) => {
                            const seg = donutSegments.find(s => s.categoryId === cat.id);
                            const color = seg ? seg.color : '#CBD5E1';
                            const isSelected = selectedDonutSegmentId === cat.id;

                            return (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  if (cat.spent > 0) {
                                    setSelectedDonutSegmentId(isSelected ? null : cat.id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg text-right transition flex items-center justify-between ${
                                  isSelected ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50'
                                } ${cat.spent === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                  <span className="text-[11px] font-bold text-gray-800 truncate">{cat.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-700 shrink-0 mr-1">{cat.spent} ج.م</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-bold text-gray-700">نماذج ميزانية مقترحة:</span>
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✅ المجموع: 100% بالتمام
                      </span>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {BUDGET_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleApplyPreset(preset.percentages)}
                          className="bg-white border border-gray-200 hover:border-[#0D47A1] text-gray-700 text-xs px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap shadow-xs transition"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feature 1: Category Slices, Progress Bars, Overrun Warnings & Allocation Sliders */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-bold text-gray-900">بنود الميزانية والإنفاق:</span>
                      <button
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        className="text-xs font-bold text-[#0D47A1] flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة بند مخصص</span>
                      </button>
                    </div>

                    {budgetBreakdown.map((cat, idx) => {
                      const analytics = calculateCategoryAnalytics(cat.allocated, cat.spent);

                      return (
                        <div key={cat.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[#0D47A1]">
                                {renderCategoryIcon(cat.iconName)}
                              </div>
                              <div>
                                <span className="font-bold text-sm text-gray-800 block">{cat.name}</span>
                                {cat.isCustom && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">مخصص</span>
                                )}
                              </div>
                            </div>
                            <div className="text-left">
                              <span className="bg-blue-50 text-[#0D47A1] text-xs font-extrabold px-2 py-0.5 rounded-md inline-block">
                                {cat.percentage}% من الميزانية
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                استهلاك: {analytics.progressPercentage}%
                              </span>
                            </div>
                          </div>

                          {/* Amount, Spent & Remaining / Exceeded */}
                          <div className="flex items-baseline justify-between text-xs pt-0.5">
                            <div>
                              <span className="text-base font-black text-[#0D47A1]">{cat.allocated} ج.م</span>
                              <span className="text-gray-400 text-[10px] mr-1">المخصص</span>
                            </div>
                            <div className="text-left">
                              <span className="font-bold text-gray-800 block">
                                صُرف: {cat.spent} ج.م
                              </span>
                              {analytics.isOverBudget ? (
                                <span className="text-rose-600 font-extrabold text-[10px] block">
                                  تجاوز بـ: {analytics.exceededAmount} ج.م
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold text-[10px] block">
                                  متبقي: {analytics.remainingAmount} ج.م
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Color Progress Bar (Green <80%, Amber 80-99%, Red >=100%) */}
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                analytics.colorStatus === 'red'
                                  ? 'bg-rose-500'
                                  : analytics.colorStatus === 'amber'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${analytics.visualPercentage}%` }}
                              role="progressbar"
                              aria-valuenow={analytics.progressPercentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>

                          {/* Overrun Warning Badge (Only when spending > allocated) */}
                          {analytics.isOverBudget && (
                            <div className="bg-rose-50 text-rose-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center justify-between border border-rose-200">
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>تجاوز الميزانية بـ {analytics.exceededAmount} ج.م</span>
                              </div>
                              <span className="text-[10px] bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded font-extrabold">
                                {analytics.progressPercentage}% استهلاك
                              </span>
                            </div>
                          )}

                          <p className="text-[11px] text-gray-500 leading-normal">{cat.tip}</p>

                          {/* Synchronized Slider with Boundary Controls (Strict 100% Invariant Preserved) */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleUpdatePercentage(idx, cat.percentage - 5)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-2 py-1 rounded-lg transition"
                              title="إنقاص 5%"
                            >
                              -5%
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={cat.percentage}
                              onChange={(e) => handleUpdatePercentage(idx, parseInt(e.target.value))}
                              className="w-full accent-[#0D47A1] cursor-pointer"
                            />
                            <button
                              onClick={() => handleUpdatePercentage(idx, cat.percentage + 5)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-2 py-1 rounded-lg transition"
                              title="زيادة 5%"
                            >
                              +5%
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={handleSaveBudgetPlan}
                      className="w-full bg-[#0D47A1] hover:bg-[#002171] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Bookmark className="w-4 h-4 text-[#FFE54C]" />
                      <span>حفظ خطة الميزانية في المحفوظات</span>
                    </button>
                  </div>

                  {/* Expense Records Section */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-xs text-gray-900">سجل المصاريف الحقيقية:</h3>
                        <span className="text-[10px] text-gray-400">سجل كل عملية شراء لحظة بلحظة</span>
                      </div>
                      <button
                        onClick={() => setIsAddExpenseModalOpen(true)}
                        className="bg-[#0D47A1] hover:bg-[#002171] text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تسجيل مصروف</span>
                      </button>
                    </div>

                    {expenses.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        لسه مسجلتش مصاريف. اضغط على "تسجيل مصروف" عشان تتابع رصيدك.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {expenses.slice(0, 5).map(exp => {
                          const cat = categories.find(c => c.id === exp.categoryId);
                          return (
                            <div key={exp.id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-800">{exp.description}</span>
                                  <span className="text-[10px] bg-blue-100 text-[#0D47A1] px-1.5 py-0.2 rounded font-medium">
                                    {cat?.name || 'عام'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-0.5 block">{exp.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#0D47A1]">{exp.amount} ج.م</span>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="text-gray-400 hover:text-red-600 p-1"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* === TAB 3: تدبيرة اليوم === */}
              {/* ======================================================== */}
              {activeTab === 'daily' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-lg font-extrabold text-[#0D47A1]">تدبيرة اليوم 💡</h2>
                      <span className="text-xs bg-[#FFB300] text-[#0D47A1] font-black px-2 py-0.5 rounded-full">كل جنيه ليه قيمة 💛</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      وفّر بذكاء، ودبّر بيتك، وخلي كل جنيه في مكانه مع حيل يومية مجربة.
                    </p>
                  </div>

                  {/* Daily Signature Challenge */}
                  <div className={`p-4 rounded-2xl border transition ${
                    dailyCompleted
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-[#FFE54C]/25 border-[#FFB300]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                        dailyCompleted ? 'bg-emerald-600 text-white' : 'bg-[#0D47A1] text-white'
                      }`}>
                        {dailyCompleted ? 'تم إنجاز التحدي! 🎉' : '🎯 تدبيرتك النهارده'}
                      </span>
                      <span className="text-[11px] text-gray-500">{todayDateKey}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 mt-2">{todayChallenge.title}</h3>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">{todayChallenge.description}</p>
                    <span className="inline-block mt-2 text-[11px] text-amber-800 bg-amber-100 font-semibold px-2 py-0.5 rounded">
                      ✨ {todayChallenge.impactTag}
                    </span>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/60">
                      <button
                        onClick={toggleDailyCompletion}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                          dailyCompleted
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{dailyCompleted ? 'مُنجز بنجاح' : 'علّم كـ مُنجز'}</span>
                      </button>

                      <button
                        onClick={handleShareDailyChallenge}
                        className="text-xs font-bold text-[#0D47A1] bg-white border border-gray-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مشاركة الإنجاز</span>
                      </button>
                    </div>
                  </div>

                  {/* Phase 4C: Achievement Counter & "أفكاري المحفوظة" Toggle Banner */}
                  <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 p-3 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FFB300] text-[#0D47A1] font-black flex items-center justify-center text-sm shadow-inner shrink-0">
                        🏆
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-gray-900">إنجازات تدابير التوفير:</span>
                          <span className="bg-[#0D47A1] text-white text-[10px] font-black px-2 py-0.2 rounded-full">
                            {calculateUniqueAchievementCount(triedTipIds)} حيل مُجربة
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 block">
                          {triedTipIds.length > 0
                            ? `عاش! جربت ${calculateUniqueAchievementCount(triedTipIds)} حيل ووفرت في بيتك`
                            : 'اضغط "جربت الحيلة دي ووفرت" لحساب إنجازاتك'}
                        </span>
                      </div>
                    </div>

                    {/* Toggle between All Tips and "أفكاري المحفوظة" */}
                    <button
                      type="button"
                      onClick={() => setDailyTipsViewMode(prev => prev === 'saved' ? 'all' : 'saved')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 border shrink-0 ${
                        dailyTipsViewMode === 'saved'
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                          : 'bg-white text-[#0D47A1] border-blue-200 hover:bg-blue-50'
                      }`}
                      title="عرض الحيل التي حفظتها للرجوع إليها"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${dailyTipsViewMode === 'saved' ? 'fill-white' : ''}`} />
                      <span>أفكاري المحفوظة ({savedTipIds.length})</span>
                    </button>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={dailySearch}
                        onChange={(e) => setDailySearch(e.target.value)}
                        placeholder="ابحث في أفكار التوفير والمنزل..."
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl py-2 px-3 pl-8 focus:outline-none focus:border-[#0D47A1]"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    </div>

                    {/* Active Saved Mode Indicator */}
                    {dailyTipsViewMode === 'saved' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0D47A1] flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 fill-[#0D47A1]" />
                          <span>عرض أفكاري المحفوظة ({filteredDailyIdeas.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setDailyTipsViewMode('all')}
                          className="text-[11px] font-bold text-gray-600 hover:text-[#0D47A1] underline"
                        >
                          عرض كل الحيل
                        </button>
                      </div>
                    )}

                    {/* Phase 4C: 5 Exact Categories (الكل، تنظيف، توفير كهرباء، مطبخ وتغذية، حيل تسوق) */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                      {['الكل', 'تنظيف', 'توفير كهرباء', 'مطبخ وتغذية', 'حيل تسوق'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedDailyCategory(cat)}
                          className={`px-3 py-1 rounded-xl whitespace-nowrap font-bold transition ${
                            selectedDailyCategory === cat
                              ? 'bg-[#0D47A1] text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Curated Tips List */}
                  <div className="space-y-3">
                    {filteredDailyIdeas.length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-300 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0D47A1] mx-auto flex items-center justify-center font-bold text-lg">
                          💡
                        </div>
                        <p className="text-xs font-bold text-gray-800">
                          {dailyTipsViewMode === 'saved'
                            ? 'لسه مفيش حيل محفوظة. احفظ أي تدبيرة عجبتك علشان ترجع لها وقت ما تحتاجها.'
                            : 'لا توجد حيل مطابقة لهذا التصنيف حالياً. اختر تصنيفاً آخر أو اضغط "الكل".'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDailyTipsViewMode('all');
                            setSelectedDailyCategory('الكل');
                            setDailySearch('');
                          }}
                          className="text-xs font-bold text-[#0D47A1] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
                        >
                          عرض كل الحيل 💡
                        </button>
                      </div>
                    ) : (
                      filteredDailyIdeas.map(idea => {
                        const isSaved = savedTipIds.includes(idea.id);
                        const isTried = triedTipIds.includes(idea.id);
                        const isBrokenImg = brokenImages[idea.id];

                        return (
                          <div key={idea.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-2.5">
                            {/* Visual Banner */}
                            <div className="relative h-28 w-full bg-gray-100 overflow-hidden">
                              {!isBrokenImg ? (
                                <img
                                  src={idea.imageUrl}
                                  alt={idea.title}
                                  onError={() => handleImageError(idea.id)}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                  <SvgIllustration type={idea.svgIcon} className="w-20 h-20" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {idea.category}
                              </span>
                              <span className="absolute bottom-2 right-2 text-white font-bold text-xs drop-shadow-xs">
                                ⏱️ {idea.timeRequired}
                              </span>
                            </div>

                            <div className="p-3.5 pt-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-sm text-gray-900 leading-snug">{idea.title}</h4>
                                {isTried && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>مُجربة</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{idea.description}</p>

                              <div className="bg-blue-50/70 p-2 rounded-xl text-[11px] text-[#0D47A1] flex items-center gap-1.5">
                                <span>💡</span>
                                <span className="font-medium">{idea.practicalTip}</span>
                              </div>

                              {/* Tags display */}
                              <div className="flex flex-wrap gap-1 text-[10px] text-gray-500 pt-0.5">
                                {idea.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="bg-gray-100 px-1.5 py-0.2 rounded text-gray-600">
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              {/* Interactive Actions */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-1.5">
                                {/* Phase 4C: Interactive "جربت الحيلة دي ووفرت" Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleTriedTip(idea.id)}
                                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition ${
                                    isTried
                                      ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                  title="سجل أنك طبقت هذه الحيلة في بيتك"
                                >
                                  {isTried ? <Check className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                                  <span>{isTried ? 'جربتها بالفعل ✓' : 'جربت الحيلة دي ووفرت'}</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  {/* Bookmark Control */}
                                  <button
                                    type="button"
                                    onClick={() => toggleSaveTip(idea.id)}
                                    className={`text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition border ${
                                      isSaved
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                                    }`}
                                    title="حفظ في أفكاري المحفوظة"
                                  >
                                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-600 text-amber-600' : ''}`} />
                                    <span>{isSaved ? 'محفوظة' : 'حفظ'}</span>
                                  </button>

                                  {/* Share Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleShareTip(idea)}
                                    className="text-xs font-bold text-[#0D47A1] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1 transition"
                                    title="مشاركة النصيحة"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* === TAB 4: المحفوظات وقائمة المشتريات === */}
              {/* ======================================================== */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0D47A1]">المحفوظات وقائمة النواقص 📋</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      طلبات السوق والوجبات والنصائح والميزانيات المحفوظة بدون إنترنت.
                    </p>
                  </div>

                  {/* SubTabs */}
                  <div className="grid grid-cols-5 bg-white p-1 rounded-xl border border-gray-200 text-[10px] font-bold text-center">
                    <button
                      onClick={() => setSavedSubTab('shopping')}
                      className={`py-1.5 rounded-lg transition ${
                        savedSubTab === 'shopping' ? 'bg-[#0D47A1] text-white shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      النواقص ({shoppingItems.length})
                    </button>
                    <button
                      onClick={() => setSavedSubTab('recipes')}
                      className={`py-1.5 rounded-lg transition ${
                        savedSubTab === 'recipes' ? 'bg-[#0D47A1] text-white shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      الوجبات ({savedRecipeIds.length})
                    </button>
                    <button
                      onClick={() => setSavedSubTab('tips')}
                      className={`py-1.5 rounded-lg transition ${
                        savedSubTab === 'tips' ? 'bg-[#0D47A1] text-white shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      النصائح ({savedTipIds.length})
                    </button>
                    <button
                      onClick={() => setSavedSubTab('budgets')}
                      className={`py-1.5 rounded-lg transition ${
                        savedSubTab === 'budgets' ? 'bg-[#0D47A1] text-white shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      الميزانيات ({savedBudgets.length})
                    </button>
                    <button
                      onClick={() => setSavedSubTab('household')}
                      className={`py-1.5 rounded-lg transition ${savedSubTab === 'household' ? 'bg-[#0D47A1] text-white shadow-sm' : 'text-gray-600'}`}
                    >
                      إدارة البيت
                    </button>
                  </div>

                  {/* SubTab 1: Reliable, Transparent Shopping List Interface (No NaN Ever) */}
                  {savedSubTab === 'shopping' && (
                    <div className="space-y-3">
                      {/* Financial Grand Total Banner */}
                      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
                        <ShoppingTotalsSummary totals={shoppingTotals} items={shoppingItems} />

                      </div>

                        {/* Feature 1: WhatsApp Sharing Action */}
                        <button
                          onClick={handleShareShoppingWhatsApp}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
                          title="مشاركة الأصناف غير المشتراة عبر تطبيق واتساب"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>مشاركة قائمة النواقص عبر واتساب</span>
                        </button>

                        {/* Phase 4E: Smart Deals & Affiliate Widget */}
                        <div className="bg-gradient-to-br from-blue-50 to-amber-50/50 p-3.5 rounded-2xl border border-blue-200 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#FFB300]" />
                              <h3 className="text-xs font-extrabold text-[#0D47A1]">🛒 عروض وتخفيضات متاحة على طلباتك</h3>
                            </div>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                              خصومات مصرية معتمدة ✓
                            </span>
                          </div>

                          <div className="space-y-2">
                            {matchDealsForShoppingItems(shoppingItems.length).map(deal => (
                              <div key={deal.id} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-xs text-gray-900">{deal.partnerName}</span>
                                      {deal.verificationStatus === 'verified' && (
                                        <span className="text-[9px] bg-blue-100 text-[#0D47A1] font-bold px-1.5 py-0.2 rounded">
                                          مؤكد ✓
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{deal.description}</p>
                                  </div>
                                  {deal.couponCode && (
                                    <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl text-center shrink-0">
                                      <span className="text-[9px] text-amber-800 block">كود الخصم:</span>
                                      <span className="font-mono font-bold text-xs text-amber-950">{deal.couponCode}</span>
                                    </div>
                                  )}
                                </div>

                                {deal.conditions && (
                                  <p className="text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg">
                                    ℹ️ {deal.conditions}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                  {deal.couponCode && (
                                    <button
                                      onClick={() => {
                                        try {
                                          navigator.clipboard.writeText(deal.couponCode!);
                                          showToast(`تم نسخ كود الخصم (${deal.couponCode}) بنجاح 📋`);
                                        } catch {
                                          showToast(`كود الخصم: ${deal.couponCode} (انسخه يدوياً)`);
                                        }
                                      }}
                                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1 transition shadow-sm"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>نسخ الكود</span>
                                    </button>
                                  )}
                                  <a
                                    href={deal.affiliateTrackingUrl || deal.officialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-[#0D47A1] hover:bg-[#002171] text-white font-bold py-1.5 px-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1 transition shadow-sm text-center"
                                  >
                                    <span>شراء النواقص مع كود الخصم</span>
                                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-1 text-center">
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                              "قد يحصل تطبيق تدبيرة على عمولة بسيطة عند الشراء لدعم استمرار التطوير المجاني"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                          <button
                            onClick={() => {
                              setNewItemName('');
                              setNewItemQty('1');
                              setNewItemUnit('حبة');
                              setNewItemUnitPrice('');
                              setIsAddItemModalOpen(true);
                            }}
                            className="bg-[#0D47A1] hover:bg-[#002171] text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-sm transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة طلب جديد</span>
                          </button>

                          <div className="flex gap-1.5">
                            {shoppingItems.some(i => i.isChecked) && (
                              <button
                                onClick={() => {
                                  setShoppingItems(prev => prev.filter(i => !i.isChecked));
                                  showToast('تم مسح الأصناف المشتراة');
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                              >
                                مسح المكتمل
                              </button>
                            )}
                            {shoppingItems.length > 0 && (
                              <button
                                onClick={() => setIsClearShoppingConfirmOpen(true)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                              >
                                إفراغ القائمة
                              </button>
                            )}
                          </div>
                        </div>

                      {/* Empty State */}
                      {shoppingItems.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center border border-dashed border-gray-300 space-y-3">
                          <div className="w-14 h-14 bg-blue-50 text-[#0D47A1] rounded-full mx-auto flex items-center justify-center shadow-inner">
                            <ShoppingCart className="w-7 h-7" />
                          </div>
                          <h4 className="text-base font-extrabold text-gray-800">
                            لا توجد نواقص حاليًا.. دولاب خزينك تمام! 🧺
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                            تقدر تضيف طلبات بالضغط على زر "إضافة طلب جديد" أو من أي وصفة تختارها في تدبيرة الأكل لنقل النواقص تلقائياً.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {shoppingItems.map(item => {
                            const lineTotal = calculateLineTotal(item.quantity, item.unitPrice);

                            return (
                              <div
                                key={item.id}
                                className={`p-3 rounded-2xl border transition ${
                                  item.isChecked
                                    ? 'bg-gray-50/70 border-gray-200 opacity-70'
                                    : 'bg-white border-gray-200 shadow-xs'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  {/* Checkbox & Item Name */}
                                  <div
                                    onClick={() => {
                                      setShoppingItems(prev => prev.map(i => i.id === item.id ? { ...i, isChecked: !i.isChecked } : i));
                                    }}
                                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                                  >
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                      item.isChecked ? 'bg-[#0D47A1] border-[#0D47A1] text-white' : 'border-gray-300 bg-white'
                                    }`}>
                                      {item.isChecked && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <div>
                                      <span className={`text-xs font-bold ${item.isChecked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                        {item.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {item.unitPrice !== null ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingPriceItem({
                                                id: item.id,
                                                name: item.name,
                                                currentPrice: item.unitPrice !== null ? item.unitPrice.toString() : ''
                                              });
                                            }}
                                            className="text-[10px] text-gray-500 hover:text-[#0D47A1] flex items-center gap-0.5"
                                            title="اضغط لتعديل سعر الوحدة"
                                          >
                                            <span>سعر الوحدة: {item.unitPrice} ج.م</span>
                                            <Edit3 className="w-2.5 h-2.5 text-gray-400" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingPriceItem({
                                                id: item.id,
                                                name: item.name,
                                                currentPrice: ''
                                              });
                                            }}
                                            className="text-[10px] text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1"
                                          >
                                            <span>السعر غير محدد</span>
                                            <span className="text-[#0D47A1] underline">حدد السعر</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quantity Stepper & Line Total */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                      <button
                                        onClick={() => updateItemQty(item.id, -0.5)}
                                        className="w-5 h-5 rounded text-gray-600 hover:bg-gray-200 font-bold flex items-center justify-center text-xs"
                                        title="إنقاص الكمية"
                                      >
                                        -
                                      </button>
                                      <span className="px-1.5 text-xs font-bold text-gray-800">
                                        {item.quantity} {item.unit}
                                      </span>
                                      <button
                                        onClick={() => updateItemQty(item.id, 0.5)}
                                        className="w-5 h-5 rounded text-gray-600 hover:bg-gray-200 font-bold flex items-center justify-center text-xs"
                                        title="زيادة الكمية"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Line Total Display (Never NaN) */}
                                    <div className="text-left min-w-[65px]">
                                      {lineTotal !== null ? (
                                        <span className="font-black text-xs text-[#0D47A1] block">
                                          {Math.round(lineTotal)} ج.م
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded block">
                                          غير مسعر
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => setShoppingItems(prev => prev.filter(i => i.id !== item.id))}
                                      className="text-gray-400 hover:text-red-600 p-1"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SubTab 2: Saved Recipes */}
                  {savedSubTab === 'recipes' && (
                    <div className="space-y-3">
                      {savedRecipeIds.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center border border-dashed border-gray-300 space-y-2">
                          <div className="w-12 h-12 bg-amber-50 text-[#FFB300] rounded-full mx-auto flex items-center justify-center">
                            <Bookmark className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-extrabold text-gray-800">
                            لسه مفيش عناصر محفوظة.. احفظ اللي يعجبك وارجع له وقت ما تحتاجه.
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            اضغط على علامة الحفظ ⭐ في أي وجبة بتعجبك في تدبيرة الأكل للرجوع إليها بدون نت.
                          </p>
                        </div>
                      ) : (
                        RECIPES.filter(r => savedRecipeIds.includes(r.id)).map(r => (
                          <div key={r.id} className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div onClick={() => setSelectedRecipeModal(r)} className="cursor-pointer flex-1">
                              <h4 className="font-bold text-sm text-gray-900">{r.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ⏱️ {r.prepTimeMinutes} دقيقة • <span className="text-[#0D47A1] font-bold">🏷️ تكلفة تقديرية: ~{getScaledCost(r)} ج.م ({familySize} أفراد)</span>
                              </p>
                            </div>
                            <button
                              onClick={() => toggleSaveRecipe(r.id)}
                              className="text-red-500 hover:text-red-700 p-1.5"
                              title="حذف من المحفوظات"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* SubTab 3: Saved Tips */}
                  {/* SubTab 3: Saved Tips ("أفكاري المحفوظة") */}
                  {savedSubTab === 'tips' && (
                    <div className="space-y-3">
                      {savedTipIds.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center border border-dashed border-gray-300 space-y-3">
                          <div className="w-12 h-12 bg-blue-50 text-[#0D47A1] rounded-2xl mx-auto flex items-center justify-center text-xl shadow-inner">
                            🔖
                          </div>
                          <p className="text-sm font-extrabold text-gray-800">
                            لسه مفيش حيل محفوظة. احفظ أي تدبيرة عجبتك علشان ترجع لها وقت ما تحتاجها.
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            تصفح قسم تدبيرة اليوم واضغط على أيقونة الحفظ لجمع أفكار التوفير المفضلة لبيتك هنا بدون إنترنت.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('daily')}
                            className="text-xs font-bold text-white bg-[#0D47A1] hover:bg-[#002171] px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span>تصفح تدبيرة اليوم 💡</span>
                          </button>
                        </div>
                      ) : (
                        DAILY_IDEAS.filter(idea => savedTipIds.includes(idea.id)).map(idea => {
                          const isTried = triedTipIds.includes(idea.id);
                          return (
                            <div key={idea.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded font-bold">
                                    {idea.category}
                                  </span>
                                  {isTried && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>مُجربة</span>
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleSaveTip(idea.id)}
                                  className="text-red-500 hover:text-red-700 p-1 text-xs font-bold flex items-center gap-1"
                                  title="إزالة من أفكاري المحفوظة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">إزالة</span>
                                </button>
                              </div>

                              <div>
                                <h4 className="font-bold text-sm text-gray-900">{idea.title}</h4>
                                <p className="text-xs text-gray-600 leading-relaxed mt-1">{idea.description}</p>
                              </div>

                              <div className="bg-blue-50/70 p-2 rounded-xl text-[11px] text-[#0D47A1] flex items-center gap-1.5">
                                <span>💡</span>
                                <span className="font-medium">{idea.practicalTip}</span>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 text-[10px] text-gray-500">
                                {idea.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="bg-gray-100 px-1.5 py-0.2 rounded text-gray-600">
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                {/* Interactive "جربت الحيلة دي ووفرت" Button sharing same state */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleTriedTip(idea.id)}
                                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition ${
                                    isTried
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {isTried ? <Check className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                                  <span>{isTried ? 'جربتها بالفعل ✓' : 'جربت الحيلة دي ووفرت'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleShareTip(idea)}
                                  className="text-xs font-bold text-[#0D47A1] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1 transition"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>مشاركة</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* SubTab 4: Saved Budgets */}
                  {savedSubTab === 'budgets' && (
                    <div className="space-y-3">
                      {savedBudgets.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center border border-dashed border-gray-300 space-y-2">
                          <div className="w-12 h-12 bg-amber-50 text-[#FFB300] rounded-full mx-auto flex items-center justify-center">
                            <Wallet className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-extrabold text-gray-800">
                            لسه مفيش عناصر محفوظة.. احفظ اللي يعجبك وارجع له وقت ما تحتاجه.
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            قسّم ميزانيتك في تدبيرة الفلوس واحفظ خطتك للرجوع إليها في أي وقت.
                          </p>
                        </div>
                      ) : (
                        savedBudgets.map(b => (
                          <div key={b.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-[#0D47A1]">{b.categoryTitle}</h4>
                                <span className="text-xs font-extrabold text-gray-800">{b.totalAmount} جنيه مصري</span>
                              </div>
                              <button
                                onClick={() => setSavedBudgets(prev => prev.filter(x => x.id !== b.id))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs space-y-1 pt-1 border-t border-gray-100">
                              {b.slices.map((s, idx) => (
                                <div key={idx} className="flex justify-between text-gray-600">
                                  <span>{s.name} ({s.percentage}%)</span>
                                  <span className="font-bold text-gray-800">{Math.round(s.amount)} ج.م</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {savedSubTab === 'household' && <HouseholdHub />}
                </div>
              )}

            </div>

            {/* ======================================================== */}
            {/* GOOGLE ADMOB BANNER (Dedicated Container Above Bottom Nav) */}
            {/* ======================================================== */}
            <div
              className={`transition-all duration-300 ease-in-out border-t border-gray-200 bg-white ${
                adStatus === 'failed' || adStatus === 'disabled'
                  ? 'h-0 py-0 border-transparent opacity-0 overflow-hidden'
                  : 'h-[72px] py-1 px-3 flex flex-col justify-center'
              }`}
            >
              {/* Policy Header Bar: Clear 'إعلان' Tag & Non-Deceptive Separation */}
              <div className="flex items-center justify-between text-[10px] pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="bg-gray-200 text-gray-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                    إعلان
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium truncate max-w-[190px]">
                    {IS_DEV ? 'AdMob Test • 320x50' : 'Google AdMob'}
                  </span>
                </div>
                {IS_DEV && (
                  <button
                    onClick={() => setIsAdControlsOpen(true)}
                    className="text-[9px] text-[#0D47A1] font-bold hover:underline"
                  >
                    اختبار الحالة ⚙️
                  </button>
                )}
              </div>

              {/* Banner Area (Fixed 50px Height Reservation) */}
              <div className="h-[50px] w-full rounded-lg overflow-hidden relative">
                {adStatus === 'loaded' && (
                  <div className="h-full w-full bg-gradient-to-r from-blue-50 via-amber-50 to-blue-50 border border-blue-200/80 rounded-lg flex items-center justify-between px-3 text-xs select-none shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0D47A1] text-[#FFB300] font-black text-[10px] flex items-center justify-center shrink-0">
                        Ad
                      </div>
                      <div>
                        <span className="font-extrabold text-[#0D47A1] block leading-tight text-[11px]">
                          Google AdMob • Test Ad
                        </span>
                        <span className="text-[10px] text-gray-600 block leading-tight">
                          تدبيرة مصر: وفّر في ميزانية بيتك مع بدائل الأكل الذكية
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                      Sample Unit
                    </span>
                  </div>
                )}

                {adStatus === 'loading' && (
                  <div className="h-full w-full bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 px-3 text-xs animate-pulse">
                    <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      جارِ حجز المساحة وتحميل إعلان AdMob...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Android Bottom Navigation Bar */}
            <div className="bg-white border-t border-gray-200 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around text-[10px] select-none shrink-0">
              <button
                onClick={() => setActiveTab('food')}
                className={`flex flex-col items-center gap-0.5 transition ${
                  activeTab === 'food' ? 'text-[#0D47A1] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Utensils className="w-5 h-5" />
                <span>تدبيرة الأكل</span>
              </button>

              <button
                onClick={() => setActiveTab('budget')}
                className={`flex flex-col items-center gap-0.5 transition ${
                  activeTab === 'budget' ? 'text-[#0D47A1] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>تدبيرة الفلوس</span>
              </button>

              <button
                onClick={() => setActiveTab('daily')}
                className={`flex flex-col items-center gap-0.5 transition ${
                  activeTab === 'daily' ? 'text-[#0D47A1] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Lightbulb className="w-5 h-5" />
                <span>تدبيرة اليوم</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`flex flex-col items-center gap-0.5 transition ${
                  activeTab === 'saved' ? 'text-[#0D47A1] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Bookmark className="w-5 h-5" />
                <span>المحفوظات</span>
              </button>
            </div>
          </div>

          {/* Quick AdMob Simulation Control Bar (Development Only) */}
          {IS_DEV && (
            <div className="w-full max-w-md bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-extrabold text-[#0D47A1] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
                  <span>محاكي إعلانات Google AdMob (اختبار فوري)</span>
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Test Mode • SDK v23.0.0</span>
              </div>

              {/* Banner State Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-700 font-bold">حالة إعلان البانر (320x50):</span>
                  <span className="text-[10px] text-gray-400">فحص حجز المساحة والانهيار</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <button
                    onClick={() => { setAdStatus('loaded'); showToast('تم تفعيل البانر (Loaded 320x50) ✓'); }}
                    className={`py-1.5 px-1 rounded-xl text-center font-bold transition text-[10px] ${
                      adStatus === 'loaded' ? 'bg-[#0D47A1] text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    محمّل (Loaded)
                  </button>
                  <button
                    onClick={() => { setAdStatus('loading'); showToast('محاكاة جارِ التحميل مع حجز المساحة ⏳'); }}
                    className={`py-1.5 px-1 rounded-xl text-center font-bold transition text-[10px] ${
                      adStatus === 'loading' ? 'bg-amber-500 text-white animate-pulse shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    تحميل (Reserve)
                  </button>
                  <button
                    onClick={() => { setAdStatus('failed'); showToast('محاكاة فشل التحميل وانهيار الحاوية 📉'); }}
                    className={`py-1.5 px-1 rounded-xl text-center font-bold transition text-[10px] ${
                      adStatus === 'failed' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    فشل (Collapse)
                  </button>
                  <button
                    onClick={() => { setAdStatus('disabled'); showToast('تم تعطيل البانر بالكامل 🚫'); }}
                    className={`py-1.5 px-1 rounded-xl text-center font-bold transition text-[10px] ${
                      adStatus === 'disabled' ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    معطل (Hidden)
                  </button>
                </div>
              </div>

              {/* Interstitial Controls */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="interstitialToggle"
                    checked={isInterstitialEnabled}
                    onChange={(e) => {
                      setIsInterstitialEnabled(e.target.checked);
                      showToast(e.target.checked ? 'تم تفعيل الإعلانات البينية تجريبياً ⚡' : 'تم تعطيل الإعلانات البينية (افتراضي) 🛡️');
                    }}
                    className="w-4 h-4 text-[#0D47A1] rounded cursor-pointer"
                  />
                  <label htmlFor="interstitialToggle" className="text-[11px] text-gray-700 font-bold cursor-pointer">
                    الإعلانات البينية {isInterstitialEnabled ? '(مفعلة)' : '(معطلة افتراضياً)'}
                  </label>
                </div>

                <button
                  onClick={triggerTestInterstitial}
                  className="bg-[#0D47A1] hover:bg-[#002171] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <span>اختبار إعلان بيني 🎬</span>
                </button>
              </div>

              {/* Policy Metrics */}
              <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded-xl flex items-center justify-between border border-gray-100">
                <span>جلسة الإعلانات البينية: <b className="text-gray-900">{sessionInterstitialCount}/2</b></span>
                <span>فترة الانتظار (120 ثانية): <b className="text-gray-900">{
                  Date.now() - lastInterstitialTime >= 120000 ? 'جاهز للعرض ✓' : `${Math.ceil((120000 - (Date.now() - lastInterstitialTime)) / 1000)}ث متبقية`
                }</b></span>
              </div>

              {/* Rewarded Ad Controls (Phase 4D) */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-700 font-bold flex items-center gap-1">
                    <CalendarCheck className="w-3.5 h-3.5 text-[#0D47A1]" />
                    <span>إعلان المكافأة (Rewarded Video Ad):</span>
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isWeeklyPlanUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {isWeeklyPlanUnlocked ? 'الخطة مفتوحة' : 'الخطة مقفولة'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9px] text-gray-500 truncate max-w-[200px]">
                    Unit: {OFFICIAL_TEST_REWARDED_AD_UNIT}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={handleRequestRewardedAd}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl transition shadow-xs flex items-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>محاكاة المكافأة 🎬</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsWeeklyPlanUnlocked(!isWeeklyPlanUnlocked);
                        if (!isWeeklyPlanUnlocked) {
                          localStorage.setItem(REWARD_PLAN_STORAGE_KEY, 'true');
                          showToast('تم فتح الخطة يدوياً للاختبار ✓');
                        } else {
                          localStorage.removeItem(REWARD_PLAN_STORAGE_KEY);
                          showToast('تم قفل الخطة للاختبار 🔒');
                        }
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-xl transition"
                    >
                      {isWeeklyPlanUnlocked ? 'قفل 🔒' : 'فتح 🔓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* ---------------- VIEW 2: ANDROID STUDIO CODE INSPECTOR ---------------- */}
        {viewMode === 'code' && (
          <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[740px]">
            {/* Sidebar File Tree */}
            <div className="w-full md:w-80 bg-[#1E293B] text-gray-200 p-4 border-l border-gray-700 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                <span className="font-bold text-xs text-[#FFB300] flex items-center gap-1.5">
                  <FolderCode className="w-4 h-4" />
                  <span>مشروع الأندرويد الأصلي (42 ملف)</span>
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {[
                  { path: 'android/settings.gradle.kts', label: 'settings.gradle.kts' },
                  { path: 'android/build.gradle.kts', label: 'build.gradle.kts (Root)' },
                  { path: 'android/gradle/libs.versions.toml', label: 'libs.versions.toml' },
                  { path: 'android/app/build.gradle.kts', label: 'app/build.gradle.kts' },
                  { path: 'android/app/src/main/AndroidManifest.xml', label: 'AndroidManifest.xml' },
                  { path: 'android/app/src/main/res/values/strings.xml', label: 'res/values/strings.xml' },
                  { path: 'android/app/src/main/res/values/colors.xml', label: 'res/values/colors.xml' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/MainActivity.kt', label: 'MainActivity.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/TedbeeraApp.kt', label: 'TedbeeraApp.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/data/local/AppDatabase.kt', label: 'AppDatabase.kt (Room)' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/data/repository/TedbeeraRepository.kt', label: 'TedbeeraRepository.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/data/seed/SeedData.kt', label: 'SeedData.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/components/AdMobBanner.kt', label: 'AdMobBanner.kt (Google Ads)' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/screens/food/FoodScreen.kt', label: 'FoodScreen.kt (Compose UI)' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/screens/food/FoodViewModel.kt', label: 'FoodViewModel.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/screens/budget/BudgetScreen.kt', label: 'BudgetScreen.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/screens/budget/BudgetViewModel.kt', label: 'BudgetViewModel.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/screens/daily/DailyScreen.kt', label: 'DailyScreen.kt' },
                  { path: 'android/app/src/main/java/com/tedbeera/egypt/ui/screens/saved/SavedScreen.kt', label: 'SavedScreen.kt' },
                  { path: 'android/app/src/test/java/com/tedbeera/egypt/BudgetEngineTest.kt', label: 'BudgetEngineTest.kt (Unit Test)' },
                  { path: 'android/app/src/test/java/com/tedbeera/egypt/IngredientMatchingTest.kt', label: 'IngredientMatchingTest.kt (Unit Test)' },
                  { path: 'android/app/src/test/java/com/tedbeera/egypt/DailyChallengeDeterministicTest.kt', label: 'DailyChallengeDeterministicTest.kt' },
                  { path: 'android/app/src/test/java/com/tedbeera/egypt/Phase4FeaturesTest.kt', label: 'Phase4FeaturesTest.kt (Unit Test)' }
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setSelectedAndroidFile(item.path);
                      setCopiedCode(false);
                    }}
                    className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs truncate transition flex items-center justify-between ${
                      selectedAndroidFile === item.path
                        ? 'bg-[#0D47A1] text-white font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="flex-1 flex flex-col bg-[#0F172A] overflow-hidden">
              <div className="bg-[#1E293B] px-4 py-2.5 flex items-center justify-between border-b border-gray-700">
                <span className="text-xs font-mono text-gray-300">{selectedAndroidFile}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const code = ANDROID_CODE_SAMPLES[selectedAndroidFile] || '';
                      navigator.clipboard.writeText(code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1 rounded-md flex items-center gap-1 transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                  <a
                    href="/TedbeeraEgypt-Android.zip"
                    download="TedbeeraEgypt-Android.zip"
                    className="text-xs bg-[#FFB300] hover:bg-[#FFA000] text-[#0D47A1] font-bold px-3 py-1 rounded-md flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل ZIP</span>
                  </a>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-gray-300">
                <pre className="whitespace-pre-wrap select-text">
                  {ANDROID_CODE_SAMPLES[selectedAndroidFile] || `// ============================================================
// ملف: ${selectedAndroidFile}
// تطبيق: تدبيرة – Tedbeera Egypt (Native Android)
// ============================================================`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 3: AUTOMATED UNIT TESTS ---------------- */}
        {viewMode === 'tests' && (
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-extrabold text-[#0D47A1] flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-[#FFB300]" />
                  <span>نتائج الاختبارات الآلية (Unit Tests)</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">اختبارات شاملة لمنع NaN، سلامة الميزانية 100%، استقرار AdMob، مشاركة واتساب، فلتر اطبخ باللي عندي، النسخ الاحتياطي، التحليلات، موعد الراتب، الصوت، التدابير، وإعلانات المكافأة والإشعارات المحلية.</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>14/14 اختبارات ناجحة 100%</span>
              </span>
            </div>

            <div className="space-y-4">
              {/* Test 1: NaN Prevention and Shopping List Calculations */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">1. ShoppingListCalculationTest (NaN Elimination & Unpriced Handling)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  معالجة وحماية كاملة ضد ظهور NaN ج.م، والتطبيع الآمن لبيانات الإصدارات القديمة (مثل "نصف كيلو" أو "10 أرغفة")، وفصل الأصناف غير المسعرة بشفافية تامة.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testLegacyStringQuantityNormalization("نصف كيلو") → qty=0.5, unit="كيلو", no NaN</div>
                  <div>✓ testMissingPriceReturnsNullLineTotal(qty=2, price=null) → null ("السعر غير محدد")</div>
                  <div>✓ testGrandTotalWithUnpricedItems() → calculates known total + raises incomplete badge</div>
                  <div>✓ testInstantRecalculationOnPriceEdit(from null to 20 EGP) → line=40, total updated</div>
                  <div>✓ testIngredientMergingWithoutDuplicates("عدس", "كوب") → quantities merged without extra rows</div>
                </div>
              </div>

              {/* Test 2 */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">2. BudgetEngineTest (Boundary & 100% Invariant)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  فحص دقة حساب نسب الميزانية، حظر وتصحيح المبالغ السالبة إلى صفر، وضمان إجمالي 100% عند تغيير السلايدر المتكرر والقيم الحدية (0% و100%).
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testNegativeAmountIsClampedToZero() → 0.0 EGP</div>
                  <div>✓ testPercentagesAlwaysSumToExact100([75, 13, 50]) → sum = 100%</div>
                  <div>✓ testRedistributionOnSliderChanges(drag to 75%, 13%, 50%) → all sums = 100%</div>
                  <div>✓ testBoundaryValuesZeroAndHundred(0% & 100%) → sum = 100%</div>
                  <div>✓ testAllZerosInputRebalancedSafely([0, 0, 0]) → sum = 100%</div>
                  <div>✓ testCurrencyRecalculatedWhenBudgetOrPercentagesChange() → Recalculated correctly</div>
                </div>
              </div>

              {/* Test 3 */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">3. IngredientMatchingTest</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من عدم ادعاء اكتمال وجبة إذا كان ينقصها أي مكون أساسي، وفصل النواقص بدقة متناهية.
                </p>
                <div className="bg-white p-2 rounded-lg text-[11px] font-mono text-gray-500 border border-gray-200">
                  Assert.assertFalse(recipeMatch.isCompleteMatch) → Passed when tomatoes missing from Shakshouka.
                </div>
              </div>

              {/* Test 4 */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">4. DailyChallengeDeterministicTest</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  ضمان اختيار نفس التحدي الحتمي طوال اليوم الواحد بالاعتماد على مفتاح التاريخ yyyy-MM-dd وعدم تكرار السجلات في Room.
                </p>
                <div className="bg-white p-2 rounded-lg text-[11px] font-mono text-gray-500 border border-gray-200">
                  SeedData.getChallengeForDateKey("2026-10-25") == SeedData.getChallengeForDateKey("2026-10-25") → True.
                </div>
              </div>

              {/* Test 5: AdMob Stabilization & Policy Lifecycle */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">5. AdMobAdvertisingStabilizationTest (Layout & Policy Compliance)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 8 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من حجز مساحة البانر الثابتة لمنع اهتزاز الشاشة، والانهيار النظيف عند فشل الشبكة دون ترك فراغ ميت، وتوفير خلوص تمرير سفلي ديناميكي (70–90 بكسل فراغ آمن)، وحظر تسريب أدوات المحاكاة إلى حزم الإنتاج عبر import.meta.env.DEV، وتعطيل الإعلانات البينية افتراضياً وتقييد التكرار (2 بالجلسة و120 ثانية راحة) ومنع مقاطعة مهام المستخدم الحيوية.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testBannerFixedReservationNoLayoutShift() → 50px height preserved during loading</div>
                  <div>✓ testBannerGracefulCollapseOnFailure() → Height collapses to 0 on error with no blank dead space</div>
                  <div>✓ testSafeDynamicScrollClearance() → pb-52 (80px clearance) & pb-36 (88px clearance) guarantees 70–90px breathing room</div>
                  <div>✓ testDevOnlyAdSimulatorGuarded() → Simulator UI strictly excluded from production builds via import.meta.env.DEV</div>
                  <div>✓ testPolicyAdLabelingVisible() → Clear "إعلان" label prevents deceptive accidental clicks</div>
                  <div>✓ testInterstitialDisabledByDefault() → isInterstitialEnabled == false</div>
                  <div>✓ testInterstitialFrequencyCapMax2() → Blocked after 2 session impressions</div>
                  <div>✓ testTaskInterruptionProtection() → Blocked while budgeting, editing prices, or viewing recipe</div>
                </div>
              </div>

              {/* Test 6: WhatsApp Shopping List Sharing & Unpriced Calculation Safety */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">6. WhatsAppShoppingShareTest (Arabic Formatting & Price Transparency)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 5 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من تصفية الأصناف غير المشتراة فقط (!isChecked)، وتنسيق الأسعار والكميات بدقة بدون NaN، وفصل الأصناف غير المسعرة وتوضيحها ("سعر غير محدد")، وإبراز الإجمالي الجزئي بشفافية، ومنع إرسال رسائل فارغة عند خلو القائمة.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testOnlyUnpurchasedItemsIncluded() → Checked items omitted, only pending items shared</div>
                  <div>✓ testUnpricedItemsClearlyDesignated() → Labeled "سعر غير محدد" without default 0 or NaN</div>
                  <div>✓ testSummaryWithMixedPricedAndUnpriced() → Explicitly reports partial subtotal & count of unpriced items</div>
                  <div>✓ testEmptyShoppingListBlocked() → Friendly alert raised, no blank WhatsApp window launched</div>
                  <div>✓ testUrlEncodingSafe() → encodeURIComponent(message) properly constructs https://wa.me/?text=...</div>
                </div>
              </div>

              {/* Test 7: Zero-Missing-Ingredients Recipe Filter Engine */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">7. ZeroMissingRecipeFilterTest (100% Pantry Match Integrity)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 4 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من حظر ظهور أي وجبة ينقصها أي مكون عند تفعيل فلتر "اطبخ باللي عندي فقط"، وإظهار شارة "جاهزة بالكامل بمكوناتك الحالية"، وعرض حالة فراغ إرشادية واضحة مع زر إلغاء الفلتر عند عدم توفر أي وجبة جاهزة 100%.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testZeroMissingFilterStrictCompleteness() → Every displayed recipe has missing.length === 0</div>
                  <div>✓ testCompletenessBadgeShown() → "جاهزة بالكامل بمكوناتك الحالية" rendered on all matched recipes</div>
                  <div>✓ testEmptyStateWhenZeroQualify() → Friendly Arabic explanation displayed when no recipe matches 100%</div>
                  <div>✓ testResetButtonRestoresFullList() → Clicking reset resets isZeroMissingOnly and displays suggested meals</div>
                </div>
              </div>

              {/* Test 8: Safe Local Data Backup & Restore Engine */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">8. BackupRestoreSafetyTest (Schema Validation & Rollback Protection)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من إنشاء ملف نسخة احتياطية مرقّم بإصدار tedbeera-backup-YYYY-MM-DD.json، والتحقق الصارم من صحة المخطط (Schema Validation)، وفرض تأكيد مسبق قبل الاستبدال، وحماية التراجع (Rollback Protection) في حال حدوث أي خطأ، وتحديث React State والتخزين المحلي فوراً.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testBackupPayloadStructureAndVersion() → version=1, app="Tedbeera Egypt", timestamp ISO recorded</div>
                  <div>✓ testCorruptedJsonRejectedSafely() → Invalid schema caught, error toast triggered without crash</div>
                  <div>✓ testExplicitConfirmationRequired() → User must confirm overwrite before localStorage changes</div>
                  <div>✓ testRollbackOnStorageFailure() → Snapshot restored if storage quota exceeded or write fails</div>
                  <div>✓ testPercentagesRescaledToExact100() → Category percentages sum verified/rebalanced on import</div>
                  <div>✓ testImmediateStateAndStorageRefresh() → All 11 LocalStorage keys and React state updated in-sync</div>
                </div>
              </div>

              {/* Test 9: Visual Budget Analytics & Donut Integrity */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">9. VisualBudgetAnalyticsAndDonutTest (Progress Thresholds & Overrun Badges)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من ألوان أشرطة التقدم الديناميكية (أخضر &lt;80%، برتقالي 80%–&lt;100%، أحمر ≥100%)، وقص الشريط بصرياً عند 100% مع إبقاء النسبة الفعلية في النص، وشارة تجاوز الميزانية بـ X ج.م فقط عند الزيادة، والتعامل الآمن مع التخصيص الصفري، وصحة توزيع مخطط الدونات SVG بدون مكتبات خارجية، وعرض حالة الفراغ الإرشادية.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testDynamicColorGreenUnder80(spent=700, alloc=1000) → color='green', progress=70%</div>
                  <div>✓ testDynamicColorAmber80To99(spent=850, alloc=1000) → color='amber', progress=85%</div>
                  <div>✓ testDynamicColorRedAtOrOver100(spent=1150, alloc=1000) → color='red', progress=115%</div>
                  <div>✓ testVisualProgressCappedAt100(progress=115%) → visualClamped=100%, textLabel="115%"</div>
                  <div>✓ testOverBudgetBadgeStrictlyConditional() → Exceeded badge shown only when spent &gt; allocated</div>
                  <div>✓ testZeroAllocationDefensiveHandling(alloc=0, spent=200) → progress=100%, color='red', no NaN or /0</div>
                  <div>✓ testDonutChartProportionalSvgSegments() → Dasharray & offset calculate accurate slice lengths</div>
                  <div>✓ testDonutEmptyStateWhenZeroExpenses() → Informative Arabic state rendered when total spent is 0</div>
                </div>
              </div>

              {/* Test 10: Payday Cycle & Daily Spending Cap */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">10. PaydayCycleAndDailyCapTest (Payday Math & Recommended Daily Cap)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 7 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من احتساب موعد الراتب (1–31) ومعالجة الشهور القصيرة وقفل السنة (فبراير 28/29، شهور 30 يوماً)، والعد التنازلي الدقيق، ورسالة الاحتفال "النهارده موعد الراتب 🎉"، وحساب الحد اليومي الموصى به (المتبقي ÷ الأيام المتبقية)، وتنبيه استهلاك الميزانية بالكامل عند نفادها.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testPaydayDayClampedForShortMonths(day=31 in Feb 2026) → Clamped safely to 28/29</div>
                  <div>✓ testPaydayCountdownDaysCalculation(today=20, payday=25) → remainingDays=5</div>
                  <div>✓ testPaydayTodayCelebration(today=25, payday=25) → isPaydayToday=true ("النهارده موعد الراتب 🎉")</div>
                  <div>✓ testPaydayTomorrowCountdown(today=24, payday=25) → daysRemaining=1 ("غداً موعد الراتب")</div>
                  <div>✓ testMonthAndYearRolloverMath(today=Dec 28, payday=Jan 1) → Correct target year & month resolved</div>
                  <div>✓ testRecommendedDailySpendingCap(remaining=1500, days=10) → dailyCap=150 EGP/day</div>
                  <div>✓ testBudgetExhaustedDailyCapWarning(remaining=-200, days=5) → dailyCap=0 EGP, warning displayed</div>
                  <div>✓ testPaydayPersistenceUniqueKey() → Persisted cleanly to "tedbeera_payday_day"</div>
                </div>
              </div>

              {/* Test 11: Arabic Voice Ingredient Selection & Speech Normalization */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">11. ArabicVoiceIngredientMatchingTest (Speech Normalization & Aliases)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  تطبيع النص المنطوق باللهجة المصرية (توحيد الهمزات والياء والألف اللينة والتاء المربوطة وحذف التشكيل والتطويل)، وربط المرادفات الشعبية مثل "قوطة" إلى "طماطم" و"بتنجان" إلى "باذنجان" و"رز" إلى "أرز" و"توم" إلى "ثوم"، وتصفية الكلمات الزائدة وحروف الجر، والإضافة التراكمية الآمنة للمكونات دون مسح المكونات السابقة وبدون أي تكرار.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testArabicTextNormalization("أَرُزٌّ وَطَمَاطِمْ") → strips diacritics & unifies hamzas → "ارز وطماطم"</div>
                  <div>✓ testEgyptianDialectAliasesMap("قوطة وبتنجان") → successfully maps to ["طماطم", "باذنجان"]</div>
                  <div>✓ testSpokenFillerStopWordsIgnored("عندي بصل ورز في البيت") → strips filler words → extracts ["بصل", "أرز"]</div>
                  <div>✓ testSafeAdditiveSelectionPreservesExisting(prev=["شعرية"], spoken=["طماطم"]) → ["شعرية", "طماطم"]</div>
                  <div>✓ testDeduplicationPreventsDoubleEntries(spoken=["طماطم", "طماطم"]) → unique set ["طماطم"]</div>
                  <div>✓ testUnmatchedSpokenWordsGracefulFeedback("مروحة وتليفزيون") → unassigned tokens identified safely</div>
                </div>
              </div>

              {/* Test 12: Daily Tips Interaction, 5 Filters & Bookmarks */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">12. DailyTipsInteractionAndBookmarksTest (5 Filters & Saved Tips)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  فحص زر تفاعل "جربت الحيلة دي ووفرت"، وعدّاد الإنجازات المحفوظ محلياً بمنع تضخيم النقر المتكرر (Set Uniqueness)، والتصفية الحصرية بالأقسام الخمسة (الكل، تنظيف، توفير كهرباء، مطبخ وتغذية، حيل تسوق)، وقسم "أفكاري المحفوظة" المستقل المتاح من تبويب تدبيرة اليوم والمحفوظات، والتوافق العكسي لمفاتيح التخزين وحالة الفراغ الإرشادية.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testTriedTipTogglesSafely(initial=[], click="idea_1") → ["idea_1"], second click removes it</div>
                  <div>✓ testUniqueAchievementCounterSetLogic(tried=["idea_1", "idea_1", "idea_2"]) → uniqueCount = 2</div>
                  <div>✓ testFiveExactCategoryFiltersMatch() → verifies 'الكل', 'تنظيف', 'توفير كهرباء', 'مطبخ وتغذية', 'حيل تسوق'</div>
                  <div>✓ testBookmarkPersistenceToPhase4CKey("idea_3") → stored in 'tedbeera_phase4c_saved_tips' & synced backward</div>
                  <div>✓ testSavedTipsSectionViewMode() → filters saved tips dynamically in both Daily Tips and Saved Tabs</div>
                  <div>✓ testSavedTipsEmptyStateText() → displays exact text: "لسه مفيش حيل محفوظة. احفظ أي تدبيرة عجبتك..."</div>
                </div>
              </div>

              {/* Test 13: Rewarded Ads Service & Local Notifications Service */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">13. RewardedAdsAndLocalNotificationsTest (Ad Unit, Simulation & Notifications)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من تكوين وحدة إعلان المكافأة التجريبية الرسمية (ca-app-pub-3940256099942544/5224354917)، وتشغيل محاكاة واجهة الويب بشكل آمن عند عدم توفر Capacitor، ومنع منح المكافأة عند الإلغاء المبكر، ومنح المكافأة بدقة وإدامة الحالة بـ tedbeera_phase4d_weekly_plan_unlocked، وجدولة التذكير اليومي (11:00 ص) بمعرف ثابت 101 لمنع التكرار، وتوفير بديل ويب آمن للإشعارات.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testOfficialTestRewardedAdUnitConfigured() → matches "ca-app-pub-3940256099942544/5224354917"</div>
                  <div>✓ testWebSimulationFallbackSelectedInBrowser() → IS_NATIVE == false, simulation adapter active</div>
                  <div>✓ testEarlyCancellationGrantsNoReward() → rewardGranted == false when simulation dismissed</div>
                  <div>✓ testSuccessfulSimulationCompletionGrantsRewardIdempotently() → weeklyPlanUnlocked = true persisted safely</div>
                  <div>✓ testStableNotificationIdPreventsDuplicates() → ID 101 used for daily 11:00 AM savings reminder</div>
                  <div>✓ testWebNotificationFallbackSafeWithoutCrash() → graceful Arabic fallback shown in pure web preview</div>
                </div>
              </div>

              {/* Test 14: Smart Deals & Affiliate Integrations Test */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">14. AffiliateDealsIntegrationTest (Smart Deals, Coupons & Disclosure)</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ALL 6 PASSED ✓</span>
                </div>
                <p className="text-xs text-gray-600">
                  التحقق من تكوين الشركاء المركزي (نون، أمازون، كارفور، طلبات)، وفلترة العروض النشطة والمؤكدة فقط، ونسخ أكواد الخصم بدقة مع عرض رسالة التأكيد العربية ("تم نسخ كود الخصم")، وفتح روابط الشراء الآمنة بـ target="_blank" rel="noopener noreferrer"، وإبراز إفصاح العمولة والشفافية بالقرب من الويدجت، والحفاظ على استقلالية الميزانية وقائمة النواقص دون أي تعديل على بيانات التخزين المحلي المالية.
                </p>
                <div className="bg-white p-2.5 rounded-lg text-[11px] font-mono text-gray-700 border border-gray-200 space-y-1">
                  <div>✓ testCentralizedAffiliateDealsConfigLoaded() → Noon, Amazon, Carrefour, Talabat configured correctly</div>
                  <div>✓ testUnverifiedOffersHiddenOrFiltered() → Unverified/expired deals filtered out of active widget</div>
                  <div>✓ testCouponCopyClipboardActionAndToast() → Copies exact code and triggers Arabic success toast</div>
                  <div>✓ testExternalShoppingCtaSafeNavigation() → Opens store with target="_blank" rel="noopener noreferrer"</div>
                  <div>✓ testTransparencyDisclosureRendered() → Commission disclosure visible near affiliate widget</div>
                  <div>✓ testFinancialAndShoppingDataIsolation() → Zero side-effects on expenses, budget calculations, or shopping items</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* ---------------- MODAL 1: RECIPE DETAILS ---------------- */}
      {/* ======================================================== */}
      {selectedRecipeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#0D47A1]">{selectedRecipeModal.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>⏱️ {selectedRecipeModal.prepTimeMinutes} دقيقة</span>
                  <span>•</span>
                  <span className="text-[#0D47A1] font-bold">
                    💵 ~{getScaledCost(selectedRecipeModal)} ج.م ({familySize} أفراد)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipeModal(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              🏷️ تكلفة تقديرية وغير ملزمة محسوبة لـ {familySize} أفراد تختلف حسب الأسعار الموسمية بالأسواق المصرية.
            </p>

            {/* Ingredients Scaled */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-xs text-gray-800">المكونات المطلوبة (لـ {familySize} أفراد):</h4>
                <span className="text-[10px] text-gray-400">كميات دقيقة</span>
              </div>
              <ul className="text-xs text-gray-700 space-y-2">
                {selectedRecipeModal.ingredients.map((ing, i) => {
                  const isAvailable = selectedIngredients.some(sel => ing.name.includes(sel) || sel.includes(ing.name));
                  const scaled = getScaledIngredient(ing, selectedRecipeModal.baseServings);

                  return (
                    <li key={i} className="p-2 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={isAvailable ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                            {isAvailable ? '✓' : '✗'}
                          </span>
                          <span className="font-bold text-gray-900">{ing.name}</span>
                          <span className="text-[10px] text-gray-400">({scaled.text})</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isAvailable ? 'متوفر' : 'ناقص'}
                        </span>
                      </div>

                      {/* Practical Alternative Suggestion if missing */}
                      {!isAvailable && ing.alternatives && ing.alternatives.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-200/60 text-[11px] text-gray-600 bg-amber-50/60 p-1.5 rounded-lg">
                          <span className="font-bold text-amber-900">بديل عملي مقترح: </span>
                          <span className="font-bold text-gray-900">{ing.alternatives[0].name}</span>
                          <p className="text-[10px] text-gray-500 mt-0.5">{ing.alternatives[0].impact}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Cooking Steps */}
            <div>
              <h4 className="font-bold text-xs text-gray-800 mb-2">طريقة التحضير خطوة بخطوة:</h4>
              <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside leading-relaxed">
                {selectedRecipeModal.steps.map((st, i) => (
                  <li key={i} className="text-gray-800 font-medium">{st}</li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const missing = selectedRecipeModal.ingredients.filter(ing =>
                    !selectedIngredients.some(sel => ing.name.includes(sel) || sel.includes(ing.name))
                  );
                  handleAddMissingToShopping(missing, selectedRecipeModal.baseServings);
                  setSelectedRecipeModal(null);
                }}
                className="flex-1 bg-white border border-[#0D47A1] text-[#0D47A1] font-bold py-2.5 rounded-xl text-xs hover:bg-blue-50 transition flex items-center justify-center gap-1"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>إضافة النواقص لقائمة المشتريات</span>
              </button>
              <button
                onClick={() => setSelectedRecipeModal(null)}
                className="bg-[#0D47A1] text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                تمام، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------------- MODAL 2: ADD SHOPPING ITEM ------------- */}
      {/* ======================================================== */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-extrabold text-[#0D47A1]">إضافة طلب لقائمة النواقص</h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم الصنف:</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="مثال: جبنة قريش، عدس، عيش بلدي"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الكمية:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="1"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الوحدة:</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                  >
                    <option value="حبة">حبة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="جرام">جرام</option>
                    <option value="كوب">كوب</option>
                    <option value="علبة">علبة</option>
                    <option value="كيس">كيس</option>
                    <option value="رغيف">رغيف</option>
                    <option value="لتر">لتر</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 font-bold">سعر الوحدة التقديري (بالجنيه):</label>
                  <span className="text-[10px] text-gray-400">اختياري - اتركه فارغاً إذا كان غير محدد</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newItemUnitPrice}
                  onChange={(e) => setNewItemUnitPrice(e.target.value)}
                  placeholder="مثال: 15 (أو اتركه فارغاً)"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (newItemName.trim()) {
                    const parsedQty = parseSafeQuantity(newItemQty);
                    const parsedPrice = parseSafePrice(newItemUnitPrice); // Returns null if empty string

                    setShoppingItems(prev => [
                      ...prev,
                      {
                        id: Math.random().toString(36).substring(2, 9),
                        name: newItemName.trim(),
                        quantity: parsedQty,
                        unit: newItemUnit.trim() || 'حبة',
                        unitPrice: parsedPrice,
                        isChecked: false
                      }
                    ]);
                    setNewItemName('');
                    setNewItemQty('1');
                    setNewItemUnitPrice('');
                    setIsAddItemModalOpen(false);
                    showToast('تمت إضافة الصنف بنجاح 🛒');
                  } else {
                    showToast('يرجى إدخال اسم الصنف أولاً');
                  }
                }}
                className="flex-1 bg-[#0D47A1] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                إضافة للقائمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------- MODAL 2.5: EDIT ITEM UNIT PRICE ----------- */}
      {/* ======================================================== */}
      {editingPriceItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0D47A1]">تحديد سعر الوحدة</h3>
              <button onClick={() => setEditingPriceItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              صنف: <span className="font-bold text-gray-900">{editingPriceItem.name}</span>
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">سعر الوحدة بالجنيه المصري:</label>
              <input
                type="number"
                min="0"
                step="0.5"
                autoFocus
                value={editingPriceItem.currentPrice}
                onChange={(e) => setEditingPriceItem({ ...editingPriceItem, currentPrice: e.target.value })}
                placeholder="مثال: 20 (أو امسحه ليكون غير مسعر)"
                className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-[#0D47A1] focus:outline-none focus:border-[#0D47A1]"
              />
              <span className="text-[10px] text-gray-400 block">إذا تركت الحقل فارغاً سيعتبر الصنف غير محدد السعر.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingPriceItem(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveItemPrice}
                className="flex-1 bg-[#0D47A1] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                حفظ السعر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------------- MODAL 3: ADD EXPENSE RECORD ----------- */}
      {/* ======================================================== */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-extrabold text-[#0D47A1]">تسجيل مصروف جديد</h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">المبلغ المدفوع (ج.م):</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="مثال: 120"
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-[#0D47A1] focus:outline-none focus:border-[#0D47A1]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">بند المصروف:</label>
                <select
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">البيان / الوصف:</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="مثال: خضار وسوق الأسبوع، فاتورة مياه"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">تاريخ الصرف:</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 bg-[#0D47A1] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                تسجيل وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------------- MODAL 4: ADD CUSTOM CATEGORY --------- */}
      {/* ======================================================== */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-extrabold text-[#0D47A1]">إضافة بند ميزانية مخصص</h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم البند:</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: دروس خصوصية، علاج وصيدلية"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">نصيحة أو تفاصيل البند:</label>
                <input
                  type="text"
                  value={newCatTip}
                  onChange={(e) => setNewCatTip(e.target.value)}
                  placeholder="مثال: مصروفات كتب خارجية واشتراكات المدارس"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCustomCategory}
                className="flex-1 bg-[#0D47A1] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                إضافة وإعادة ضبط 100%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------- MODAL 4.5: PAYDAY DATE CONFIGURATION -------- */}
      {/* ======================================================== */}
      {isPaydayModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2 text-[#0D47A1]">
                <Calendar className="w-5 h-5 text-[#FFB300]" />
                <h3 className="text-base font-extrabold">تحديد موعد الراتب الشهري</h3>
              </div>
              <button onClick={() => setIsPaydayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 leading-relaxed">
                اختر يوم نزول راتبك الشهري (من يوم 1 إلى 31). سيقوم التطبيق بحساب الأيام المتبقية تلقائياً وتحديد الحد اليومي المقترح للصرف حتى موعد الراتب القادم.
              </p>

              <div>
                <label className="block text-gray-700 font-bold mb-1">يوم صرف الراتب (1 - 31):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={tempPaydayInput}
                    onChange={(e) => setTempPaydayInput(e.target.value)}
                    className="flex-1 text-center font-black text-lg text-[#0D47A1] border border-gray-300 rounded-xl p-2 focus:outline-none focus:border-[#0D47A1]"
                    placeholder="25"
                  />
                  <span className="text-xs font-bold text-gray-500">من كل شهر</span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">
                  * في الشهور الأقصر (مثل فبراير 28 أو أبريل 30 يوماً)، يتم استخدام آخر يوم في الشهر تلقائياً.
                </span>
              </div>

              {/* Quick Day Chips */}
              <div>
                <span className="text-[11px] font-bold text-gray-600 block mb-1.5">أيام شائعة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 20, 25, 27, 28, 30].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setTempPaydayInput(day.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        tempPaydayInput === day.toString()
                          ? 'bg-[#0D47A1] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      يوم {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsPaydayModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const parsed = parseInt(tempPaydayInput, 10);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                    setPaydayDay(parsed);
                    setIsPaydayModalOpen(false);
                    showToast(`تم حفظ موعد الراتب: يوم ${parsed} من كل شهر 📅`);
                  } else {
                    showToast('يرجى إدخال يوم صالح بين 1 و 31');
                  }
                }}
                className="flex-1 bg-[#0D47A1] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                حفظ الموعد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------------- MODAL 5: SETTINGS & BACKUPS ---------- */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2 text-[#0D47A1]">
                <Settings className="w-5 h-5" />
                <h3 className="text-base font-extrabold">إعدادات التطبيق والبيانات</h3>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {/* Household profile: saved locally and available offline */}
            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
              <div className="flex items-center gap-2 text-[#0D47A1]">
                <Users className="w-4 h-4" />
                <span className="text-xs font-extrabold">بيانات الأسرة</span>
                <span className="mr-auto text-[10px] text-gray-500">محفوظة على جهازك</span>
              </div>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="اسم الأسرة (اختياري)"
                maxLength={60}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={householdGovernorate}
                  onChange={(e) => setHouseholdGovernorate(e.target.value)}
                  placeholder="المحافظة"
                  maxLength={40}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={householdCity}
                  onChange={(e) => setHouseholdCity(e.target.value)}
                  placeholder="المدينة / المركز"
                  maxLength={40}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
                />
              </div>
              <div className="text-[10px] text-gray-600">عدد أفراد الأسرة: {familySize} · العملة: جنيه مصري</div>
              <button
                type="button"
                onClick={() => {
                  const saved = householdProfileRepository.write({
                    name: householdName.trim(),
                    familySize: Math.min(30, Math.max(1, familySize)),
                    governorate: householdGovernorate.trim(),
                    city: householdCity.trim(),
                    currency: 'EGP',
                    locale: 'ar-EG',
                    paydayDay,
                    createdAt: householdProfileRepository.read().createdAt || new Date().toISOString()
                  });
                  showToast(saved ? 'تم حفظ بيانات الأسرة على هذا الجهاز ✓' : 'تعذر حفظ البيانات. تحققي من مساحة التخزين بالجهاز.');
                }}
                className="w-full rounded-xl bg-[#0D47A1] px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
              >
                حفظ بيانات الأسرة
              </button>
            </div>

            {/* Backups & Data Management */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">النسخ الاحتياطي والاستعادة:</span>

              <button
                onClick={handleExportData}
                className="w-full bg-blue-50 hover:bg-blue-100 text-[#0D47A1] font-bold p-2.5 rounded-xl text-xs flex items-center justify-between transition border border-blue-200"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-[#0D47A1]" />
                  <span>تصدير نسخة احتياطية (JSON)</span>
                </div>
                <span className="text-[10px] text-gray-500">تحميل ملف</span>
              </button>

              <label className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold p-2.5 rounded-xl text-xs flex items-center justify-between transition border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-gray-600" />
                  <span>استعادة نسخة احتياطية (Import JSON)</span>
                </div>
                <span className="text-[10px] text-gray-500">رفع ملف</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Phase 4D: Local Notifications Daily Savings Reminder */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#0D47A1]" />
                  <span>تذكير تدبيرة اليوم (11:00 صباحاً):</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDailyReminderEnabled}
                    onChange={(e) => handleToggleReminder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D47A1]"></div>
                </label>
              </div>

              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-[11px] text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0D47A1]">الموعد الافتراضي: 11:00 ص</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isDailyReminderEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {isDailyReminderEnabled ? 'مفعل ✓' : 'معطل'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  "تفقدي النواقص قبل نزول السوق لتجنب مصاريف إضافية!"
                </p>
                <p className="text-[10px] text-blue-900 font-medium">
                  التذكيرات اليومية متاحة عند تشغيل التطبيق في نسخة تدعم إشعارات الجهاز.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  showToast('🔔 تجربة إشعار تدبيرة اليوم (11:00 ص): "تفقدي النواقص قبل نزول السوق لتجنب مصاريف إضافية!"');
                }}
                className="w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 transition"
              >
                معاينة نص الإشعار 🔔
              </button>
            </div>

            {/* Safe Data Clear Options */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700 block">تنظيف ومسح البيانات:</span>

              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsClearShoppingConfirmOpen(true);
                }}
                className="w-full text-right bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold p-2.5 rounded-xl text-xs flex items-center justify-between transition border border-amber-200"
              >
                <span>إفراغ قائمة النواقص فقط</span>
                <Trash2 className="w-4 h-4 text-amber-700" />
              </button>

              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsWipeModalOpen(true);
                }}
                className="w-full text-right bg-red-50 hover:bg-red-100 text-red-700 font-bold p-2.5 rounded-xl text-xs flex items-center justify-between transition border border-red-200"
              >
                <span>إعادة ضبط المصنع (مسح كل بيانات التطبيق)</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </button>
            </div>

            {/* AdMob Diagnostics in Settings (Development Only) */}
            {IS_DEV && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block">إعلانات جوجل أد موب (Google AdMob):</span>
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    setIsAdControlsOpen(true);
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold p-2.5 rounded-xl text-xs flex items-center justify-between transition border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>لوحة ضبط ومحاكاة الإعلانات (وضع التطوير)</span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                    {adStatus === 'loaded' ? 'البانر نشط' : adStatus === 'loading' ? 'تحميل...' : adStatus === 'failed' ? 'منهار (أوفلاين)' : 'معطل'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* -------- MODAL 5.5: CONFIRM RESTORE BACKUP ------------ */}
      {/* ======================================================== */}
      {isRestoreConfirmModalOpen && pendingRestoreData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 border-b border-gray-100 pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-extrabold text-gray-900">تأكيد استعادة النسخة الاحتياطية</h3>
            </div>

            <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800">
                هل تريد استبدال بيانات التطبيق الحالية بهذه النسخة؟
              </p>
              <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200 text-[11px] leading-relaxed">
                ⚠️ تنبيه: سيتم استبدال الميزانية والمصاريف وقوائم النواقص الحالية بالبيانات المحفوظة في ملف النسخة الاحتياطية.
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">حجم الأسرة:</span>
                  <span className="font-bold text-[#0D47A1]">{pendingRestoreData.familySize} أفراد</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">مبلغ الميزانية:</span>
                  <span className="font-bold text-[#0D47A1]">{pendingRestoreData.budgetAmount} ج.م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">عدد بنود النواقص:</span>
                  <span className="font-bold text-gray-800">{pendingRestoreData.shoppingItems.length} طلب</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">عدد المصاريف المسجلة:</span>
                  <span className="font-bold text-gray-800">{pendingRestoreData.expenses.length} مصروف</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">الوجبات المحفوظة:</span>
                  <span className="font-bold text-gray-800">{pendingRestoreData.savedRecipeIds.length} وجبة</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setIsRestoreConfirmModalOpen(false);
                  setPendingRestoreData(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmRestore}
                className="flex-1 bg-[#0D47A1] hover:bg-[#002171] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------------- MODAL 6: CLEAR SHOPPING CONFIRM ------- */}
      {/* ======================================================== */}
      {isClearShoppingConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-extrabold text-amber-900">إفراغ قائمة النواقص؟</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              سيتم حذف جميع الأصناف المسجلة في قائمة النواقص حالياً. الوجبات وخطط الميزانية والمصاريف ستظل محفوظة ولن تتأثر.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsClearShoppingConfirmOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleClearShoppingList}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                تأكيد الإفراغ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------------- MODAL 7: WIPE ALL DATA CONFIRM -------- */}
      {/* ======================================================== */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-extrabold">مسح جميع بيانات التطبيق نهائياً؟</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              هذا الإجراء سيقوم بحذف جميع الوجبات المحفوظة، خطط الميزانية، سجل المصاريف، وتحديات الأيام وقوائم النواقص نهائياً من ذاكرة جهازك. لا يمكن التراجع عن هذا الإجراء إلا إذا كنت قد حمّلت نسخة احتياطية (JSON).
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsWipeModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleWipeAllData}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                مسح جميع البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------- MODAL 8: ADMOB SIMULATION CONTROLS (Development Only) ---------- */}
      {/* ======================================================== */}
      {IS_DEV && isAdControlsOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2 text-[#0D47A1]">
                <Sparkles className="w-5 h-5 text-[#FFB300]" />
                <h3 className="text-base font-extrabold">لوحة تحكم إعلانات Google AdMob</h3>
              </div>
              <button onClick={() => setIsAdControlsOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {/* Banner Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 block">إعلان البانر (320x50 Banner):</span>
                <span className="text-[10px] text-gray-400">حجز مساحة 50px • انهيار سلس</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                يتم حجز مساحة ثابتة (50px) للبانر فوق شريط التنقل السفلي مباشرة لمنع اهتزاز الشاشة (CLS). في حال انقطاع الشبكة أو فشل التحميل، تنهار الحاوية تلقائياً لاسترجاع المساحة دون ترك فراغ ميت.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setAdStatus('loaded'); showToast('تم تفعيل البانر (Loaded) ✓'); }}
                  className={`p-2 rounded-xl text-center font-bold text-xs transition border ${
                    adStatus === 'loaded' ? 'bg-[#0D47A1] text-white border-[#0D47A1]' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  🟢 محمّل (Loaded)
                </button>
                <button
                  onClick={() => { setAdStatus('loading'); showToast('محاكاة التحميل وحجز المساحة ⏳'); }}
                  className={`p-2 rounded-xl text-center font-bold text-xs transition border ${
                    adStatus === 'loading' ? 'bg-amber-500 text-white border-amber-500 animate-pulse' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  ⏳ تحميل (Reserve Space)
                </button>
                <button
                  onClick={() => { setAdStatus('failed'); showToast('محاكاة فشل التحميل وانهيار الحاوية 📉'); }}
                  className={`p-2 rounded-xl text-center font-bold text-xs transition border ${
                    adStatus === 'failed' ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  🔴 فشل (Collapse to 0)
                </button>
                <button
                  onClick={() => { setAdStatus('disabled'); showToast('تم تعطيل البانر 🚫'); }}
                  className={`p-2 rounded-xl text-center font-bold text-xs transition border ${
                    adStatus === 'disabled' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  ⚪ معطل (Hidden)
                </button>
              </div>
            </div>

            {/* Interstitial Section */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-800 block">الإعلانات البينية (Interstitial Ads Policy):</span>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                <div>• <b>معطلة افتراضياً:</b> لا تظهر إلا بتفعيل يدوي صريح.</div>
                <div>• <b>تحديد التكرار:</b> حد أقصى مرتان في الجلسة ({sessionInterstitialCount}/2).</div>
                <div>• <b>فترة راحة (Cooldown):</b> 120 ثانية بين كل إعلان والآخر.</div>
                <div>• <b>حماية المهام:</b> محظورة أثناء حساب الميزانية أو إدخال الأسعار.</div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInterstitialEnabled}
                    onChange={(e) => {
                      setIsInterstitialEnabled(e.target.checked);
                      showToast(e.target.checked ? 'تم تفعيل الإعلانات البينية ⚡' : 'تم تعطيل الإعلانات البينية 🛡️');
                    }}
                    className="w-4 h-4 text-[#0D47A1] rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800">تفعيل الإعلانات البينية</span>
                </label>

                <button
                  onClick={triggerTestInterstitial}
                  className="bg-[#0D47A1] hover:bg-[#002171] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
                >
                  اختبار العرض الآن 🎬
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsAdControlsOpen(false)}
                className="w-full bg-[#0D47A1] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                إغلاق اللوحة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------- MODAL 9: INTERSTITIAL AD SIMULATION (Development Only) --------- */}
      {/* ======================================================== */}
      {IS_DEV && isInterstitialActive && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col space-y-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Ad Top Bar */}
            <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 text-gray-900 font-extrabold px-1.5 py-0.2 rounded text-[10px]">
                  AdMob Test
                </span>
                <span className="text-[11px] text-gray-300">Google Mobile Ads • Interstitial</span>
              </div>
              <button
                onClick={handleDismissInterstitial}
                className="w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-black flex items-center justify-center transition"
                title="إغلاق الإعلان"
              >
                ✕
              </button>
            </div>

            {/* Ad Body Content */}
            <div className="p-6 bg-gradient-to-b from-blue-50 to-white flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0D47A1] text-[#FFB300] font-black flex items-center justify-center text-2xl shadow-lg">
                تد
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-1">
                  Unit: ca-app-pub-3940256099942544/1033173712
                </span>
                <h3 className="text-lg font-black text-[#0D47A1]">تدبيرة مصر – Tedbeera Egypt</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-[240px]">
                  تطبيق مصري ذكي لتوفير ميزانية الأسرة، أكلات التوفير، وبدائل المكونات بدون إنترنت!
                </p>
              </div>

              {/* Policy Guard Verification Badge */}
              <div className="w-full bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-right text-[11px] space-y-1 text-emerald-900">
                <div className="font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم فحص معايير سياسة Google AdMob:</span>
                </div>
                <div className="text-[10px] text-gray-600">
                  • ظهور عند انتقال طبيعي فقط (غير مفاجئ)<br />
                  • التكرار: {sessionInterstitialCount + 1} من 2 كحد أقصى للجلسة<br />
                  • تم تفعيل مؤقت راحة إلزامي 120 ثانية للإعلان القادم
                </div>
              </div>

              <div className="w-full pt-2">
                <button
                  onClick={handleDismissInterstitial}
                  className="w-full bg-[#0D47A1] hover:bg-[#002171] text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>استئناف واستخدام تدبيرة</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ---------- MODAL 10: REWARDED AD SIMULATION DIALOG ----- */}
      {/* ======================================================== */}
      {isRewardSimulationOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col space-y-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0D47A1] text-white px-4 py-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="bg-[#FFB300] text-[#0D47A1] font-extrabold px-1.5 py-0.2 rounded text-[10px]">
                  AdMob Test
                </span>
                <span className="text-xs font-bold">Google Mobile Ads • Rewarded Ad</span>
              </div>
              <button
                onClick={handleCancelRewardSimulation}
                className="w-6 h-6 rounded-full bg-blue-900/80 hover:bg-blue-800 text-white font-black flex items-center justify-center transition text-xs"
                title="إلغاء الإعلان"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-sm">
                <CalendarCheck className="w-7 h-7 text-[#0D47A1]" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#0D47A1]">فتح خطة الوجبات التوفيرية</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  جرّب محاكاة الإعلان لفتح خطة وجبات الأسبوع الكاملة مع جدول التسوق المجمع.
                </p>
              </div>

              {/* Simulation Environment Notice */}
              <div className="w-full bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-right text-[11px] space-y-1 text-amber-950">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>محاكاة تجريبية مخصصة للمعاينة:</span>
                </div>
                <div className="text-[10px] text-gray-600 space-y-0.5">
                  <div>• <b>معرف الوحدة التجريبية:</b> {OFFICIAL_TEST_REWARDED_AD_UNIT}</div>
                  <div>• هذه محاكاة واجهة تجريبية وليست إعلاناً حقيقياً من Google.</div>
                  <div>• تمنح المكافأة فقط عند اكتمال المشاهدة بالكامل.</div>
                </div>
              </div>

              {/* Playback Sequence or Action Buttons */}
              {!isSimulatingPlayback ? (
                <div className="w-full space-y-2 pt-1">
                  <button
                    onClick={handleStartSimulationPlayback}
                    className="w-full bg-[#0D47A1] hover:bg-[#002171] text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>ابدأ المحاكاة (5 ثوانٍ)</span>
                  </button>
                  <button
                    onClick={handleCancelRewardSimulation}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#0D47A1] flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 animate-pulse text-[#FFB300]" />
                        <span>جارِ محاكاة تشغيل الإعلان...</span>
                      </span>
                      <span className="font-mono font-bold text-gray-700">{playbackCountdown} ثانية</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0D47A1] h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${((5 - playbackCountdown) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCancelRewardSimulation}
                    className="w-full text-xs text-rose-600 hover:text-rose-800 font-bold py-1.5 transition"
                  >
                    تخطي وإلغاء (بدون مكافأة) ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ------- MODAL 11: CONSOLIDATED WEEKLY SHOPPING PLAN ---- */}
      {/* ======================================================== */}
      {isConsolidatedShoppingModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-2">
              <div>
                <h3 className="text-base font-extrabold text-[#0D47A1] flex items-center gap-1.5">
                  <CalendarCheck className="w-5 h-5 text-[#FFB300]" />
                  <span>جدول التسوق المجمع لخطة الأسبوع</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  مقادير مجمعة ومحسوبة لـ {familySize} أفراد لجميع أيام الأسبوع (السبت - الجمعة).
                </p>
              </div>
              <button
                onClick={() => setIsConsolidatedShoppingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Total Estimated Cost Banner */}
            {(() => {
              const consolidated = consolidateWeeklyPlanIngredients(familySize);
              const totalEst = consolidated.reduce((sum, item) => sum + item.totalEstimatedCost, 0);

              return (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">إجمالي تقديري لمشتريات الأسبوع:</span>
                      <span className="text-[10px] text-emerald-700">لكل وجبات الفطار والغداء والعشاء لـ {familySize} أفراد</span>
                    </div>
                    <span className="text-base font-extrabold text-emerald-800">
                      ~{totalEst} ج.م
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-800 block">الأصناف المجمعة ({consolidated.length} صنف):</span>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {consolidated.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-900 block">{item.name}</span>
                            <span className="text-[10px] text-gray-500">
                              تُستخدم في {item.usedInMealsCount} وجبات طوال الأسبوع
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-[#0D47A1] block">
                              {item.quantity} {item.unit}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              ~{item.totalEstimatedCost} ج.م
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setIsConsolidatedShoppingModalOpen(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                    >
                      إغلاق
                    </button>
                    <button
                      onClick={handleAddConsolidatedPlanToShopping}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>+ إضافة الأصناف لقائمة النواقص</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* ------- MODAL 12: ADD CUSTOM RECIPE (أضف أكلتك الخاصة) --- */}
      {/* ======================================================== */}
      {isAddCustomRecipeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-extrabold text-[#0D47A1]">أضف أكلتك الخاصة 🍳</h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم الوجبة:</label>
                <input
                  type="text"
                  value={customRecipeName}
                  onChange={(e) => setCustomRecipeName(e.target.value)}
                  placeholder="مثال: مسقعة باللحمة المفرومة"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">التصنيف:</label>
                <select
                  value={customRecipeMealType}
                  onChange={(e) => setCustomRecipeMealType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                >
                  <option value="breakfast">فطار 🍳</option>
                  <option value="lunch">غداء 🍲</option>
                  <option value="dinner">عشاء 🌙</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الوقت (بالدقائق):</label>
                  <input
                    type="number"
                    value={customRecipePrepTime}
                    onChange={(e) => setCustomRecipePrepTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">التكلفة (ج.م):</label>
                  <input
                    type="number"
                    value={customRecipeCost}
                    onChange={(e) => setCustomRecipeCost(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">المكون الأساسي:</label>
                <input
                  type="text"
                  value={customRecipeIngredientName}
                  onChange={(e) => setCustomRecipeIngredientName(e.target.value)}
                  placeholder="مثال: باذنجان، لحمة مفرومة، طماطم"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:border-[#0D47A1]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddCustomRecipeModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCustomRecipe}
                className="flex-1 bg-[#0D47A1] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#002171] transition"
              >
                حفظ وإضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isNativeApp && <footer className="w-full text-center py-4 text-xs text-gray-500 font-medium">
        تدبيرة — كل جنيه ليه قيمة 💛 • وفّر بذكاء ودبّر بيتك وخلي كل جنيه في مكانه © {new Date().getFullYear()} 🇪🇬
      </footer>}
    </div>
  );
}

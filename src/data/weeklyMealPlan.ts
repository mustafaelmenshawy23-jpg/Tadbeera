import { RECIPES, Recipe, Ingredient } from './seedData';
import { ShoppingItem } from './calculationUtils';

export interface DayMealPlan {
  dayId: string;
  dayName: string;
  theme: string;
  breakfastRecipeId: string;
  lunchRecipeId: string;
  dinnerRecipeId: string;
}

export interface ConsolidatedPlanIngredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalEstimatedCost: number;
  usedInMealsCount: number;
}

export const WEEKLY_DAYS_SCHEDULE: DayMealPlan[] = [
  {
    dayId: 'sat',
    dayName: 'السبت',
    theme: 'بداية الأسبوع والتوفير الشعبي',
    breakfastRecipeId: 'rec_foul_salad',
    lunchRecipeId: 'rec_koshary_one_pot',
    dinnerRecipeId: 'rec_tuna_potato_salad'
  },
  {
    dayId: 'sun',
    dayName: 'الأحد',
    theme: 'خضار الفرن والتسبيك المصري',
    breakfastRecipeId: 'rec_shakshouka',
    lunchRecipeId: 'rec_moussaka_potatoes',
    dinnerRecipeId: 'rec_fried_pasta'
  },
  {
    dayId: 'mon',
    dayName: 'الإثنين',
    theme: 'تدوير ذكي لبواقي الأكل والمكرونة',
    breakfastRecipeId: 'rec_baked_eggs_ojja',
    lunchRecipeId: 'rec_leftover_chicken_pasta',
    dinnerRecipeId: 'rec_lentil_soup'
  },
  {
    dayId: 'tue',
    dayName: 'الثلاثاء',
    theme: 'بروتين نباتي سريع وطاقة',
    breakfastRecipeId: 'rec_foul_salad',
    lunchRecipeId: 'rec_koshary_one_pot',
    dinnerRecipeId: 'rec_mashed_potato_eggs'
  },
  {
    dayId: 'wed',
    dayName: 'الأربعاء',
    theme: 'أطباق زمان والدقة والخل والثوم',
    breakfastRecipeId: 'rec_shakshouka',
    lunchRecipeId: 'rec_leftover_meat_fatta',
    dinnerRecipeId: 'rec_fried_pasta'
  },
  {
    dayId: 'thu',
    dayName: 'الخميس',
    theme: 'عشاء خفيف ومسقعة الفرن',
    breakfastRecipeId: 'rec_baked_eggs_ojja',
    lunchRecipeId: 'rec_moussaka_potatoes',
    dinnerRecipeId: 'rec_tuna_potato_salad'
  },
  {
    dayId: 'fri',
    dayName: 'الجمعة',
    theme: 'لمة العيلة المصرية والشوربة الدافية',
    breakfastRecipeId: 'rec_shakshouka',
    lunchRecipeId: 'rec_leftover_chicken_pasta',
    dinnerRecipeId: 'rec_lentil_soup'
  }
];

// Reference market estimate per unit in EGP (for consolidated plan shopping list)
const ESTIMATED_INGREDIENT_PRICES: Record<string, number> = {
  'بيض': 6,          // 6 ج.م للبيضة
  'طماطم': 15,       // 15 ج.م للكيلو/حبات
  'بصل': 12,         // 12 ج.م
  'بطاطس': 15,       // 15 ج.م
  'أرز': 30,          // 30 ج.م للكوب/كيلو
  'مكرونة': 18,       // 18 ج.م
  'عدس أصفر': 25,    // 25 ج.م
  'عدس بجبة': 25,    // 25 ج.م
  'فول': 15,         // 15 ج.م
  'تونة': 35,        // 35 ج.م للعلبة
  'باذنجان': 12,     // 12 ج.م
  'فلفل رومي': 15,   // 15 ج.م
  'ثوم': 5,          // 5 ج.م
  'جبنة': 20,        // 20 ج.م
  'بواقي فراخ': 0,   // بواقي منزلية
  'بواقي لحمة': 0    // بواقي منزلية
};

/**
 * Resolves a Recipe by ID from RECIPES catalog.
 */
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

/**
 * Calculates scaled recipe cost for given family size.
 */
export function calculateRecipeScaledCost(recipe: Recipe, familySize: number): number {
  const ratio = Math.max(1, familySize) / recipe.baseServings;
  return Math.round(recipe.estimatedCostEgp * ratio);
}

/**
 * Calculates total weekly plan cost for family size.
 */
export function calculateWeeklyPlanTotalCost(familySize: number): number {
  let total = 0;
  WEEKLY_DAYS_SCHEDULE.forEach(day => {
    const b = getRecipeById(day.breakfastRecipeId);
    const l = getRecipeById(day.lunchRecipeId);
    const d = getRecipeById(day.dinnerRecipeId);
    if (b) total += calculateRecipeScaledCost(b, familySize);
    if (l) total += calculateRecipeScaledCost(l, familySize);
    if (d) total += calculateRecipeScaledCost(d, familySize);
  });
  return total;
}

/**
 * Consolidates all ingredients across the 7 days of the meal plan,
 * scaling quantities accurately according to family size,
 * merging duplicate ingredient rows, and attaching estimated prices.
 */
export function consolidateWeeklyPlanIngredients(familySize: number): ConsolidatedPlanIngredient[] {
  const safeFamilySize = Math.max(1, familySize);
  const ingredientMap = new Map<string, { quantity: number; unit: string; count: number }>();

  WEEKLY_DAYS_SCHEDULE.forEach(day => {
    const mealIds = [day.breakfastRecipeId, day.lunchRecipeId, day.dinnerRecipeId];
    mealIds.forEach(id => {
      const recipe = getRecipeById(id);
      if (!recipe) return;
      const ratio = safeFamilySize / recipe.baseServings;

      recipe.ingredients.forEach((ing: Ingredient) => {
        // Skip zero-cost leftovers as shopping items if desired, or include them with note
        const key = ing.name.trim();
        const scaledQty = (ing.baseAmount || 1) * ratio;
        const current = ingredientMap.get(key);

        if (current) {
          current.quantity += scaledQty;
          current.count += 1;
        } else {
          ingredientMap.set(key, {
            quantity: scaledQty,
            unit: ing.unit || 'حبة',
            count: 1
          });
        }
      });
    });
  });

  const consolidated: ConsolidatedPlanIngredient[] = [];
  ingredientMap.forEach((val, name) => {
    const roundedQty = Math.round(val.quantity * 10) / 10;
    const estUnitPrice = ESTIMATED_INGREDIENT_PRICES[name] ?? 10;
    const totalCost = Math.round(roundedQty * estUnitPrice);

    consolidated.push({
      name,
      quantity: roundedQty,
      unit: val.unit,
      estimatedUnitPrice: estUnitPrice,
      totalEstimatedCost: totalCost,
      usedInMealsCount: val.count
    });
  });

  // Sort by meals usage count descending
  return consolidated.sort((a, b) => b.usedInMealsCount - a.usedInMealsCount);
}

/**
 * Converts consolidated meal plan ingredients into ShoppingItem objects
 * ready to be merged safely into the user's shopping list without duplicates.
 */
export function convertConsolidatedToShoppingItems(
  consolidated: ConsolidatedPlanIngredient[]
): ShoppingItem[] {
  return consolidated.map(item => ({
    id: `plan_${item.name}_${Math.random().toString(36).substring(2, 6)}`,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.estimatedUnitPrice > 0 ? item.estimatedUnitPrice : null,
    isChecked: false
  }));
}

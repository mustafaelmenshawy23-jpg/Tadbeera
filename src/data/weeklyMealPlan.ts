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
// Prices are stored per the canonical unit returned below (EGP per gram for weight items).
// Leftovers intentionally stay unpriced: they are stock already at home, not assumed purchases.
const ESTIMATED_INGREDIENT_PRICES: Record<string, number> = {
  'بيض': 6, 'طماطم': 15, 'بصل': 12, 'بطاطس': 15,
  'أرز': 30 / 185, 'مكرونة': 18 / 100,
  'عدس أصفر': 25 / 190, 'عدس بجبة': 25 / 190,
  'فول': 15, 'تونة': 35, 'باذنجان': 12, 'فلفل رومي': 15,
  'ثوم': 5, 'جبنة': 20 / 100,
  'بواقي فراخ': 0, 'بواقي لحمة': 0
};

const INGREDIENT_UNIT_RULES: Record<string, { canonicalUnit: string; factors: Record<string, number> }> = {
  'مكرونة': { canonicalUnit: 'جرام', factors: { 'جرام': 1, 'جم': 1, 'g': 1, 'كيلو': 1000, 'كجم': 1000, 'كوب': 100 } },
  'أرز': { canonicalUnit: 'جرام', factors: { 'جرام': 1, 'جم': 1, 'g': 1, 'كيلو': 1000, 'كجم': 1000, 'كوب': 185 } },
  'عدس أصفر': { canonicalUnit: 'جرام', factors: { 'جرام': 1, 'جم': 1, 'g': 1, 'كيلو': 1000, 'كجم': 1000, 'كوب': 190 } },
  'عدس بجبة': { canonicalUnit: 'جرام', factors: { 'جرام': 1, 'جم': 1, 'g': 1, 'كيلو': 1000, 'كجم': 1000, 'كوب': 190 } },
  'جبنة': { canonicalUnit: 'جرام', factors: { 'جرام': 1, 'جم': 1, 'g': 1, 'كيلو': 1000, 'كجم': 1000, 'كوب': 100 } },
  'بواقي فراخ': { canonicalUnit: 'كيلو', factors: { 'كيلو': 1, 'كجم': 1, 'جرام': 0.001, 'جم': 0.001, 'كوب': 0.15 } },
  'بواقي لحمة': { canonicalUnit: 'كيلو', factors: { 'كيلو': 1, 'كجم': 1, 'جرام': 0.001, 'جم': 0.001, 'كوب': 0.15 } }
};

function normalizeIngredientUnit(unit: string): string {
  const value = unit.trim().toLowerCase();
  if (['جم', 'g', 'غرام', 'جرام'].includes(value)) return 'جرام';
  if (['كجم', 'kg', 'كيلوجرام', 'كيلو جرام'].includes(value)) return 'كيلو';
  return value;
}

function toCanonicalIngredientAmount(name: string, quantity: number, unit: string): { quantity: number; unit: string } {
  const rule = INGREDIENT_UNIT_RULES[name];
  if (!rule) return { quantity, unit: normalizeIngredientUnit(unit) };
  const normalizedUnit = normalizeIngredientUnit(unit);
  const factor = rule.factors[normalizedUnit];
  // If a unit is unknown, keep it separate instead of adding unlike quantities.
  if (factor === undefined) return { quantity, unit: normalizedUnit };
  return { quantity: quantity * factor, unit: rule.canonicalUnit };
}

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
  const ingredientMap = new Map<string, { name: string; quantity: number; unit: string; count: number }>();

  WEEKLY_DAYS_SCHEDULE.forEach(day => {
    const mealIds = [day.breakfastRecipeId, day.lunchRecipeId, day.dinnerRecipeId];
    mealIds.forEach(id => {
      const recipe = getRecipeById(id);
      if (!recipe) return;
      const ratio = safeFamilySize / recipe.baseServings;

      recipe.ingredients.forEach((ing: Ingredient) => {
        // Skip zero-cost leftovers as shopping items if desired, or include them with note
        const name = ing.name.trim();
        const scaledQty = (ing.baseAmount || 1) * ratio;
        const normalized = toCanonicalIngredientAmount(name, scaledQty, ing.unit || 'حبة');
        const key = `${name.toLocaleLowerCase()}::${normalized.unit}`;
        const current = ingredientMap.get(key);

        if (current) {
          current.quantity += normalized.quantity;
          current.count += 1;
        } else {
          ingredientMap.set(key, {
            name,
            quantity: normalized.quantity,
            unit: normalized.unit,
            count: 1
          });
        }
      });
    });
  });

  const consolidated: ConsolidatedPlanIngredient[] = [];
  ingredientMap.forEach((val) => {
    const roundedQty = Math.round(val.quantity * 100) / 100;
    const estUnitPrice = ESTIMATED_INGREDIENT_PRICES[val.name] ?? 0;
    const totalCost = Math.round(roundedQty * estUnitPrice);

    consolidated.push({
      name: val.name,
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

import React, { useMemo, useState } from 'react';
import { RECIPES, type Recipe, type Ingredient } from '../../data/seedData';
import { calculateRecipeScaledCost } from '../../data/weeklyMealPlan';
import { inventoryRepository } from '../inventory/inventoryRepository';

interface TodayMealAssistantProps {
  familySize: number;
  monthlyFoodBudget: number;
  onAddMissingToShopping: (missing: Ingredient[], baseServings: number) => void;
}

function getAvailableQuantity(name: string, items: ReturnType<typeof inventoryRepository.read>): number {
  const normalized = name.trim().toLocaleLowerCase('ar-EG');
  return items
    .filter(item => item.name.trim().toLocaleLowerCase('ar-EG') === normalized)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function getMissingIngredients(recipe: Recipe, inventory: ReturnType<typeof inventoryRepository.read>, familySize: number): Ingredient[] {
  const scale = Math.max(1, familySize) / Math.max(1, recipe.baseServings);
  return recipe.ingredients.filter(ingredient =>
    getAvailableQuantity(ingredient.name, inventory) < ingredient.baseAmount * scale
  );
}

export function TodayMealAssistant({ familySize, monthlyFoodBudget, onAddMissingToShopping }: TodayMealAssistantProps) {
  const [inventoryRevision, setInventoryRevision] = useState(0);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  useEffect(() => {
    const refreshInventory = () => setInventoryRevision(value => value + 1);
    window.addEventListener('tedbeera:inventory-updated', refreshInventory);
    return () => window.removeEventListener('tedbeera:inventory-updated', refreshInventory);
  }, []);
  const inventory = useMemo(() => inventoryRepository.read(), [inventoryRevision]);
  const dailyBudget = Math.max(0, monthlyFoodBudget) / 30;

  const suggestions = useMemo(() => RECIPES
    .filter(recipe => recipe.mealType === 'lunch' || recipe.mealType === 'dinner')
    .map(recipe => {
      const cost = calculateRecipeScaledCost(recipe, familySize);
      const missing = getMissingIngredients(recipe, inventory, familySize);
      const availableCount = recipe.ingredients.length - missing.length;
      const coverage = recipe.ingredients.length ? availableCount / recipe.ingredients.length : 0;
      const withinBudget = cost <= dailyBudget;
      const score = coverage * 70 + (withinBudget ? 25 : 0) + (recipe.usesLeftovers ? 5 : 0) - recipe.prepTimeMinutes / 20;
      return { recipe, cost, missing, coverage, withinBudget, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4), [familySize, dailyBudget, inventory, inventoryRevision]);

  const selected = suggestions.find(item => item.recipe.id === selectedRecipeId) || suggestions[0];

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3 space-y-3" dir="rtl">
      <div>
        <span className="text-[10px] font-extrabold text-emerald-700">مساعد تدبيرة اليوم 🍲</span>
        <h3 className="mt-1 text-sm font-black text-gray-900">هناكل إيه النهارده من الموجود، ومن غير ما نبوّظ ميزانية الشهر؟</h3>
        <p className="mt-1 text-[11px] leading-5 text-gray-600">اقتراحات حسب مخزون البيت وعدد الأفراد. التكلفة تقديرية وبتتغير حسب أسعار السوق.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white border border-emerald-100 p-2">
          <span className="block text-[10px] text-gray-500">ميزانية الطعام اليومية التقريبية</span>
          <strong className="text-sm text-emerald-800">{Math.round(dailyBudget).toLocaleString('ar-EG')} ج.م</strong>
        </div>
        <div className="rounded-xl bg-white border border-emerald-100 p-2">
          <span className="block text-[10px] text-gray-500">عدد أفراد البيت</span>
          <strong className="text-sm text-gray-800">{familySize.toLocaleString('ar-EG')} أفراد</strong>
        </div>
      </div>
      <div className="space-y-2">
        {suggestions.map(({ recipe, cost, missing, coverage, withinBudget }) => (
          <button key={recipe.id} type="button" onClick={() => setSelectedRecipeId(recipe.id)} className={`w-full rounded-xl border p-2 text-right transition ${selected?.recipe.id === recipe.id ? 'border-emerald-500 bg-white shadow-sm' : 'border-gray-200 bg-white/70'}`}>
            <span className="flex items-center justify-between gap-2">
              <strong className="text-xs text-gray-900">{recipe.name}</strong>
              <span className="shrink-0 text-[10px] font-bold text-emerald-800">{cost.toLocaleString('ar-EG')} ج.م</span>
            </span>
            <span className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-500">
              <span>{recipe.prepTimeMinutes} دقيقة</span>
              <span>{Math.round(coverage * 100)}٪ من المكونات متوفرة</span>
              <span className={withinBudget ? 'text-emerald-700' : 'text-amber-700'}>{withinBudget ? 'داخل الميزانية اليومية' : 'أعلى من ميزانية اليوم'}</span>
              {missing.length === 0 && <span className="font-bold text-emerald-700">كل المكونات موجودة</span>}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-xs">اختيار النهارده: {selected.recipe.name}</strong>
            <button type="button" onClick={() => { onAddMissingToShopping(selected.missing, selected.recipe.baseServings); }} disabled={selected.missing.length === 0} className="rounded-lg bg-[#0D47A1] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40">ضيفي الناقص للقائمة</button>
          </div>
          <p className="text-[10px] text-gray-600">المكونات الناقصة: {selected.missing.length ? selected.missing.map(item => item.name).join('، ') : 'ولا حاجة — اطبخي من الموجود!'}</p>
          <p className="text-[10px] text-gray-500">التكلفة المحسوبة: {selected.cost.toLocaleString('ar-EG')} ج.م لعدد {familySize} أفراد. راجعي أسعار المكونات الفعلية قبل الشراء.</p>
          <button type="button" onClick={() => setInventoryRevision(value => value + 1)} className="text-[10px] font-bold text-emerald-700 underline">تحديث المخزون بعد المراجعة</button>
        </div>
      )}
    </section>
  );
}

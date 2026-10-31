import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES } from '../src/data/seedData';
import { INVENTORY_UNITS } from '../src/features/inventory/inventoryModels';
import { buildBudgetAwareWeeklyPlan, calculateWeeklyPlanTotalCost, consolidateWeeklyPlanIngredients, getRecipeById } from '../src/data/weeklyMealPlan';

test('budget-aware weekly plan creates seven days with valid meal types and costs', () => {
  const plan = buildBudgetAwareWeeklyPlan(5, 4200, []);
  assert.equal(plan.length, 7);
  for (const day of plan) {
    const breakfast = getRecipeById(day.breakfastRecipeId);
    const lunch = getRecipeById(day.lunchRecipeId);
    const dinner = getRecipeById(day.dinnerRecipeId);
    assert.equal(breakfast?.mealType, 'breakfast');
    assert.equal(lunch?.mealType, 'lunch');
    assert.equal(dinner?.mealType, 'dinner');
    assert.equal(new Set([day.breakfastRecipeId, day.lunchRecipeId, day.dinnerRecipeId]).size, 3);
  }
  assert.ok(calculateWeeklyPlanTotalCost(5, plan) > 0);
  const breakfastChoices = new Set(plan.map(day => day.breakfastRecipeId));
  const lunchChoices = new Set(plan.map(day => day.lunchRecipeId));
  const dinnerChoices = new Set(plan.map(day => day.dinnerRecipeId));
  assert.ok(breakfastChoices.size > 1, 'breakfast should not repeat one recipe all week');
  assert.ok(lunchChoices.size > 1, 'lunch should not repeat one recipe all week');
  assert.ok(dinnerChoices.size > 1, 'dinner should not repeat one recipe all week');
});

test('weekly plan uses stock coverage when available', () => {
  const pantry = RECIPES.flatMap(recipe => recipe.ingredients.map((ingredient, index) => ({
    id: recipe.id + '-' + index,
    name: ingredient.name,
    quantity: 100,
    unit: ingredient.unit as any,
    minimumQuantity: 0,
    updatedAt: '2026-10-30T00:00:00.000Z',
    expiresOn: null
  })));
  const plan = buildBudgetAwareWeeklyPlan(4, 10000, pantry);
  assert.equal(plan.length, 7);
  assert.ok(plan.every(day => day.breakfastRecipeId && day.lunchRecipeId && day.dinnerRecipeId));
});



test('weekly shopping consolidation never adds quantities with different units', () => {
  const ingredients = consolidateWeeklyPlanIngredients(4, [{
    dayId: 'test',
    dayName: 'اختبار',
    theme: 'اختبار الوحدات',
    breakfastRecipeId: 'rec_koshary_one_pot',
    lunchRecipeId: 'rec_leftover_chicken_pasta',
    dinnerRecipeId: 'rec_fried_pasta'
  }]);
  const pastaRows = ingredients.filter(item => item.name === 'مكرونة');
  assert.deepEqual(new Set(pastaRows.map(item => item.unit)), new Set(['كوب', 'جرام']));
  assert.equal(pastaRows.length, 2);
});

test('household inventory supports every unit used by seeded recipes', () => {
  const supportedUnits = new Set<string>(INVENTORY_UNITS);
  const unsupported = [...new Set(RECIPES.flatMap(recipe => recipe.ingredients.map(item => item.unit)))].filter(unit => !supportedUnits.has(unit));
  assert.deepEqual(unsupported, []);
});


test('meat and chicken ingredients use weight units, never cups', () => {
  const proteinLeftovers = RECIPES.flatMap(recipe => recipe.ingredients)
    .filter(ingredient => ['بواقي فراخ', 'بواقي لحمة'].includes(ingredient.name));
  assert.equal(proteinLeftovers.length, 2);
  for (const ingredient of proteinLeftovers) {
    assert.equal(ingredient.unit, 'كيلو', ingredient.name + ' must be measured by weight');
    assert.equal(ingredient.baseAmount, 0.25);
    assert.match(ingredient.quantity, /ربع كيلو/);
    assert.notEqual(ingredient.unit, 'كوب');
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES } from '../src/data/seedData';
import { INVENTORY_UNITS } from '../src/features/inventory/inventoryModels';
import { buildBudgetAwareWeeklyPlan, calculateWeeklyPlanTotalCost, getRecipeById } from '../src/data/weeklyMealPlan';

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


test('household inventory supports every unit used by seeded recipes', () => {
  const supportedUnits = new Set<string>(INVENTORY_UNITS);
  const unsupported = [...new Set(RECIPES.flatMap(recipe => recipe.ingredients.map(item => item.unit)))].filter(unit => !supportedUnits.has(unit));
  assert.deepEqual(unsupported, []);
});

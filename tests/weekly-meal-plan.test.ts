import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES } from '../src/data/seedData';
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

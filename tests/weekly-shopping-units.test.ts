import test from 'node:test';
import assert from 'node:assert/strict';
import { consolidateWeeklyPlanIngredients, convertConsolidatedToShoppingItems } from '../src/data/weeklyMealPlan';

test('weekly plan consolidates pasta cups and grams into grams, not cups', () => {
  const pasta = consolidateWeeklyPlanIngredients(4).find(item => item.name === 'مكرونة');
  assert.ok(pasta);
  assert.equal(pasta.unit, 'جرام');
  assert.ok(pasta.quantity > 0 && pasta.quantity < 5000);
  assert.ok(pasta.estimatedUnitPrice > 0 && pasta.estimatedUnitPrice < 1);
});

test('leftover chicken and meat are shown in kilograms, not cups', () => {
  const items = consolidateWeeklyPlanIngredients(4);
  const chicken = items.find(item => item.name === 'بواقي فراخ');
  const meat = items.find(item => item.name === 'بواقي لحمة');
  assert.ok(chicken);
  assert.ok(meat);
  assert.equal(chicken.unit, 'كيلو');
  assert.equal(meat.unit, 'كيلو');
  assert.ok(chicken.quantity > 0 && chicken.quantity < 2);
  assert.ok(meat.quantity > 0 && meat.quantity < 2);
  assert.equal(chicken.estimatedUnitPrice, 0);
  assert.equal(meat.estimatedUnitPrice, 0);
});

test('shopping items preserve canonical units and do not assign a fake price to leftovers', () => {
  const items = convertConsolidatedToShoppingItems(consolidateWeeklyPlanIngredients(4));
  const chicken = items.find(item => item.name === 'بواقي فراخ');
  const pasta = items.find(item => item.name === 'مكرونة');
  assert.equal(chicken?.unit, 'كيلو');
  assert.equal(chicken?.unitPrice, null);
  assert.equal(pasta?.unit, 'جرام');
});

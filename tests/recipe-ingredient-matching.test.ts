import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES } from '../src/data/seedData.ts';
import { findRecipesByIngredients, normalizeIngredient } from '../src/features/recipes/ingredientMatcher.ts';

test('normalizes common Arabic ingredient spelling variants', () => {
  assert.equal(normalizeIngredient('أرز'), normalizeIngredient('رز'));
  assert.equal(normalizeIngredient('بتنجان'), normalizeIngredient('باذنجان'));
  assert.equal(normalizeIngredient('فراخ'), normalizeIngredient('دجاج'));
});

test('offline recipe matches change with the selected ingredients', () => {
  const eggsAndTomato = findRecipesByIngredients(RECIPES, ['بيض', 'طماطم']);
  const riceAndPasta = findRecipesByIngredients(RECIPES, ['أرز', 'مكرونة']);
  assert.ok(eggsAndTomato.length > 0);
  assert.ok(riceAndPasta.length > 0);
  assert.notEqual(eggsAndTomato[0].recipe.id, riceAndPasta[0].recipe.id);
  assert.ok(eggsAndTomato[0].matchedCount >= 2);
});

test('reports ingredients that are still missing from each matched recipe', () => {
  const matches = findRecipesByIngredients(RECIPES, ['بيض']);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(match => match.missingIngredients.length === match.totalCount - match.matchedCount));
});

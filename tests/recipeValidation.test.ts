import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRecipeStructure, isRelevantRecipe } from '../src/features/recipes/recipeValidation.ts';

test('rejects unrelated encyclopedia and travel pages for a dish query', () => {
  assert.equal(isRelevantRecipe('samosa', 'Spain - Wikibooks, open books for an open world', 'Spain is a country in southwestern Europe with many mountains.'), false);
});

test('accepts a recipe result that matches the requested dish', () => {
  assert.equal(isRelevantRecipe('samosa', 'Samosa', 'Samosa ingredients include flour, potato and spices.'), true);
});

test('requires actual ingredients and substantial preparation instructions', () => {
  assert.equal(hasRecipeStructure(['flour', 'water'], 'Mix the flour and water until a smooth dough forms, then cook until golden and serve.'), true);
  assert.equal(hasRecipeStructure([], 'A long description of a dish with no ingredient list.'), false);
  assert.equal(hasRecipeStructure(['flour'], 'Mix it.'), false);
});

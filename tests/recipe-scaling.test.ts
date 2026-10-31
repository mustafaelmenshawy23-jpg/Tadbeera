import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleMeasure as scaleOnlineMeasure } from '../src/features/recipes/OnlineRecipeSearch.tsx';
import { scaleMeasure as scaleIngredientMeasure } from '../src/features/recipes/IngredientRecipeFinder.tsx';

test('online recipe quantities scale from four base servings to the selected household size', () => {
  assert.equal(scaleOnlineMeasure('2 cups', 6), '3 cups');
  assert.equal(scaleOnlineMeasure('1/2 cup', 8), '1 cup');
  assert.equal(scaleOnlineMeasure('1 tablespoon', 2), '0.5 tablespoon');
  assert.equal(scaleOnlineMeasure('1 1/2 cups', 2), '0.75 cups');
});

test('ingredient-based recipe quantities scale using the same household ratio', () => {
  assert.equal(scaleIngredientMeasure('4 eggs', 2), '2 eggs');
  assert.equal(scaleIngredientMeasure('1/2 cup', 8), '1 cup');
  assert.equal(scaleIngredientMeasure('a pinch', 6), 'a pinch');
  assert.equal(scaleIngredientMeasure('1 1/2 cups', 8), '3 cups');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackupPayload, validateBackupPayload } from '../src/data/calculationUtils.ts';

const baseData = {
  familySize: 4,
  budgetAmount: '2500',
  categories: [],
  categoryPercentages: [],
  expenses: [],
  shoppingItems: [],
  savedRecipeIds: [],
  savedTipIds: [],
  savedBudgets: [],
  selectedIngredients: [],
};

test('backup preserves enabled meal reminders and their selected time', () => {
  const payload = createBackupPayload({
    ...baseData,
    reminderEnabled: true,
    reminderTime: '06:45',
  });
  const result = validateBackupPayload(payload);
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedData?.reminderEnabled, true);
  assert.equal(result.normalizedData?.reminderTime, '06:45');
});

test('backup normalizes invalid reminder times to the safe default', () => {
  const payload = createBackupPayload({
    ...baseData,
    reminderEnabled: true,
    reminderTime: '25:90',
  });
  const result = validateBackupPayload(payload);
  assert.equal(result.normalizedData?.reminderTime, '08:00');
});

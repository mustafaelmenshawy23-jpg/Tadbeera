import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBackupPayload,
  validateBackupPayload,
  parseSafePrice,
  parseSafeQuantity,
  calculateShoppingTotals,
  type TedbeeraBackupData
} from '../src/data/calculationUtils';

const base: TedbeeraBackupData = {
  familySize: 4,
  budgetAmount: '2500',
  categories: [],
  categoryPercentages: [],
  expenses: [],
  shoppingItems: [],
  savedRecipeIds: [],
  savedTipIds: [],
  savedBudgets: [],
  selectedIngredients: []
};

test('backup round-trip preserves new household domains', () => {
  const payload = createBackupPayload({
    ...base,
    householdProfile: { name: 'الأسرة', familySize: 5 },
    inventoryItems: [{ id: 'i1', name: 'أرز' }],
    householdTasks: [{ id: 't1', title: 'تنظيف' }],
    savingsGoals: [{ id: 'g1', title: 'طوارئ' }]
  });
  const result = validateBackupPayload(payload);
  assert.equal(result.isValid, true);
  assert.deepEqual(result.normalizedData?.householdProfile, { name: 'الأسرة', familySize: 5 });
  assert.equal(result.normalizedData?.inventoryItems?.[0]?.id, 'i1');
  assert.equal(result.normalizedData?.householdTasks?.[0]?.id, 't1');
  assert.equal(result.normalizedData?.savingsGoals?.[0]?.id, 'g1');
});

test('legacy backup remains valid and defaults new domains safely', () => {
  const result = validateBackupPayload({
    app: 'Tedbeera Egypt',
    backupVersion: 1,
    data: { familySize: 3, budgetAmount: '1800', shoppingItems: [] }
  });
  assert.equal(result.isValid, true);
  assert.deepEqual(result.normalizedData?.inventoryItems, []);
  assert.deepEqual(result.normalizedData?.householdTasks, []);
  assert.deepEqual(result.normalizedData?.savingsGoals, []);
  assert.equal(result.normalizedData?.householdProfile, null);
});

test('rejects unrelated or malformed backup input', () => {
  assert.equal(validateBackupPayload(null).isValid, false);
  assert.equal(validateBackupPayload({ unrelated: true }).isValid, false);
});

test('safe numeric parsers reject invalid values and preserve Arabic quantities', () => {
  assert.equal(parseSafePrice('Infinity'), null);
  assert.equal(parseSafePrice(-2), null);
  assert.equal(parseSafeQuantity('نصف كيلو'), 0.5);
  assert.equal(parseSafeQuantity(Number.NaN), 1);
});

test('shopping totals keep unpriced items separate', () => {
  const totals = calculateShoppingTotals([
    { id: '1', name: 'لبن', quantity: 2, unit: 'علبة', unitPrice: 10, isChecked: false },
    { id: '2', name: 'خبز', quantity: 1, unit: 'رغيف', unitPrice: null, isChecked: false }
  ]);
  assert.equal(totals.knownTotal, 20);
  assert.equal(totals.pendingKnownTotal, 20);
  assert.equal(totals.unpricedCount, 1);
});


test('backup round-trip preserves a valid reminder time and rejects invalid clock values', () => {
  const payload = createBackupPayload({ ...base, reminderEnabled: true, reminderTime: '07:45' });
  const restored = validateBackupPayload(payload);
  assert.equal(restored.normalizedData?.reminderTime, '07:45');

  const invalid = validateBackupPayload({
    app: 'Tedbeera Egypt',
    backupVersion: 1,
    data: { familySize: 4, budgetAmount: '2500', reminderTime: '27:90' }
  });
  assert.equal(invalid.isValid, true);
  assert.equal(invalid.normalizedData?.reminderTime, undefined);
});

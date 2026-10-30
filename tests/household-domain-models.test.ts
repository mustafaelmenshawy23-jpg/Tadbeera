import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMonthlyFinance, isFinanceTransaction } from '../src/features/finance/financeModels';
import { getLowStockItems, getExpiringInventoryItems, isInventoryItem } from '../src/features/inventory/inventoryModels';
import { sortHouseholdTasks, isHouseholdTask } from '../src/features/household/householdTaskModels';
import { getSavingsProgress, isSavingsGoal } from '../src/features/savings/savingsModels';

test('monthly finance summary ignores other months and computes balance', () => {
  const summary = summarizeMonthlyFinance([
    { id: '1', type: 'income', amount: 10000, categoryId: 'salary', description: 'راتب', date: '2026-10-01' },
    { id: '2', type: 'expense', amount: 2500, categoryId: 'food', description: 'طعام', date: '2026-10-02' },
    { id: '3', type: 'expense', amount: 500, categoryId: 'food', description: 'قديم', date: '2026-09-30' }
  ], '2026-10');
  assert.equal(summary.income, 10000);
  assert.equal(summary.expenses, 2500);
  assert.equal(summary.balance, 7500);
  assert.equal(summary.savingsRate, 75);
});

test('inventory validators and low-stock/expiry selectors work', () => {
  const items = [
    { id: 'a', name: 'أرز', quantity: 1, unit: 'كيلو' as const, minimumQuantity: 2, updatedAt: '2026-10-01', expiresOn: null },
    { id: 'b', name: 'لبن', quantity: 4, unit: 'لتر' as const, minimumQuantity: 1, updatedAt: '2026-10-01', expiresOn: '2026-10-31' }
  ];
  assert.equal(isInventoryItem(items[0]), true);
  assert.equal(isInventoryItem({ ...items[0], quantity: Number.NaN }), false);
  assert.deepEqual(getLowStockItems(items).map(x => x.id), ['a']);
  assert.deepEqual(getExpiringInventoryItems(items, 7, new Date('2026-10-30T12:00:00Z')).map(x => x.id), ['b']);
});

test('household tasks sort pending before completed and validate shape', () => {
  const tasks = [
    { id: 'done', title: 'منتهية', notes: '', dueDate: null, completed: true, createdAt: '2026-10-01' },
    { id: 'later', title: 'لاحقًا', notes: '', dueDate: '2026-11-01', completed: false, createdAt: '2026-10-01' },
    { id: 'soon', title: 'قريب', notes: '', dueDate: '2026-10-31', completed: false, createdAt: '2026-10-01' }
  ];
  assert.equal(isHouseholdTask(tasks[0]), true);
  assert.deepEqual(sortHouseholdTasks(tasks).map(x => x.id), ['soon', 'later', 'done']);
  const undated = [
    { id: 'b', title: 'ب', notes: '', dueDate: null, completed: false, createdAt: '2026-10-02' },
    { id: 'a', title: 'أ', notes: '', dueDate: null, completed: false, createdAt: '2026-10-01' }
  ];
  assert.deepEqual(sortHouseholdTasks(undated).map(x => x.id), ['a', 'b']);
});

test('savings progress is bounded and marks completed goals', () => {
  const goal = { id: 'g1', title: 'طوارئ', targetAmount: 1000, currentAmount: 1200, targetDate: null, createdAt: '2026-10-01' };
  assert.equal(isSavingsGoal(goal), true);
  assert.deepEqual(getSavingsProgress(goal), { saved: 1000, remaining: 0, percentage: 100, isComplete: true });
  assert.equal(isFinanceTransaction({ id: 'x', type: 'expense', amount: -1, categoryId: 'x', description: '', date: '2026-10-01' }), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { filterExpensesForPayCycle, getPayCycleRange } from '../src/data/calculationUtils';

test('salary cycle includes dates from payday through the day before next payday', () => {
  const range = getPayCycleRange(25, new Date(2026, 10, 1));
  assert.equal(range.startDate, '2026-10-25');
  assert.equal(range.endDateExclusive, '2026-11-25');
  const expenses = [
    { date: '2026-10-24', amount: 100 },
    { date: '2026-10-25', amount: 200 },
    { date: '2026-11-01', amount: 300 },
    { date: '2026-11-25', amount: 400 }
  ];
  assert.deepEqual(filterExpensesForPayCycle(expenses, range), expenses.slice(1, 3));
});

test('without a configured payday, budget uses the current calendar month', () => {
  const range = getPayCycleRange(null, new Date(2026, 10, 1));
  assert.equal(range.startDate, '2026-11-01');
  assert.equal(range.endDateExclusive, '2026-12-01');
});

test('payday dates are clamped safely for short months', () => {
  const range = getPayCycleRange(31, new Date(2026, 1, 10));
  assert.equal(range.startDate, '2026-01-31');
  assert.equal(range.endDateExclusive, '2026-02-28');
});

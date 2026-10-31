import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREAKFAST_REMINDER_ID,
  LUNCH_REMINDER_ID,
  DINNER_REMINDER_ID,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  DEFAULT_LUNCH_HOUR,
  DEFAULT_DINNER_HOUR,
} from '../src/services/localNotificationService.ts';

test('meal reminder IDs are stable and unique', () => {
  const ids = [BREAKFAST_REMINDER_ID, LUNCH_REMINDER_ID, DINNER_REMINDER_ID];
  assert.deepEqual(ids, [101, 102, 103]);
  assert.equal(new Set(ids).size, 3);
});

test('default meal reminder times are breakfast, lunch, and dinner', () => {
  assert.deepEqual(
    [
      [DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE],
      [DEFAULT_LUNCH_HOUR, 0],
      [DEFAULT_DINNER_HOUR, 0],
    ],
    [[8, 0], [13, 0], [19, 0]],
  );
});


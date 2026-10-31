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
  dailyReminderSchedule,
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

test('daily reminder schedule uses a recurring local calendar time', () => {
  assert.deepEqual(dailyReminderSchedule(8, 0), {
    on: { hour: 8, minute: 0 },
    allowWhileIdle: true,
  });
  assert.deepEqual(dailyReminderSchedule(13, 0), {
    on: { hour: 13, minute: 0 },
    allowWhileIdle: true,
  });
  assert.deepEqual(dailyReminderSchedule(19, 0), {
    on: { hour: 19, minute: 0 },
    allowWhileIdle: true,
  });
});

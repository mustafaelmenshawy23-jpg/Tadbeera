import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MEAL_REMINDERS,
  MEAL_REMINDERS_STORAGE_KEY,
  getLocalNotificationService
} from '../src/services/localNotificationService';

function installStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); }
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage, Capacitor: { isPluginAvailable: () => false } }
  });
  return values;
}

test('meal reminders default to separate disabled breakfast, lunch and dinner times', () => {
  installStorage();
  const settings = getLocalNotificationService().getMealReminderSettings();
  assert.deepEqual(settings, DEFAULT_MEAL_REMINDERS);
});

test('meal reminder settings persist independently', () => {
  const values = installStorage();
  const service = getLocalNotificationService();
  const settings = {
    breakfast: { enabled: true, time: '08:15' },
    lunch: { enabled: false, time: '14:00' },
    dinner: { enabled: true, time: '20:30' }
  };
  service.saveMealReminderSettings(settings);
  assert.deepEqual(JSON.parse(values.get(MEAL_REMINDERS_STORAGE_KEY)!), settings);
  assert.deepEqual(service.getMealReminderSettings(), settings);
});

test('legacy enabled reminder migrates to breakfast without enabling other meals', () => {
  installStorage({
    tedbeera_phase4d_reminder_enabled: 'true',
    tedbeera_phase4d_reminder_time: '07:45'
  });
  const settings = getLocalNotificationService().getMealReminderSettings();
  assert.deepEqual(settings.breakfast, { enabled: true, time: '07:45' });
  assert.equal(settings.lunch.enabled, false);
  assert.equal(settings.dinner.enabled, false);
});

test('web preview does not claim that device notifications were scheduled', async () => {
  installStorage();
  const result = await getLocalNotificationService().scheduleMealReminders({
    breakfast: { enabled: true, time: '08:00' },
    lunch: { enabled: false, time: '14:00' },
    dinner: { enabled: false, time: '20:00' }
  });
  assert.equal(result.success, false);
  assert.match(result.message, /Android/);
});

test('invalid meal reminder time is rejected', async () => {
  installStorage();
  const result = await getLocalNotificationService().scheduleMealReminders({
    breakfast: { enabled: true, time: '25:00' },
    lunch: { enabled: false, time: '14:00' },
    dinner: { enabled: false, time: '20:00' }
  });
  assert.equal(result.success, false);
  assert.match(result.message, /غير صحيح/);
});

/**
 * Local, offline meal reminders for Tadbeera.
 * Each meal has a stable ID and a payload used to open the matching meal filter.
 */
export const DAILY_REMINDER_NOTIFICATION_ID = 101;
export const DAILY_REMINDER_CHANNEL_ID = 'tedbeera_daily_meal_reminders';
export const DEFAULT_REMINDER_HOUR = 11;
export const DEFAULT_REMINDER_MINUTE = 0;
export const REMINDER_STORAGE_KEY = 'tedbeera_phase4d_reminder_enabled';
export const REMINDER_TIME_KEY = 'tedbeera_phase4d_reminder_time';
export const MEAL_REMINDERS_STORAGE_KEY = 'tedbeera_meal_reminders_v1';

export type MealReminderType = 'breakfast' | 'lunch' | 'dinner';
export type NotificationPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface MealReminderConfig {
  enabled: boolean;
  time: string;
}
export type MealReminderSettings = Record<MealReminderType, MealReminderConfig>;

export const DEFAULT_MEAL_REMINDERS: MealReminderSettings = {
  breakfast: { enabled: false, time: '08:00' },
  lunch: { enabled: false, time: '14:00' },
  dinner: { enabled: false, time: '20:00' }
};

const MEALS: Record<MealReminderType, { id: number; title: string; body: string }> = {
  breakfast: { id: 201, title: 'صباح الخير 🌞', body: 'افتح تدبيرة وشوف فطار النهارده!' },
  lunch: { id: 202, title: 'وقت الغدا 🍲', body: 'شوف اقتراح وجبة النهارده من تدبيرة.' },
  dinner: { id: 203, title: 'مساء الخير 🌙', body: 'لسه محتار هتتعشى إيه؟ افتح تدبيرة.' }
};

export interface LocalReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export interface LocalNotificationService {
  isPluginAvailable(): boolean;
  checkPermission(): Promise<NotificationPermissionStatus>;
  requestPermission(): Promise<boolean>;
  scheduleDailyReminder(hour?: number, minute?: number): Promise<{ success: boolean; message: string }>;
  cancelDailyReminder(): Promise<{ success: boolean; message: string }>;
  getStoredConfig(): LocalReminderConfig;
  saveStoredConfig(config: Partial<LocalReminderConfig>): void;
  getMealReminderSettings(): MealReminderSettings;
  saveMealReminderSettings(settings: MealReminderSettings): void;
  scheduleMealReminders(settings: MealReminderSettings): Promise<{ success: boolean; message: string }>;
  cancelMealReminders(): Promise<void>;
}

const validTime = (value: string) => /^([01]\\d|2[0-3]):[0-5]\\d$/.test(value);
const cloneDefaults = (): MealReminderSettings => JSON.parse(JSON.stringify(DEFAULT_MEAL_REMINDERS));

class CapacitorLocalNotificationServiceImpl implements LocalNotificationService {
  isPluginAvailable(): boolean {
    return typeof window !== 'undefined' &&
      Boolean((window as any).Capacitor?.isPluginAvailable?.('LocalNotifications'));
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isPluginAvailable()) return 'unsupported';
    try {
      const plugin = (window as any).Capacitor?.Plugins?.LocalNotifications;
      const status = await plugin.checkPermissions();
      if (status?.display === 'granted') return 'granted';
      if (status?.display === 'denied') return 'denied';
      return 'prompt';
    } catch { return 'unsupported'; }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isPluginAvailable()) return false;
    try {
      const plugin = (window as any).Capacitor?.Plugins?.LocalNotifications;
      return (await plugin.requestPermissions())?.display === 'granted';
    } catch { return false; }
  }

  getMealReminderSettings(): MealReminderSettings {
    const defaults = cloneDefaults();
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(MEAL_REMINDERS_STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        (['breakfast', 'lunch', 'dinner'] as MealReminderType[]).forEach(meal => {
          const item = parsed?.[meal];
          if (item && typeof item.enabled === 'boolean' && validTime(item.time)) {
            defaults[meal] = { enabled: item.enabled, time: item.time };
          }
        });
        return defaults;
      }
      // Migrate the previous single reminder without silently enabling three new alerts.
      const legacy = this.getStoredConfig();
      if (legacy.enabled) defaults.breakfast = {
        enabled: true,
        time: `${String(legacy.hour).padStart(2, '0')}:${String(legacy.minute).padStart(2, '0')}`
      };
    } catch { /* use safe defaults */ }
    return defaults;
  }

  saveMealReminderSettings(settings: MealReminderSettings): void {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(MEAL_REMINDERS_STORAGE_KEY, JSON.stringify(settings));
    } catch { /* storage may be unavailable */ }
  }

  async scheduleMealReminders(settings: MealReminderSettings): Promise<{ success: boolean; message: string }> {
    const meals: MealReminderType[] = ['breakfast', 'lunch', 'dinner'];
    for (const meal of meals) {
      if (settings[meal].enabled && !validTime(settings[meal].time)) {
        return { success: false, message: 'فيه وقت غير صحيح. راجع مواعيد التنبيهات.' };
      }
    }
    if (!this.isPluginAvailable()) {
      this.saveMealReminderSettings(settings);
      return { success: false, message: 'الإشعارات المحلية متاحة في نسخة Android فقط.' };
    }

    try {
      let permission = await this.checkPermission();
      if (permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) return { success: false, message: 'إذن الإشعارات غير متاح. فعّله من إعدادات الهاتف.' };
      }
      const plugin = (window as any).Capacitor?.Plugins?.LocalNotifications;
      try {
        await plugin.createChannel({
          id: DAILY_REMINDER_CHANNEL_ID,
          name: 'وجبات تدبيرة اليومية',
          description: 'تذكيرات الفطار والغدا والعشا',
          importance: 4,
          visibility: 1
        });
      } catch { /* channel may be unsupported outside Android */ }

      await plugin.cancel({ notifications: meals.map(meal => ({ id: MEALS[meal].id })) });
      const now = new Date();
      const notifications = meals.filter(meal => settings[meal].enabled).map(meal => {
        const [hour, minute] = settings[meal].time.split(':').map(Number);
        const at = new Date();
        at.setHours(hour, minute, 0, 0);
        if (at <= now) at.setDate(at.getDate() + 1);
        return {
          id: MEALS[meal].id,
          title: MEALS[meal].title,
          body: MEALS[meal].body,
          schedule: { at, repeats: true, every: 'day' },
          channelId: DAILY_REMINDER_CHANNEL_ID,
          extra: { source: 'tedbeera_meal_reminder', mealType: meal }
        };
      });
      if (notifications.length) await plugin.schedule({ notifications });
      this.saveMealReminderSettings(settings);
      // Disable the legacy single reminder to prevent duplicate notifications.
      this.saveStoredConfig({ enabled: false });
      return { success: true, message: notifications.length ? 'تم حفظ مواعيد تنبيهات الوجبات.' : 'تم إيقاف كل تنبيهات الوجبات.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'تعذر جدولة تنبيهات الوجبات.' };
    }
  }

  async cancelMealReminders(): Promise<void> {
    if (this.isPluginAvailable()) {
      const plugin = (window as any).Capacitor?.Plugins?.LocalNotifications;
      await plugin.cancel({ notifications: [201, 202, 203].map(id => ({ id })) });
    }
  }

  // Legacy API retained for older app flows and backup compatibility.
  async scheduleDailyReminder(hour = DEFAULT_REMINDER_HOUR, minute = DEFAULT_REMINDER_MINUTE) {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
      return { success: false, message: 'وقت التذكير غير صحيح.' };
    }
    const settings = this.getMealReminderSettings();
    settings.breakfast = { enabled: true, time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
    return this.scheduleMealReminders(settings);
  }

  async cancelDailyReminder() {
    const settings = this.getMealReminderSettings();
    settings.breakfast.enabled = false;
    const result = await this.scheduleMealReminders(settings);
    return { success: result.success, message: result.message };
  }

  getStoredConfig(): LocalReminderConfig {
    let enabled = false, hour = DEFAULT_REMINDER_HOUR, minute = DEFAULT_REMINDER_MINUTE;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
        if (stored !== null) enabled = stored === 'true';
        const time = localStorage.getItem(REMINDER_TIME_KEY);
        if (time) {
          const [h, m] = time.split(':').map(Number);
          if (Number.isInteger(h) && h >= 0 && h <= 23) hour = h;
          if (Number.isInteger(m) && m >= 0 && m <= 59) minute = m;
        }
      }
    } catch { /* safe defaults */ }
    return { enabled, hour, minute, title: 'تدبيرة اليوم 💡', body: 'راجع نواقص البيت قبل نزول السوق لتجنب مصاريف إضافية!' };
  }

  saveStoredConfig(config: Partial<LocalReminderConfig>): void {
    try {
      if (typeof window !== 'undefined') {
        if (config.enabled !== undefined) localStorage.setItem(REMINDER_STORAGE_KEY, String(config.enabled));
        if (config.hour !== undefined && config.minute !== undefined) {
          localStorage.setItem(REMINDER_TIME_KEY, `${config.hour}:${String(config.minute).padStart(2, '0')}`);
        }
      }
    } catch { /* safe defaults */ }
  }
}

let notificationServiceInstance: LocalNotificationService | null = null;
export function getLocalNotificationService(): LocalNotificationService {
  if (!notificationServiceInstance) notificationServiceInstance = new CapacitorLocalNotificationServiceImpl();
  return notificationServiceInstance;
}

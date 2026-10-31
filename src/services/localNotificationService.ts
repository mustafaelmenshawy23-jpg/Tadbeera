import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Native daily meal reminders for Tadbeera.
 * Three stable IDs make scheduling idempotent and allow independent cancellation.
 */
export const DAILY_REMINDER_NOTIFICATION_ID = 101;
export const BREAKFAST_REMINDER_ID = 101;
export const LUNCH_REMINDER_ID = 102;
export const DINNER_REMINDER_ID = 103;
export const DAILY_REMINDER_CHANNEL_ID = 'tedbeera_meal_reminders';
export const DEFAULT_REMINDER_HOUR = 8;
export const DEFAULT_REMINDER_MINUTE = 0;
export const DEFAULT_LUNCH_HOUR = 13;
export const DEFAULT_DINNER_HOUR = 19;
export const REMINDER_STORAGE_KEY = 'tedbeera_phase4d_reminder_enabled';
export const REMINDER_TIME_KEY = 'tedbeera_phase4d_reminder_time';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

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
  sendTestNotification(): Promise<{ success: boolean; message: string }>;
  getStoredConfig(): LocalReminderConfig;
  saveStoredConfig(config: Partial<LocalReminderConfig>): void;
}

const MEAL_REMINDERS = [
  { id: BREAKFAST_REMINDER_ID, label: 'الفطار', title: 'صباح الخير من تدبيرة 🍳', body: 'افتح تدبيرة واختار فطار النهارده حسب الموجود في البيت.' },
  { id: LUNCH_REMINDER_ID, label: 'الغداء', title: 'حان وقت الغداء 🍲', body: 'شوف اقتراحات الغداء واحسب تكلفة الوجبة قبل ما تبدأ.' },
  { id: DINNER_REMINDER_ID, label: 'العشاء', title: 'مساء الخير من تدبيرة 🌙', body: 'جهّز عشاء بسيط وراجع نواقص البيت لبكرة.' },
] as const;

export function nextLocalOccurrence(
  hour: number,
  minute: number,
  now: Date = new Date()
): Date {
  const at = new Date(now);
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
  return at;
}

class CapacitorLocalNotificationServiceImpl implements LocalNotificationService {
  isPluginAvailable(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform() &&
      Capacitor.isPluginAvailable('LocalNotifications');
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isPluginAvailable()) return 'unsupported';
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isPluginAvailable()) return false;
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch {
      return false;
    }
  }

  async scheduleDailyReminder(
    breakfastHour: number = DEFAULT_REMINDER_HOUR,
    breakfastMinute: number = DEFAULT_REMINDER_MINUTE
  ): Promise<{ success: boolean; message: string }> {
    const times = [
      { ...MEAL_REMINDERS[0], hour: breakfastHour, minute: breakfastMinute },
      { ...MEAL_REMINDERS[1], hour: DEFAULT_LUNCH_HOUR, minute: 0 },
      { ...MEAL_REMINDERS[2], hour: DEFAULT_DINNER_HOUR, minute: 0 },
    ];
    if (times.some(t => !Number.isInteger(t.hour) || t.hour < 0 || t.hour > 23 ||
      !Number.isInteger(t.minute) || t.minute < 0 || t.minute > 59)) {
      return { success: false, message: 'وقت تذكير الفطار غير صحيح.' };
    }

    if (!this.isPluginAvailable()) {
      this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
      return { success: false, message: 'التذكيرات تحتاج تشغيل نسخة Android من تدبيرة.' };
    }

    try {
      const permission = await this.checkPermission();
      if (permission !== 'granted' && !(await this.requestPermission())) {
        this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
        return { success: false, message: 'لم يتم منح إذن الإشعارات. فعّله من إعدادات الهاتف ثم حاول مرة أخرى.' };
      }

      // Android 12+ may separately restrict exact alarms even when notifications are allowed.
      if (Capacitor.getPlatform() === 'android') {
        let exactSetting = await LocalNotifications.checkExactNotificationSetting();
        if (exactSetting.exact_alarm !== 'granted') {
          exactSetting = await LocalNotifications.changeExactNotificationSetting();
        }
        if (exactSetting.exact_alarm !== 'granted') {
          this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
          return {
            success: false,
            message: 'لضبط مواعيد الوجبات بدقة، اسمح لتدبيرة باستخدام المنبهات والتذكيرات من شاشة إعدادات Android ثم أعد التفعيل.',
          };
        }
      }

      try {
        await LocalNotifications.createChannel({
          id: DAILY_REMINDER_CHANNEL_ID,
          name: 'تذكيرات وجبات تدبيرة',
          description: 'تذكيرات الفطار والغداء والعشاء',
          importance: 4,
          visibility: 1,
        });
      } catch {
        // Channel may already exist or be unsupported on this platform.
      }

      // Remove all three previous IDs before scheduling to avoid duplicate alarms.
      await LocalNotifications.cancel({
        notifications: times.map(item => ({ id: item.id })),
      });

      await LocalNotifications.schedule({
        notifications: times.map(item => ({
          id: item.id,
          title: item.title,
          body: item.body,
          schedule: {
            at: nextLocalOccurrence(item.hour, item.minute),
            repeats: true,
            every: 'day' as const,
            allowWhileIdle: true,
          },
          channelId: DAILY_REMINDER_CHANNEL_ID,
          extra: { source: 'tadbeera_meal_reminder', meal: item.label },
        })),
      });

      this.saveStoredConfig({ enabled: true, hour: breakfastHour, minute: breakfastMinute });
      const format = (hour: number, minute: number) =>
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      return {
        success: true,
        message: `تم تفعيل 3 تذكيرات يومية: الفطار ${format(breakfastHour, breakfastMinute)}، الغداء ${format(DEFAULT_LUNCH_HOUR, 0)}، والعشاء ${format(DEFAULT_DINNER_HOUR, 0)}.`,
      };
    } catch (error) {
      this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'تعذر جدولة تذكيرات الوجبات على الجهاز.',
      };
    }
  }

  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    if (!this.isPluginAvailable()) {
      return { success: false, message: 'الإشعارات غير متاحة: افتح نسخة Android المحدّثة من تدبيرة.' };
    }
    try {
      const permission = await this.checkPermission();
      if (permission !== 'granted' && !(await this.requestPermission())) {
        return { success: false, message: 'لم تسمح بإشعارات تدبيرة. فعّل إذن الإشعارات من إعدادات الهاتف ثم أعد الاختبار.' };
      }
      await LocalNotifications.createChannel({
        id: DAILY_REMINDER_CHANNEL_ID,
        name: 'تذكيرات وجبات تدبيرة',
        description: 'تذكيرات الفطار والغداء والعشاء',
        importance: 4,
        visibility: 1,
      });
      await LocalNotifications.schedule({
        notifications: [{
          id: 104,
          title: 'تدبيرة جاهزة! 🔔',
          body: 'اختبار الإشعارات ناجح. هنفكّرك بمواعيد وجبات البيت.',
          schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
          channelId: DAILY_REMINDER_CHANNEL_ID,
          extra: { source: 'tadbeera_notification_test' },
        }],
      });
      return { success: true, message: 'تم إرسال اختبار الإشعار. انتظر 5 ثوانٍ وتأكد من ظهوره أعلى الجهاز.' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? `فشل اختبار الإشعار: ${error.message}` : 'تعذر إرسال إشعار الاختبار على الجهاز.',
      };
    }
  }

  async cancelDailyReminder(): Promise<{ success: boolean; message: string }> {
    if (!this.isPluginAvailable()) {
      this.saveStoredConfig({ enabled: false });
      return { success: true, message: 'تم تعطيل تذكيرات الوجبات.' };
    }
    try {
      await LocalNotifications.cancel({
        notifications: MEAL_REMINDERS.map(item => ({ id: item.id })),
      });
      this.saveStoredConfig({ enabled: false });
      return { success: true, message: 'تم إلغاء تذكيرات الفطار والغداء والعشاء.' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'تعذر إلغاء تذكيرات الوجبات.',
      };
    }
  }

  getStoredConfig(): LocalReminderConfig {
    let enabled = false;
    let hour = DEFAULT_REMINDER_HOUR;
    let minute = DEFAULT_REMINDER_MINUTE;
    try {
      if (typeof window !== 'undefined') {
        const storedEnabled = localStorage.getItem(REMINDER_STORAGE_KEY);
        enabled = storedEnabled === 'true';
        const storedTime = localStorage.getItem(REMINDER_TIME_KEY);
        if (storedTime) {
          const [h, m] = storedTime.split(':').map(Number);
          if (Number.isInteger(h) && h >= 0 && h <= 23) hour = h;
          if (Number.isInteger(m) && m >= 0 && m <= 59) minute = m;
        }
      }
    } catch {
      // Keep safe defaults when storage is unavailable.
    }
    return {
      enabled,
      hour,
      minute,
      title: 'تذكيرات وجبات تدبيرة',
      body: 'تذكيرات الفطار والغداء والعشاء',
    };
  }

  saveStoredConfig(config: Partial<LocalReminderConfig>): void {
    try {
      if (typeof window === 'undefined') return;
      if (config.enabled !== undefined) {
        localStorage.setItem(REMINDER_STORAGE_KEY, String(config.enabled));
      }
      if (config.hour !== undefined && config.minute !== undefined) {
        localStorage.setItem(
          REMINDER_TIME_KEY,
          `${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')}`,
        );
      }
    } catch {
      // Storage can be unavailable in private or constrained web contexts.
    }
  }
}

let notificationServiceInstance: LocalNotificationService | null = null;

export function getLocalNotificationService(): LocalNotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new CapacitorLocalNotificationServiceImpl();
  }
  return notificationServiceInstance;
}

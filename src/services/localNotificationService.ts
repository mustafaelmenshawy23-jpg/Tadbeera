import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface NotificationPermissionPlugin {
  request(): Promise<{ granted: boolean }>;
}

const NotificationPermission = registerPlugin<NotificationPermissionPlugin>('NotificationPermission');

interface MealReminderSchedulerPlugin {
  scheduleDailyReminders(options: {
    breakfastHour: number;
    breakfastMinute: number;
    lunchHour: number;
    lunchMinute: number;
    dinnerHour: number;
    dinnerMinute: number;
  }): Promise<{ success: boolean; scheduledIds: number[] }>;
  getScheduledReminders(): Promise<{ scheduledIds: number[] }>;
  cancelDailyReminders(): Promise<{ success: boolean }>;
}

const MealReminderScheduler = registerPlugin<MealReminderSchedulerPlugin>('MealReminderScheduler');

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
// Distinguish a first-time Android permission request from a permission the user already declined.
const NOTIFICATION_PERMISSION_REQUESTED_KEY = 'tedbeera_notification_permission_requested';
let exactAlarmSettingsOpenedThisSession = false;

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


class CapacitorLocalNotificationServiceImpl implements LocalNotificationService {
  isPluginAvailable(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform() &&
      Capacitor.isPluginAvailable('LocalNotifications') &&
      Capacitor.isPluginAvailable('MealReminderScheduler');
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isPluginAvailable()) return 'unsupported';
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') {
        // Some Android 13 devices report "denied" even before the app has
        // actually displayed the runtime prompt. Allow exactly one first-launch
        // request, then respect the user's decision on later launches.
        let alreadyRequested = false;
        try {
          alreadyRequested = typeof window !== 'undefined' &&
            localStorage.getItem(NOTIFICATION_PERMISSION_REQUESTED_KEY) === 'true';
        } catch {
          // If storage is unavailable, allow the native permission check to decide.
        }
        return alreadyRequested ? 'denied' : 'prompt';
      }
      return 'prompt';
    } catch (error) {
      // A transient bridge/checkPermissions failure must not suppress the first
      // Android runtime permission request. The caller will attempt the native
      // request once; requestPermission() remains the authoritative result.
      console.warn('Tadbeera notification permission check failed; attempting request:', error);
      return 'prompt';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isPluginAvailable()) return false;
    try {
      // Use the app-owned native permission bridge rather than relying on the
      // LocalNotifications plugin's permission alias on Android 13+.
      const result = await NotificationPermission.request();
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, 'true');
        }
      } catch {
        // Permission state remains authoritative if local storage is unavailable.
      }
      return result.granted;
    } catch (error) {
      console.warn('Tadbeera notification permission request failed:', error);
      return false;
    }
  }

  private async ensureExactAlarmPermission(): Promise<boolean> {
    // The manifest declaration alone does not grant exact-alarm access on Android 12+.
    const current = await LocalNotifications.checkExactNotificationSetting();
    if (current.exact_alarm === 'granted') {
      exactAlarmSettingsOpenedThisSession = false;
      return true;
    }

    // Open the Android system "Alarms & reminders" settings at most once
    // per app session. The app retries scheduling when it returns to foreground.
    if (!exactAlarmSettingsOpenedThisSession) {
      exactAlarmSettingsOpenedThisSession = true;
      await LocalNotifications.changeExactNotificationSetting();
    }

    const refreshed = await LocalNotifications.checkExactNotificationSetting();
    if (refreshed.exact_alarm === 'granted') {
      exactAlarmSettingsOpenedThisSession = false;
      return true;
    }
    return false;
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

      const notificationsEnabled = await LocalNotifications.areEnabled();
      if (!notificationsEnabled.value) {
        this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
        return {
          success: false,
          message: 'إشعارات تدبيرة مقفولة من إعدادات الهاتف. فعّل إشعارات التطبيق من إعدادات أندرويد ثم ارجع للتطبيق.',
        };
      }


      if (!(await this.ensureExactAlarmPermission())) {
        this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
        return {
          success: false,
          message: 'لازم تسمح لتدبيرة بإذن «المنبّهات والتذكيرات» من إعدادات الهاتف. افتح الصفحة التي ظهرت، فعّل الإذن، ثم ارجع للتطبيق.',
        };
      }

      await LocalNotifications.createChannel({
        id: DAILY_REMINDER_CHANNEL_ID,
        name: 'تذكيرات وجبات تدبيرة',
        description: 'تذكيرات الفطار والغداء والعشاء',
        importance: 4,
        visibility: 1,
      });
      const channelState = await LocalNotifications.listChannels();
      const mealChannel = (channelState.channels || []).find(channel => channel.id === DAILY_REMINDER_CHANNEL_ID);
      if (!mealChannel) {
        throw new Error('تعذر إنشاء قناة إشعارات تذكيرات الوجبات على الجهاز.');
      }
      if (mealChannel.importance === 0) {
        this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
        return {
          success: false,
          message: 'قناة تذكيرات تدبيرة مكتومة من إعدادات الهاتف. افتح إعدادات إشعارات التطبيق واسمح لقناة تذكيرات الوجبات.',
        };
      }

      // Use the app-owned AlarmManager receiver: it schedules each meal with
      // setExactAndAllowWhileIdle and re-arms the next local day after delivery.
      const scheduleResult = await MealReminderScheduler.scheduleDailyReminders({
        breakfastHour,
        breakfastMinute,
        lunchHour: DEFAULT_LUNCH_HOUR,
        lunchMinute: 0,
        dinnerHour: DEFAULT_DINNER_HOUR,
        dinnerMinute: 0,
      });
      const scheduledIds = new Set(scheduleResult.scheduledIds || []);
      const pending = await MealReminderScheduler.getScheduledReminders();
      const pendingIds = new Set(pending.scheduledIds || []);
      const missingMeals = times.filter(item => !scheduledIds.has(item.id) || !pendingIds.has(item.id));
      if (!scheduleResult.success || missingMeals.length) {
        await MealReminderScheduler.cancelDailyReminders();
        this.saveStoredConfig({ enabled: false, hour: breakfastHour, minute: breakfastMinute });
        return {
          success: false,
          message: missingMeals.length
            ? `تعذر تأكيد جدولة تذكير ${missingMeals.map(item => item.label).join(' و')} على أندرويد.`
            : 'تعذر على أندرويد تسجيل منبّهات الوجبات الدقيقة. راجع إعدادات الهاتف ثم حاول مرة أخرى.',
        };
      }

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
      const notificationsEnabled = await LocalNotifications.areEnabled();
      if (!notificationsEnabled.value) {
        return { success: false, message: 'إشعارات تدبيرة مقفولة من إعدادات الهاتف. فعّلها ثم أعد الاختبار.' };
      }
      await LocalNotifications.createChannel({
        id: DAILY_REMINDER_CHANNEL_ID,
        name: 'تذكيرات وجبات تدبيرة',
        description: 'تذكيرات الفطار والغداء والعشاء',
        importance: 4,
        visibility: 1,
      });
      const channelState = await LocalNotifications.listChannels();
      const mealChannel = (channelState.channels || []).find(channel => channel.id === DAILY_REMINDER_CHANNEL_ID);
      if (!mealChannel || mealChannel.importance === 0) {
        return { success: false, message: 'قناة إشعارات تدبيرة غير متاحة أو مكتومة من إعدادات الهاتف. اسمح بإشعارات قناة تذكيرات الوجبات ثم أعد الاختبار.' };
      }
      await LocalNotifications.cancel({ notifications: [{ id: 104 }] });
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
      const pending = await LocalNotifications.getPending();
      if (!(pending.notifications || []).some(item => item.id === 104)) {
        return { success: false, message: 'لم يتم تأكيد تسجيل إشعار الاختبار على الجهاز.' };
      }
      return { success: true, message: 'تم تسجيل إشعار الاختبار على الجهاز. انتظر 5 ثوانٍ وتأكد من ظهوره أعلى الجهاز.' };
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
      await MealReminderScheduler.cancelDailyReminders();
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

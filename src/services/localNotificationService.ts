/**
 * ========================================================
 * Tedbeera Egypt (تدبيرة مصر) — Phase 4D
 * Capacitor Local Notifications Service
 * ========================================================
 * Provides a safe, modular local notifications layer.
 * - Detects presence of Capacitor LocalNotifications plugin.
 * - Configures a recurring daily reminder at the user's selected local time (11:00 AM by default).
 * - Uses a stable notification ID (101) to strictly prevent duplicate schedules.
 * - Graceful fallback in web preview with non-intrusive Arabic guidance.
 */

export const DAILY_REMINDER_NOTIFICATION_ID = 101;
export const DAILY_REMINDER_CHANNEL_ID = 'tedbeera_daily_savings_reminder';
export const DEFAULT_REMINDER_HOUR = 11;
export const DEFAULT_REMINDER_MINUTE = 0;

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
  /** Detects if the native Capacitor LocalNotifications plugin is available */
  isPluginAvailable(): boolean;
  /** Checks current platform notification permission state */
  checkPermission(): Promise<NotificationPermissionStatus>;
  /** Requests notification permission from user / operating system */
  requestPermission(): Promise<boolean>;
  /** Schedules the daily reminder at the selected local time using stable ID 101 */
  scheduleDailyReminder(hour?: number, minute?: number): Promise<{ success: boolean; message: string }>;
  /** Cancels the scheduled daily reminder */
  cancelDailyReminder(): Promise<{ success: boolean; message: string }>;
  /** Reads current stored reminder preference */
  getStoredConfig(): LocalReminderConfig;
  /** Saves reminder preference to localStorage */
  saveStoredConfig(config: Partial<LocalReminderConfig>): void;
}

class CapacitorLocalNotificationServiceImpl implements LocalNotificationService {
  isPluginAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean((window as any).Capacitor?.isPluginAvailable?.('LocalNotifications'))
    );
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isPluginAvailable()) {
      return 'unsupported';
    }

    try {
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
      const status = await LocalNotifications.checkPermissions();
      if (status?.display === 'granted') return 'granted';
      if (status?.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isPluginAvailable()) {
      return false;
    }

    try {
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
      const result = await LocalNotifications.requestPermissions();
      return result?.display === 'granted';
    } catch {
      return false;
    }
  }

  async scheduleDailyReminder(
    hour: number = DEFAULT_REMINDER_HOUR,
    minute: number = DEFAULT_REMINDER_MINUTE
  ): Promise<{ success: boolean; message: string }> {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
      return {
        success: false,
        message: 'وقت التذكير غير صحيح. اختار ساعة من 0 إلى 23 ودقيقة من 0 إلى 59.'
      };
    }

    if (!this.isPluginAvailable()) {
      // Web preview cannot schedule an Android notification; do not report it as enabled.
      this.saveStoredConfig({ enabled: false, hour, minute });
      return {
        success: false,
        message: 'التذكيرات تحتاج تشغيل نسخة Android من التطبيق حتى يتمكن الجهاز من إرسال الإشعارات.'
      };
    }

    try {
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;

      // 1. Verify / Request permissions
      const perm = await this.checkPermission();
      if (perm !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          this.saveStoredConfig({ enabled: false, hour, minute });
          return {
            success: false,
            message: 'لم يتم منح إذن الإشعارات من النظام. يمكنك تفعيلها من إعدادات الهاتف.'
          };
        }
      }

      // 2. Create Android notification channel if supported
      try {
        await LocalNotifications.createChannel({
          id: DAILY_REMINDER_CHANNEL_ID,
          name: 'تدبيرة اليوم - توفير الميزانية',
          description: 'تنبيهات يومية بنواقص البيت وحيل التوفير الذكية',
          importance: 4,
          visibility: 1
        });
      } catch {
        // Channel creation may be a no-op on non-Android or older SDKs
      }

      // 3. Cancel the existing reminder first to prevent duplicate schedules
      await LocalNotifications.cancel({
        notifications: [{ id: DAILY_REMINDER_NOTIFICATION_ID }]
      });

      // 4. Calculate the next occurrence of the selected local time
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      // If the selected time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // 5. Schedule recurring daily notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: DAILY_REMINDER_NOTIFICATION_ID,
            title: 'تدبيرة اليوم 💡',
            body: 'راجع نواقص البيت قبل نزول السوق لتجنب مصاريف إضافية!',
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day'
            },
            channelId: DAILY_REMINDER_CHANNEL_ID,
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              source: 'tedbeera_egypt'
            }
          }
        ]
      });

      this.saveStoredConfig({ enabled: true, hour, minute });
      const period = hour < 12 ? 'صباحاً' : 'مساءً';
      const displayHour = hour % 12 || 12;
      const displayMinute = minute < 10 ? `0${minute}` : String(minute);
      return {
        success: true,
        message: `تم ضبط تذكير تدبيرة اليوم بنجاح في تمام الساعة ${displayHour}:${displayMinute} ${period}.`
      };
    } catch (err: any) {
      this.saveStoredConfig({ enabled: false, hour, minute });
      return {
        success: false,
        message: err?.message || 'تعذر جدولة الإشعار على الجهاز.'
      };
    }
  }

  async cancelDailyReminder(): Promise<{ success: boolean; message: string }> {
    if (!this.isPluginAvailable()) {
      this.saveStoredConfig({ enabled: false });
      return {
        success: true,
        message: 'تم تعطيل تذكير تدبيرة اليوم.'
      };
    }

    try {
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
      await LocalNotifications.cancel({
        notifications: [{ id: DAILY_REMINDER_NOTIFICATION_ID }]
      });
      this.saveStoredConfig({ enabled: false });
      return {
        success: true,
        message: 'تم إلغاء تذكير تدبيرة اليوم بنجاح.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'تعذر إلغاء الإشعار.'
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
        if (storedEnabled !== null) {
          enabled = storedEnabled === 'true';
        }
        const storedTime = localStorage.getItem(REMINDER_TIME_KEY);
        if (storedTime) {
          const [h, m] = storedTime.split(':').map(Number);
          if (!isNaN(h) && h >= 0 && h <= 23) hour = h;
          if (!isNaN(m) && m >= 0 && m <= 59) minute = m;
        }
      }
    } catch {
      // safe fallback
    }

    return {
      enabled,
      hour,
      minute,
      title: 'تدبيرة اليوم 💡',
      body: 'راجع نواقص البيت قبل نزول السوق لتجنب مصاريف إضافية!'
    };
  }

  saveStoredConfig(config: Partial<LocalReminderConfig>): void {
    try {
      if (typeof window !== 'undefined') {
        if (config.enabled !== undefined) {
          localStorage.setItem(REMINDER_STORAGE_KEY, String(config.enabled));
        }
        if (config.hour !== undefined && config.minute !== undefined) {
          const timeStr = `${config.hour}:${config.minute < 10 ? '0' + config.minute : config.minute}`;
          localStorage.setItem(REMINDER_TIME_KEY, timeStr);
        }
      }
    } catch {
      // safe fallback
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

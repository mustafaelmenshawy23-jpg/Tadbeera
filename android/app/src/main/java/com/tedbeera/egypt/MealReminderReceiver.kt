package com.tedbeera.egypt

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar

data class MealReminderTime(val id: Int, val hour: Int, val minute: Int)

class MealReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_DATE_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            ACTION_EXACT_ALARM_PERMISSION_CHANGED -> restoreAll(context)

            ACTION_FIRE -> {
                val id = intent.getIntExtra(EXTRA_ID, -1)
                val hour = intent.getIntExtra(EXTRA_HOUR, -1)
                val minute = intent.getIntExtra(EXTRA_MINUTE, -1)
                if (id !in MEAL_IDS || hour !in 0..23 || minute !in 0..59) return

                // Schedule the next local-calendar occurrence before posting this one.
                // setExactAndAllowWhileIdle is used every day, not just on first launch.
                scheduleNext(context, id, hour, minute)
                showMealNotification(context, id)
            }
        }
    }

    companion object {
        const val CHANNEL_ID = "tedbeera_meal_reminders"
        const val ACTION_FIRE = "com.tedbeera.egypt.action.MEAL_REMINDER_FIRE"
        const val ACTION_EXACT_ALARM_PERMISSION_CHANGED =
            "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED"
        const val EXTRA_ID = "meal_reminder_id"
        const val EXTRA_HOUR = "meal_reminder_hour"
        const val EXTRA_MINUTE = "meal_reminder_minute"

        private const val PREFS = "tedbeera_native_meal_reminders"
        private const val PREF_ENABLED = "enabled"
        private val MEAL_IDS = setOf(101, 102, 103)

        fun scheduleDaily(context: Context, reminders: List<MealReminderTime>): Boolean {
            if (reminders.map { it.id }.toSet() != MEAL_IDS ||
                reminders.any { it.hour !in 0..23 || it.minute !in 0..59 }) return false

            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val editor = prefs.edit().putBoolean(PREF_ENABLED, true)
            reminders.forEach {
                editor.putInt("hour_${it.id}", it.hour)
                editor.putInt("minute_${it.id}", it.minute)
            }
            editor.apply()

            val scheduled = reminders.all { scheduleNext(context, it.id, it.hour, it.minute) }
            if (!scheduled) {
                cancelAll(context)
                prefs.edit().putBoolean(PREF_ENABLED, false).apply()
            }
            return scheduled
        }

        fun cancelAll(context: Context) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            prefs.edit().putBoolean(PREF_ENABLED, false).apply()
            MEAL_IDS.forEach { id ->
                val intent = Intent(context, MealReminderReceiver::class.java).apply {
                    action = ACTION_FIRE
                    putExtra(EXTRA_ID, id)
                }
                val pending = PendingIntent.getBroadcast(
                    context, id, intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pending != null) {
                    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                    alarmManager.cancel(pending)
                    pending.cancel()
                }
            }
        }

        fun getScheduledIds(context: Context): List<Int> {
            return MEAL_IDS.filter { id ->
                val intent = Intent(context, MealReminderReceiver::class.java).apply {
                    action = ACTION_FIRE
                    putExtra(EXTRA_ID, id)
                }
                PendingIntent.getBroadcast(
                    context, id, intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                ) != null
            }.sorted()
        }

        private fun restoreAll(context: Context) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            if (!prefs.getBoolean(PREF_ENABLED, false)) return
            MEAL_IDS.forEach { id ->
                val hour = prefs.getInt("hour_$id", -1)
                val minute = prefs.getInt("minute_$id", -1)
                if (hour in 0..23 && minute in 0..59) {
                    scheduleNext(context, id, hour, minute)
                }
            }
        }

        private fun scheduleNext(context: Context, id: Int, hour: Int, minute: Int): Boolean {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                return false
            }

            val next = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
            }
            val fireIntent = Intent(context, MealReminderReceiver::class.java).apply {
                action = ACTION_FIRE
                putExtra(EXTRA_ID, id)
                putExtra(EXTRA_HOUR, hour)
                putExtra(EXTRA_MINUTE, minute)
            }
            val pending = PendingIntent.getBroadcast(
                context, id, fireIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            return try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    next.timeInMillis,
                    pending
                )
                true
            } catch (_: SecurityException) {
                false
            }
        }

        private fun ensureChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = context.getSystemService(NotificationManager::class.java)
                if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                    manager.createNotificationChannel(
                        NotificationChannel(
                            CHANNEL_ID,
                            "تذكيرات وجبات تدبيرة",
                            NotificationManager.IMPORTANCE_HIGH
                        ).apply {
                            description = "تذكيرات الفطار والغداء والعشاء"
                        }
                    )
                }
            }
        }

        private fun showMealNotification(context: Context, id: Int) {
            if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
            ensureChannel(context)
            val (title, body) = when (id) {
                101 -> "صباح الخير من تدبيرة 🍳" to "افتح تدبيرة واختار فطار النهارده حسب الموجود في البيت."
                102 -> "حان وقت الغداء 🍲" to "شوف اقتراحات الغداء واحسب تكلفة الوجبة قبل ما تبدأ."
                else -> "مساء الخير من تدبيرة 🌙" to "جهّز عشاء بسيط وراجع نواقص البيت لبكرة."
            }
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val contentIntent = launchIntent?.let {
                PendingIntent.getActivity(
                    context, id, it,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .apply { if (contentIntent != null) setContentIntent(contentIntent) }
                .build()
            try {
                NotificationManagerCompat.from(context).notify(id, notification)
            } catch (_: SecurityException) {
                // Permission may have been revoked after the alarm was scheduled.
            }
        }
    }
}

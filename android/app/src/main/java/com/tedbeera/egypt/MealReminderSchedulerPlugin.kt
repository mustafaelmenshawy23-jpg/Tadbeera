package com.tedbeera.egypt

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "MealReminderScheduler")
class MealReminderSchedulerPlugin : Plugin() {
    @PluginMethod
    fun scheduleDailyReminders(call: PluginCall) {
        val breakfastHour = call.getInt("breakfastHour") ?: 8
        val breakfastMinute = call.getInt("breakfastMinute") ?: 0
        val lunchHour = call.getInt("lunchHour") ?: 13
        val lunchMinute = call.getInt("lunchMinute") ?: 0
        val dinnerHour = call.getInt("dinnerHour") ?: 19
        val dinnerMinute = call.getInt("dinnerMinute") ?: 0

        val reminders = listOf(
            MealReminderTime(101, breakfastHour, breakfastMinute),
            MealReminderTime(102, lunchHour, lunchMinute),
            MealReminderTime(103, dinnerHour, dinnerMinute)
        )
        val success = MealReminderReceiver.scheduleDaily(context, reminders)
        val result = JSObject().put("success", success)
        val ids = JSArray()
        if (success) {
            MealReminderReceiver.getScheduledIds(context).forEach { ids.put(it) }
        }
        result.put("scheduledIds", ids)
        call.resolve(result)
    }

    @PluginMethod
    fun getScheduledReminders(call: PluginCall) {
        val ids = JSArray()
        MealReminderReceiver.getScheduledIds(context).forEach { ids.put(it) }
        call.resolve(JSObject().put("scheduledIds", ids))
    }

    @PluginMethod
    fun cancelDailyReminders(call: PluginCall) {
        MealReminderReceiver.cancelAll(context)
        call.resolve(JSObject().put("success", true))
    }
}

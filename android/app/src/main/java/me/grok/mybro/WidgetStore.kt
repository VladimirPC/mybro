package me.grok.mybro

import android.content.Context

object WidgetStore {
    const val APP_ORIGIN = "https://mybro.grok.me"
    const val PREFS = "dyshi_widget"
    const val EXTRA_PATH = "dyshi_path"
    const val EXTRA_PENDING_LOG = "dyshi_pending_log"

    data class Snapshot(
        val today: Int = 0,
        val remain: Int? = null,
        val limit: Int? = null,
        val lastAt: Long? = null,
        val resistedToday: Int = 0,
        val overLimit: Boolean = false,
    )

    fun save(context: Context, snap: Snapshot) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt("today", snap.today)
            .putInt("remain", snap.remain ?: -1)
            .putInt("limit", snap.limit ?: -1)
            .putLong("lastAt", snap.lastAt ?: 0L)
            .putInt("resistedToday", snap.resistedToday)
            .putBoolean("overLimit", snap.overLimit)
            .apply()
    }

    fun load(context: Context): Snapshot {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val remain = p.getInt("remain", -1)
        val limit = p.getInt("limit", -1)
        val lastAt = p.getLong("lastAt", 0L)
        return Snapshot(
            today = p.getInt("today", 0),
            remain = remain.takeIf { it >= 0 },
            limit = limit.takeIf { it >= 0 },
            lastAt = lastAt.takeIf { it > 0 },
            resistedToday = p.getInt("resistedToday", 0),
            overLimit = p.getBoolean("overLimit", false),
        )
    }

    fun setPendingLog(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("pendingLog", value)
            .apply()
    }

    fun consumePendingLog(context: Context): Boolean {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val value = p.getBoolean("pendingLog", false)
        if (value) p.edit().putBoolean("pendingLog", false).apply()
        return value
    }
}

package me.grok.mybro

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object DyshiWidgets {
    fun updateAll(context: Context) {
        val mgr = AppWidgetManager.getInstance(context)
        listOf(
            TodayWidget::class.java,
            RemainWidget::class.java,
            PlusWidget::class.java,
            StatsWidget::class.java,
        ).forEach { cls ->
            val ids = mgr.getAppWidgetIds(ComponentName(context, cls))
            ids.forEach { id -> bind(context, mgr, id, cls) }
        }
    }

    fun bind(context: Context, mgr: AppWidgetManager, id: Int, cls: Class<out AppWidgetProvider>) {
        val snap = WidgetStore.load(context)
        val views = when (cls) {
            RemainWidget::class.java -> numberTile(
                context,
                caption = "осталось",
                value = snap.remain?.toString() ?: if (snap.limit != null) "0" else "—",
                hint = when {
                    snap.limit != null -> "лимит ${snap.limit}"
                    else -> "лимит не задан"
                },
                danger = snap.overLimit,
                path = "/widget?v=remain",
                request = 12,
            )
            PlusWidget::class.java -> plusTile(context, snap)
            StatsWidget::class.java -> statsTile(context, snap)
            else -> numberTile(
                context,
                caption = "сегодня",
                value = snap.today.toString(),
                hint = when {
                    snap.limit != null -> "из ${snap.limit}"
                    snap.lastAt != null -> time(snap.lastAt)
                    else -> "за сегодня"
                },
                danger = snap.overLimit,
                path = "/widget?v=today",
                request = 11,
            )
        }
        mgr.updateAppWidget(id, views)
        mgr.notifyAppWidgetViewDataChanged(id, R.id.root)
    }

    private fun numberTile(
        context: Context,
        caption: String,
        value: String,
        hint: String,
        danger: Boolean,
        path: String,
        request: Int,
    ): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_number)
        views.setTextViewText(R.id.caption, caption)
        views.setTextViewText(R.id.value, value)
        views.setTextViewText(R.id.hint, hint)
        views.setTextColor(R.id.value, context.getColor(if (danger) R.color.dyshi_danger else R.color.dyshi_fg))
        views.setOnClickPendingIntent(R.id.root, openApp(context, path, request))
        return views
    }

    private fun plusTile(context: Context, snap: WidgetStore.Snapshot): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_plus)
        views.setTextViewText(R.id.caption, "Дыши")
        views.setTextViewText(R.id.hint, "сегодня ${snap.today}")
        views.setOnClickPendingIntent(R.id.root, openApp(context, "/widget?v=plus", 13))
        views.setOnClickPendingIntent(R.id.plus, logAndOpen(context, 14))
        return views
    }

    private fun statsTile(context: Context, snap: WidgetStore.Snapshot): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_stats)
        views.setTextViewText(R.id.today, snap.today.toString())
        views.setTextViewText(R.id.remain, snap.remain?.toString() ?: "—")
        views.setTextViewText(R.id.limit, snap.limit?.toString() ?: "—")
        views.setTextViewText(
            R.id.last,
            when {
                snap.lastAt != null -> "последняя ${time(snap.lastAt)}"
                else -> "ещё ни одной сегодня"
            },
        )
        views.setViewVisibility(R.id.over, if (snap.overLimit) View.VISIBLE else View.GONE)
        views.setOnClickPendingIntent(R.id.root, openApp(context, "/widget?v=wide", 15))
        return views
    }

    private fun time(at: Long): String =
        SimpleDateFormat("HH:mm", Locale("ru")).format(Date(at))

    private fun openApp(context: Context, path: String, request: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            action = "me.grok.mybro.OPEN.$request"
            putExtra(WidgetStore.EXTRA_PATH, path)
        }
        return PendingIntent.getActivity(
            context,
            request,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun logAndOpen(context: Context, request: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            action = "me.grok.mybro.LOG"
            putExtra(WidgetStore.EXTRA_PATH, "/")
            putExtra(WidgetStore.EXTRA_PENDING_LOG, true)
        }
        return PendingIntent.getActivity(
            context,
            request,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}

class TodayWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        ids.forEach { DyshiWidgets.bind(context, mgr, it, javaClass) }
    }

    override fun onEnabled(context: Context) {
        DyshiWidgets.updateAll(context)
    }
}

class RemainWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        ids.forEach { DyshiWidgets.bind(context, mgr, it, javaClass) }
    }

    override fun onEnabled(context: Context) {
        DyshiWidgets.updateAll(context)
    }
}

class PlusWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        ids.forEach { DyshiWidgets.bind(context, mgr, it, javaClass) }
    }

    override fun onEnabled(context: Context) {
        DyshiWidgets.updateAll(context)
    }
}

class StatsWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        ids.forEach { DyshiWidgets.bind(context, mgr, it, javaClass) }
    }

    override fun onEnabled(context: Context) {
        DyshiWidgets.updateAll(context)
    }
}

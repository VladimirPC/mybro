package me.grok.mybro

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "WidgetSync")
class WidgetSyncPlugin : Plugin() {
    @PluginMethod
    fun update(call: PluginCall) {
        val remain = numInt(call, "remain", -1)
        val limit = numInt(call, "limit", -1)
        val lastAt = numLong(call, "lastAt")
        WidgetStore.save(
            context,
            WidgetStore.Snapshot(
                today = numInt(call, "today", 0),
                remain = remain.takeIf { it >= 0 },
                limit = limit.takeIf { it >= 0 },
                lastAt = lastAt.takeIf { it > 0 },
                resistedToday = numInt(call, "resistedToday", 0),
                overLimit = call.getBoolean("overLimit") ?: false,
                ready = true,
            ),
        )
        call.resolve()
    }

    @PluginMethod
    fun consumePending(call: PluginCall) {
        val ret = JSObject()
        ret.put("log", WidgetStore.consumePendingLog(context))
        call.resolve(ret)
    }

    private fun numInt(call: PluginCall, key: String, fallback: Int): Int {
        call.getInt(key)?.let { return it }
        call.getDouble(key)?.let { return it.toInt() }
        return call.getString(key)?.toIntOrNull() ?: fallback
    }

    private fun numLong(call: PluginCall, key: String): Long {
        call.getDouble(key)?.let { return it.toLong() }
        call.getInt(key)?.let { return it.toLong() }
        return call.getString(key)?.toLongOrNull() ?: 0L
    }
}

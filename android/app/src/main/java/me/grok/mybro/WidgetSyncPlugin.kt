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
        val remain = call.getInt("remain")
        val limit = call.getInt("limit")
        val lastAt = call.getDouble("lastAt")?.toLong()
        WidgetStore.save(
            context,
            WidgetStore.Snapshot(
                today = call.getInt("today") ?: 0,
                remain = remain?.takeIf { it >= 0 },
                limit = limit?.takeIf { it >= 0 },
                lastAt = lastAt?.takeIf { it > 0 },
                resistedToday = call.getInt("resistedToday") ?: 0,
                overLimit = call.getBoolean("overLimit") ?: false,
            ),
        )
        DyshiWidgets.updateAll(context)
        call.resolve()
    }

    @PluginMethod
    fun consumePending(call: PluginCall) {
        val ret = JSObject()
        ret.put("log", WidgetStore.consumePendingLog(context))
        call.resolve(ret)
    }
}

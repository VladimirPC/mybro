package me.grok.mybro

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import com.getcapacitor.BridgeActivity
import org.json.JSONObject

class DyshiJsBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun update(json: String) {
        try {
            val o = JSONObject(json)
            val remain = o.optInt("remain", -1)
            val limit = o.optInt("limit", -1)
            val lastAt = o.optLong("lastAt", 0L)
            WidgetStore.save(
                activity,
                WidgetStore.Snapshot(
                    today = o.optInt("today", 0),
                    remain = remain.takeIf { it >= 0 },
                    limit = limit.takeIf { it >= 0 },
                    lastAt = lastAt.takeIf { it > 0 },
                    resistedToday = o.optInt("resistedToday", 0),
                    overLimit = o.optBoolean("overLimit", false),
                    ready = true,
                ),
            )
        } catch (_: Exception) {
            /* ignore malformed payload */
        }
    }
}

class MainActivity : BridgeActivity() {
    private val hook = Handler(Looper.getMainLooper())
    private val tick = object : Runnable {
        override fun run() {
            injectHook()
            hook.postDelayed(this, 2500)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(WidgetSyncPlugin::class.java)
        super.onCreate(savedInstanceState)
        val webView = bridge.webView
        val cookies = CookieManager.getInstance()
        cookies.setAcceptCookie(true)
        cookies.setAcceptThirdPartyCookies(webView, true)
        webView.settings.domStorageEnabled = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = true
        webView.settings.userAgentString =
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
        webView.addJavascriptInterface(DyshiJsBridge(this), "DyshiNative")
        handleIntent(intent)
        webView.post { DyshiWidgets.updateAll(this) }
        hook.postDelayed(tick, 800)
    }

    override fun onResume() {
        super.onResume()
        DyshiWidgets.updateAll(this)
        injectHook()
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onDestroy() {
        hook.removeCallbacks(tick)
        super.onDestroy()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun injectHook() {
        val webView = bridge?.webView ?: return
        webView.post {
            webView.evaluateJavascript(HOOK_JS, null)
        }
    }

    private fun handleIntent(intent: android.content.Intent?) {
        if (intent == null) return
        if (intent.getBooleanExtra(WidgetStore.EXTRA_PENDING_LOG, false)) {
            WidgetStore.setPendingLog(this, true)
        }
        val data = intent.data
        if (data != null && data.scheme == "https") {
            val url = data.toString()
            bridge?.webView?.post { bridge.webView.loadUrl(url) }
            return
        }
        val path = intent.getStringExtra(WidgetStore.EXTRA_PATH) ?: return
        val url = WidgetStore.origin(this) + path
        bridge?.webView?.post {
            bridge.webView.loadUrl(url)
        }
    }

    companion object {
        private const val HOOK_JS = """
        (function(){
          function send(o){
            if (!o) return;
            try {
              if (window.DyshiNative && window.DyshiNative.update)
                window.DyshiNative.update(JSON.stringify(o));
            } catch (e) {}
          }
          function num(v, f){
            var n = Number(v);
            return isFinite(n) ? n : f;
          }
          function fromGlobal(){
            return window.__DYSHI_WIDGET__ || null;
          }
          function fromDom(){
            var el = document.querySelector('[data-today-count]') || document.documentElement;
            var today = el.getAttribute('data-today-count') || el.getAttribute('data-dyshi-today') || document.documentElement.dataset.dyshiToday;
            if (today == null || today === '') return null;
            return {
              today: num(today, 0),
              remain: num(el.getAttribute('data-remain') || document.documentElement.dataset.dyshiRemain, -1),
              limit: num(el.getAttribute('data-limit') || document.documentElement.dataset.dyshiLimit, -1),
              lastAt: num(el.getAttribute('data-last-at') || document.documentElement.dataset.dyshiLastAt, 0),
              resistedToday: num(el.getAttribute('data-resisted') || document.documentElement.dataset.dyshiResisted, 0),
              overLimit: (el.getAttribute('data-over') || document.documentElement.dataset.dyshiOver) === '1'
            };
          }
          function fromStorage(){
            try {
              for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                var v = localStorage.getItem(k);
                if (!v || v.indexOf('"logs"') < 0) continue;
                var data = JSON.parse(v);
                var s = data.state || data;
                if (!Array.isArray(s.logs)) continue;
                var start = new Date(); start.setHours(0,0,0,0);
                var t0 = start.getTime();
                var today = 0, last = 0;
                for (var j = 0; j < s.logs.length; j++) {
                  var at = Number(s.logs[j].at) || 0;
                  if (at >= t0) { today++; if (at > last) last = at; }
                }
                return { today: today, remain: -1, limit: -1, lastAt: last, resistedToday: 0, overLimit: false };
              }
            } catch (e) {}
            return null;
          }
          send(fromGlobal() || fromDom() || fromStorage());
        })();
        """
    }
}

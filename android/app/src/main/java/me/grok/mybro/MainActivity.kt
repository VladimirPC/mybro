package me.grok.mybro

import android.content.Intent
import android.os.Bundle
import android.webkit.CookieManager
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(WidgetSyncPlugin::class.java)
        super.onCreate(savedInstanceState)
        val webView = bridge.webView
        val cookies = CookieManager.getInstance()
        cookies.setAcceptCookie(true)
        cookies.setAcceptThirdPartyCookies(webView, true)
        webView.settings.domStorageEnabled = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = true
        handleIntent(intent)
        webView.post { DyshiWidgets.updateAll(this) }
    }

    override fun onResume() {
        super.onResume()
        DyshiWidgets.updateAll(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
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
}

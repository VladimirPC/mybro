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
        webView.settings.userAgentString =
            webView.settings.userAgentString
                .replace("; wv", "")
                .replace("Version/4.0 ", "")
        handleIntent(intent)
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
        if (data != null && data.scheme == "https" && data.host == "mybro.grok.me") {
            val url = data.toString()
            bridge?.webView?.post { bridge.webView.loadUrl(url) }
            return
        }
        val path = intent.getStringExtra(WidgetStore.EXTRA_PATH) ?: return
        val url = WidgetStore.APP_ORIGIN + path
        bridge?.webView?.post {
            bridge.webView.loadUrl(url)
        }
    }
}

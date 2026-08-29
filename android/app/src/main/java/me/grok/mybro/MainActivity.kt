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
        val path = intent.getStringExtra(WidgetStore.EXTRA_PATH) ?: return
        val url = WidgetStore.APP_ORIGIN + path
        bridge?.webView?.post {
            bridge.webView.loadUrl(url)
        }
    }
}

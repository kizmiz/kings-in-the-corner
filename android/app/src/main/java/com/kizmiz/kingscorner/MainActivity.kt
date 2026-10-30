package com.kizmiz.kingscorner

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedDispatcher
import org.json.JSONObject
import java.io.ByteArrayInputStream

/**
 * The game is the web app in ../web, packed as this APK's assets and served from
 * https://kitc.local/ so its modules and Nana's weights load as they do in a browser. Nothing
 * leaves the phone: every request to that host is answered from the assets, and the page asks for
 * nothing else.
 *
 * What the page asks of the phone, through window.KitcAndroid.post(json):
 *   {type: "save", key, value}   keep a setting or the records (a JSON string)
 *   {type: "haptic", kind}       tap, place, good, bad or warn
 *   {type: "net", op, ...}        tables on the same Wi-Fi (Net.kt)
 *   {type: "awake", on}           keep the screen from locking (while at a Wi-Fi table)
 * Saved keys come back to the page on startup in window.kitc.saved, written into index.html as it
 * is served, with the phone's language (English or German) in window.kitc.lang. The system bars' sizes reach it as --sat and --sab, the page's safe areas.
 */
class MainActivity : Activity() {
    private lateinit var web: WebView
    private val prefs by lazy { getSharedPreferences("page.saved", Context.MODE_PRIVATE) }
    private val net by lazy {
        LocalNet(this) { event -> runOnUiThread { web.evaluateJavascript("window.kitcNet && window.kitcNet($event)", null) } }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setDecorFitsSystemWindows(false)

        web = WebView(this)
        web.setBackgroundColor(getColor(R.color.felt))
        web.overScrollMode = WebView.OVER_SCROLL_NEVER
        web.isVerticalScrollBarEnabled = false
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = false
        web.settings.allowContentAccess = false
        web.settings.mediaPlaybackRequiresUserGesture = true
        web.settings.textZoom = 100       // the page sizes its own text; the system font scale would break the table
        web.addJavascriptInterface(Bridge(), "KitcAndroid")
        web.webViewClient = Assets()
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        // The system bars' heights, as the page's safe areas.
        web.setOnApplyWindowInsetsListener { view, insets ->
            val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            val density = resources.displayMetrics.density
            val top = bars.top / density
            val bottom = bars.bottom / density
            view.post {
                web.evaluateJavascript(
                    "document.documentElement.style.setProperty('--sat','${top}px');" +
                        "document.documentElement.style.setProperty('--sab','${bottom}px');", null)
            }
            insets
        }
        setContentView(web)
        web.loadUrl("https://$HOST/index.html")

        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { back() }
        }
    }

    // Back closes a sheet or steps back through the game's screens, and leaves the app from home.
    private fun back() {
        web.evaluateJavascript("window.kitcBack ? window.kitcBack() : false") { result ->
            if (result != "true") finish()
        }
    }

    override fun onDestroy() {
        net.close()
        super.onDestroy()
    }

    @Deprecated("Back before Android 13")
    override fun onBackPressed() = back()

    private fun startup(): String {
        val saved = JSONObject()
        for ((key, value) in prefs.all) if (value is String) saved.put(key, value)
        val language = resources.configuration.locales[0].language
        val shell = JSONObject().put("platform", "android").put("lang", language).put("saved", saved)
            .put("version", BuildConfig.VERSION_NAME)
        return "<script>window.kitc = $shell;</script>"
    }

    private inner class Assets : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
            val url = request.url
            if (url.host != HOST) return WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null)
            val path = url.path?.trimStart('/')?.ifEmpty { "index.html" } ?: "index.html"
            if (path.contains("..")) return WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null)
            return try {
                var bytes = assets.open(path).use { it.readBytes() }
                if (path == "index.html") {
                    bytes = String(bytes).replace("</head>", "${startup()}</head>").toByteArray()
                }
                val type = TYPES[path.substringAfterLast('.')] ?: "application/octet-stream"
                WebResourceResponse(type, if (type.startsWith("text")) "utf-8" else null, 200, "OK",
                    mapOf("Access-Control-Allow-Origin" to "*"), ByteArrayInputStream(bytes))
            } catch (e: Exception) {
                WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null)
            }
        }

        // The game never navigates away; links to the web open in the browser.
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (request.url.host == HOST) return false
            if (request.url.scheme == "https") startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(request.url.toString())))
            return true
        }
    }

    private inner class Bridge {
        @JavascriptInterface
        fun post(json: String) {
            val message = try { JSONObject(json) } catch (e: Exception) { return }
            when (message.optString("type")) {
                "save" -> prefs.edit().putString(message.optString("key"), message.optString("value")).apply()
                "haptic" -> runOnUiThread { haptic(message.optString("kind")) }
                "net" -> net.handle(message)
                "awake" -> runOnUiThread {
                    if (message.optBoolean("on")) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
        }
    }

    private fun haptic(kind: String) {
        val effect = when (kind) {
            "good" -> HapticFeedbackConstants.CONFIRM
            "bad" -> HapticFeedbackConstants.REJECT
            "warn" -> HapticFeedbackConstants.LONG_PRESS
            "place" -> HapticFeedbackConstants.CONTEXT_CLICK
            else -> HapticFeedbackConstants.CLOCK_TICK
        }
        web.performHapticFeedback(effect)
    }

    companion object {
        const val HOST = "kitc.local"
        val TYPES = mapOf(
            "html" to "text/html", "js" to "text/javascript", "css" to "text/css", "json" to "application/json",
            "svg" to "image/svg+xml", "png" to "image/png", "woff2" to "font/woff2", "txt" to "text/plain",
            "bin" to "application/octet-stream",
        )
    }
}

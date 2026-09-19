package app.codeum

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.WindowManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.documentfile.provider.DocumentFile
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import kotlin.concurrent.thread

class MainActivity : Activity() {
    lateinit var web: WebView
    private lateinit var bridge: NativeBridge
    private var fileCb: ValueCallback<Array<Uri>>? = null

    companion object {
        private const val REQ_FILES = 1
        private const val REQ_FOLDER = 2
        private const val APP_URL = "https://appassets.androidplatform.net/assets/www/index.html"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        LinuxEnv.ctx = applicationContext
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) WebView.setWebContentsDebuggingEnabled(true)

        web = WebView(this)
        web.setBackgroundColor(0xFF0E1117.toInt())
        setContentView(web)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = true
            textZoom = 100
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.host == "appassets.androidplatform.net") return false
                openExternal(u.toString())
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCb?.onReceiveValue(null)
                fileCb = cb
                val i = Intent(Intent.ACTION_GET_CONTENT)
                    .addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("*/*")
                    .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                return try {
                    startActivityForResult(Intent.createChooser(i, "Открыть файл"), REQ_FILES); true
                } catch (e: ActivityNotFoundException) {
                    fileCb = null; false
                }
            }
        }
        bridge = NativeBridge(this)
        web.addJavascriptInterface(bridge, "CodeumNative")

        if (savedInstanceState != null) web.restoreState(savedInstanceState) else web.loadUrl(APP_URL)
        Widgets.updateAll(this)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    fun openExternal(url: String) {
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: Exception) {
            Toast.makeText(this, "Нет приложения для открытия ссылки", Toast.LENGTH_SHORT).show()
        }
    }

    fun pickFolder() {
        try {
            startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), REQ_FOLDER)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "Выбор папки не поддерживается", Toast.LENGTH_SHORT).show()
        }
    }

    @Deprecated("Activity API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            REQ_FILES -> {
                val uris: Array<Uri>? = if (resultCode != RESULT_OK || data == null) null else {
                    val clip = data.clipData
                    when {
                        clip != null -> Array(clip.itemCount) { clip.getItemAt(it).uri }
                        data.data != null -> arrayOf(data.data!!)
                        else -> null
                    }
                }
                fileCb?.onReceiveValue(uris)
                fileCb = null
            }
            REQ_FOLDER -> {
                val tree = data?.data
                if (resultCode == RESULT_OK && tree != null) readFolder(tree)
            }
        }
    }

    /** Читает текстовые файлы выбранной папки и отдаёт их в JS как новый проект. */
    private fun readFolder(tree: Uri) {
        thread {
            val root = DocumentFile.fromTreeUri(this, tree) ?: return@thread
            val files = JSONObject()
            var count = 0
            val skip = setOf("node_modules", ".git", "build", "target", ".gradle", "__pycache__", "bin", "obj")
            fun walk(dir: DocumentFile, prefix: String) {
                for (f in dir.listFiles()) {
                    if (count >= 400) return
                    val name = f.name ?: continue
                    if (f.isDirectory) { if (name !in skip) walk(f, "$prefix$name/"); continue }
                    if (f.length() > 2_000_000) continue
                    val bytes = try { contentResolver.openInputStream(f.uri)?.use { it.readBytes() } } catch (_: Exception) { null } ?: continue
                    if (bytes.take(8000).any { it == 0.toByte() }) continue
                    files.put(prefix + name, String(bytes, Charsets.UTF_8)); count++
                }
            }
            walk(root, "")
            bridge.emit("onFolder", root.name ?: displayName(tree) ?: "folder", files.toString())
        }
    }

    private fun displayName(uri: Uri): String? = try {
        contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
            if (it.moveToFirst()) it.getString(0) else null
        }
    } catch (_: Exception) { null }

    @Deprecated("Activity API")
    override fun onBackPressed() {
        web.evaluateJavascript("window.__native&&__native.onBack?__native.onBack():false") { r ->
            if (r != "true") finish()
        }
    }

    override fun onDestroy() {
        bridge.ptyKill()
        web.destroy()
        super.onDestroy()
    }
}

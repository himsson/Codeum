package app.codeum

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import kotlin.concurrent.thread

/**
 * Доступен в JS как window.CodeumNative. Ответы приходят обратно через window.__native.*
 */
class NativeBridge(private val act: MainActivity) {
    private val ui = Handler(Looper.getMainLooper())

    // ------------ отправка событий в JS ------------

    fun emit(fn: String, vararg args: Any?) {
        val a = args.joinToString(",") {
            when (it) {
                null -> "null"
                is String -> JSONObject.quote(it)
                is Number, is Boolean -> it.toString()
                else -> JSONObject.quote(it.toString())
            }
        }
        ui.post { act.web.evaluateJavascript("window.__native&&__native.$fn($a)", null) }
    }

    // вывод терминала копится и уходит в WebView пачками (~60 раз в секунду)
    private val ptyBuf = StringBuilder()
    private var flushQueued = false
    private fun queuePty(s: String) {
        synchronized(ptyBuf) {
            ptyBuf.append(s)
            if (!flushQueued) { flushQueued = true; ui.postDelayed({ flushPty() }, 16) }
        }
    }
    private fun flushPty() {
        val s: String
        synchronized(ptyBuf) { s = ptyBuf.toString(); ptyBuf.setLength(0); flushQueued = false }
        if (s.isNotEmpty()) emit("onPty", s)
    }

    // ------------ окружение и языки ------------

    @JavascriptInterface fun ready(): Boolean = LinuxEnv.isReady()
    @JavascriptInterface fun abi(): String = LinuxEnv.abiName()
    @JavascriptInterface fun installed(): String = JSONArray(LinuxEnv.installed().toList()).toString()
    @JavascriptInterface fun pkgMap(): String = LinuxEnv.pkgMapJson()
    @JavascriptInterface fun version(): String = act.packageManager.getPackageInfo(act.packageName, 0).versionName ?: ""

    @JavascriptInterface
    fun install(id: String) {
        thread(name = "install-$id") {
            try {
                LinuxEnv.install(id) { text, pct -> emit("onInstall", id, "progress", text, pct) }
                emit("onInstall", id, "done", "", 100)
            } catch (e: Throwable) {
                emit("onInstall", id, "error", e.message ?: e.toString(), -1)
            }
        }
    }

    @JavascriptInterface
    fun uninstall(id: String) {
        thread { try { LinuxEnv.uninstall(id) } catch (_: Throwable) { } }
    }

    // ------------ проекты ------------

    @JavascriptInterface
    fun syncProject(name: String, json: String) {
        val o = JSONObject(json)
        val m = HashMap<String, String>()
        o.keys().forEach { m[it] = o.getString(it) }
        LinuxEnv.writeProject(name, m)
    }

    @JavascriptInterface
    fun readProject(name: String): String = JSONObject(LinuxEnv.readProject(name) as Map<*, *>).toString()

    @JavascriptInterface fun projectPath(name: String): String = "/root/projects/" + LinuxEnv.safe(name)

    // ------------ терминал: настоящий PTY ------------

    @Volatile private var session: PtySession? = null

    @JavascriptInterface
    fun writeShellRc(text: String) = LinuxEnv.writeShellRc(text)

    @JavascriptInterface
    fun ptyStart(cwd: String, rows: Int, cols: Int): Boolean {
        ptyKill()
        if (!LinuxEnv.isReady()) return false
        val dir = if (cwd.startsWith("/root/projects/")) {
            LinuxEnv.projectDir(cwd.removePrefix("/root/projects/")).mkdirs(); cwd
        } else "/root"
        return try {
            val (args, env) = LinuxEnv.shellSpec(dir)
            var s: PtySession? = null
            s = PtySession(args, env, act.filesDir.path, rows.coerceAtLeast(5), cols.coerceAtLeast(20),
                onOutput = { queuePty(it) },
                onExit = { code -> ui.postDelayed({ if (session === s) { session = null; flushPty(); emit("onPtyExit", code) } }, 60) })
            session = s
            true
        } catch (e: Throwable) {
            emit("onPty", "\r\n[31m${e.message}[0m\r\n")
            false
        }
    }

    @JavascriptInterface fun ptyWrite(text: String) { session?.write(text) }
    @JavascriptInterface fun ptyResize(rows: Int, cols: Int) { session?.resize(rows, cols) }
    @JavascriptInterface fun ptyKill() { val s = session ?: return; session = null; s.kill() }

    // ------------ файлы, виджет, система ------------

    @JavascriptInterface fun pickFolder() { ui.post { act.pickFolder() } }

    @JavascriptInterface
    fun setWidgetInterval(v: String) {
        Widgets.setInterval(act, v)
        Widgets.updateAll(act)
    }

    @JavascriptInterface
    fun setLanguage(code: String) {
        Widgets.setLanguage(act, code)
        Widgets.updateAll(act)
    }

    @JavascriptInterface
    fun pinWidget(small: Boolean): Boolean {
        val mgr = AppWidgetManager.getInstance(act)
        if (!mgr.isRequestPinAppWidgetSupported) return false
        val cls = if (small) CodeWidgetSmall::class.java else CodeWidget::class.java
        return mgr.requestPinAppWidget(ComponentName(act, cls), null, null)
    }

    @JavascriptInterface
    fun setBars(color: String, light: Boolean) {
        ui.post {
            try {
                val c = Color.parseColor(color)
                act.window.statusBarColor = c
                act.window.navigationBarColor = c
                var f = act.window.decorView.systemUiVisibility
                f = if (light) f or 0x2000 or 0x10 else f and 0x2000.inv() and 0x10.inv() // LIGHT_STATUS_BAR | LIGHT_NAVIGATION_BAR
                act.window.decorView.systemUiVisibility = f
            } catch (_: Exception) { }
        }
    }

    @JavascriptInterface fun openUrl(url: String) { ui.post { act.openExternal(url) } }

    @JavascriptInterface
    fun downloadUpdate(url: String, version: String) {
        Updater.download(act, url, version) { stage, pct, msg -> emit("onUpdate", stage, pct, msg) }
    }
}

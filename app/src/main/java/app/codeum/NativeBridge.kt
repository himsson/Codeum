package app.codeum

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.InputStreamReader
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

    // вывод терминала копится и отправляется пачками, чтобы не заваливать WebView
    private val outBuf = StringBuilder()
    private val errBuf = StringBuilder()
    private var flushQueued = false
    private fun queueOut(s: String, err: Boolean) {
        synchronized(outBuf) {
            (if (err) errBuf else outBuf).append(s)
            if (!flushQueued) { flushQueued = true; ui.postDelayed({ flush() }, 40) }
        }
    }
    private fun flush() {
        val o: String; val e: String
        synchronized(outBuf) { o = outBuf.toString(); e = errBuf.toString(); outBuf.setLength(0); errBuf.setLength(0); flushQueued = false }
        if (e.isNotEmpty()) emit("onShell", e, true)
        if (o.isNotEmpty()) emit("onShell", o, false)
    }

    // ------------ окружение и языки ------------

    @JavascriptInterface fun ready(): Boolean = LinuxEnv.isReady()
    @JavascriptInterface fun abi(): String = LinuxEnv.abiName()
    @JavascriptInterface fun installed(): String = JSONArray(LinuxEnv.installed().toList()).toString()
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

    // ------------ терминал: постоянная сессия sh ------------

    private var shell: Process? = null

    @JavascriptInterface
    fun shellStart(cwd: String): Boolean {
        shellKill()
        if (!LinuxEnv.isReady()) return false
        val dir = if (cwd.startsWith("/root/projects/")) {
            LinuxEnv.projectDir(cwd.removePrefix("/root/projects/")).mkdirs(); cwd
        } else "/root"
        val p = LinuxEnv.prootCmd(dir, "/bin/sh").start()
        shell = p
        fun pump(input: java.io.InputStream, err: Boolean) = thread(isDaemon = true) {
            val r = InputStreamReader(input, Charsets.UTF_8)
            val buf = CharArray(4096)
            try {
                while (true) { val n = r.read(buf); if (n < 0) break; queueOut(String(buf, 0, n), err) }
            } catch (_: Exception) { }
        }
        pump(p.inputStream, false)
        pump(p.errorStream, true)
        thread(isDaemon = true) {
            val code = try { p.waitFor() } catch (_: Exception) { -1 }
            ui.postDelayed({ if (shell === p) { shell = null; emit("onShellExit", code) } }, 80)
        }
        return true
    }

    @JavascriptInterface
    fun shellWrite(text: String) {
        val p = shell ?: return
        thread { try { p.outputStream.write(text.toByteArray()); p.outputStream.flush() } catch (_: Exception) { } }
    }

    @JavascriptInterface
    fun shellKill() {
        val p = shell ?: return
        shell = null
        p.destroy()
    }

    // ------------ файлы, виджет, система ------------

    @JavascriptInterface fun pickFolder() { ui.post { act.pickFolder() } }

    @JavascriptInterface
    fun setWidgetInterval(v: String) {
        Widgets.setInterval(act, v)
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

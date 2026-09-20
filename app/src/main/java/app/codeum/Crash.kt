package app.codeum

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import kotlin.system.exitProcess

/**
 * Ловит падения приложения. Стек сохраняется в файл, и при следующем запуске
 * интерфейс предлагает отправить отчёт (issue на GitHub).
 */
object Crash {
    private const val FILE = "last-crash.json"
    private fun file(ctx: Context) = File(ctx.filesDir, FILE)

    fun install(ctx: Context) {
        val app = ctx.applicationContext
        val prev = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { th, e ->
            try {
                val sw = StringWriter()
                e.printStackTrace(PrintWriter(sw))
                val o = JSONObject()
                o.put("t", System.currentTimeMillis())
                o.put("where", "android")
                o.put("thread", th.name)
                o.put("msg", (e.javaClass.simpleName + ": " + (e.message ?: "")).trim())
                o.put("stack", sw.toString().take(4000))
                file(app).writeText(o.toString())
            } catch (_: Throwable) { }
            if (prev != null) prev.uncaughtException(th, e) else exitProcess(2)
        }
    }

    /** JSON последнего падения или пустая строка. */
    fun last(ctx: Context): String = try {
        val f = file(ctx)
        if (f.exists()) f.readText() else ""
    } catch (_: Throwable) { "" }

    fun clear(ctx: Context) {
        try { file(ctx).delete() } catch (_: Throwable) { }
    }
}

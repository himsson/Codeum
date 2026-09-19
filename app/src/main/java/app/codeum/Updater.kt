package app.codeum

import android.content.Intent
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Скачивает APK новой версии из GitHub Releases и открывает системный установщик.
 * Данные (ник, проекты, языки, настройки) не теряются: обновление ставится поверх,
 * с тем же applicationId и той же подписью.
 */
object Updater {
    @Volatile private var running = false

    fun download(act: MainActivity, url: String, version: String, emit: (String, Int, String) -> Unit) {
        if (running) return
        if (!url.startsWith("https://github.com/") && !url.startsWith("https://objects.githubusercontent.com/")) {
            emit("error", -1, "Неверная ссылка на обновление"); return
        }
        running = true
        thread(name = "codeum-update") {
            try {
                val dir = File(act.cacheDir, "updates").apply { mkdirs() }
                dir.listFiles()?.forEach { it.delete() }
                val apk = File(dir, "codeum-v${version.removePrefix("v").replace(Regex("[^\\w.\\-]"), "")}.apk")
                var u = url
                var conn: HttpURLConnection? = null
                for (i in 0 until 6) {
                    val c = URL(u).openConnection() as HttpURLConnection
                    c.instanceFollowRedirects = false
                    c.connectTimeout = 20000; c.readTimeout = 60000
                    c.setRequestProperty("User-Agent", "Codeum-Updater")
                    val code = c.responseCode
                    if (code in 300..399) { u = URL(URL(u), c.getHeaderField("Location")).toString(); c.disconnect(); continue }
                    if (code != 200) throw IOException("HTTP $code")
                    conn = c; break
                }
                val c = conn ?: throw IOException("слишком много перенаправлений")
                val total = c.contentLengthLong
                var done = 0L; var last = -1
                c.inputStream.use { input ->
                    FileOutputStream(apk).use { out ->
                        val buf = ByteArray(64 * 1024)
                        while (true) {
                            val n = input.read(buf); if (n < 0) break
                            out.write(buf, 0, n); done += n
                            if (total > 0) { val p = (done * 100 / total).toInt(); if (p != last) { last = p; emit("progress", p, "") } }
                        }
                    }
                }
                // проверяем, что это действительно Codeum, а не что-то другое
                val info = act.packageManager.getPackageArchiveInfo(apk.path, 0)
                if (info?.packageName != act.packageName) throw IOException("файл не является обновлением Codeum")

                val uri = FileProvider.getUriForFile(act, act.packageName + ".files", apk)
                val intent = Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                emit("install", 100, "")
                act.runOnUiThread { act.startActivity(intent) }
            } catch (e: Throwable) {
                emit("error", -1, e.message ?: e.toString())
            } finally {
                running = false
            }
        }
    }
}

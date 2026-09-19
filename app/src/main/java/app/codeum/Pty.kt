package app.codeum

import android.os.ParcelFileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.util.concurrent.Executors
import kotlin.concurrent.thread

/** Обёртка над нативным псевдотерминалом (native/pty.c). */
object Pty {
    init { System.loadLibrary("codeumpty") }

    @JvmStatic external fun start(cmd: String, args: Array<String>, env: Array<String>, cwd: String, rows: Int, cols: Int): IntArray
    @JvmStatic external fun resize(fd: Int, rows: Int, cols: Int)
    @JvmStatic external fun waitFor(pid: Int): Int
    @JvmStatic external fun kill(pid: Int, sig: Int)
    @JvmStatic external fun close(fd: Int)
}

/** Одна сессия терминала: процесс на PTY, чтение вывода и запись ввода. */
class PtySession(
    args: List<String>, env: Map<String, String>, cwd: String, rows: Int, cols: Int,
    private val onOutput: (String) -> Unit, private val onExit: (Int) -> Unit,
) {
    private val fd: Int
    private val pid: Int
    private val out: FileOutputStream
    private val writer = Executors.newSingleThreadExecutor()
    @Volatile private var closed = false

    init {
        val envArr = env.map { "${it.key}=${it.value}" }.toTypedArray()
        val res = Pty.start(args[0], args.toTypedArray(), envArr, cwd, rows, cols)
        fd = res[0]; pid = res[1]
        // dup: у чтения и записи свои дескрипторы, мастер закрывается отдельно
        val readFd = ParcelFileDescriptor.fromFd(fd)
        val writeFd = ParcelFileDescriptor.fromFd(fd)
        out = FileOutputStream(writeFd.fileDescriptor)
        thread(name = "pty-read", isDaemon = true) {
            val r = InputStreamReader(FileInputStream(readFd.fileDescriptor), Charsets.UTF_8)
            val buf = CharArray(8192)
            try {
                while (true) { val n = r.read(buf); if (n <= 0) break; onOutput(String(buf, 0, n)) }
            } catch (_: Exception) { }
            try { readFd.close() } catch (_: Exception) { }
        }
        thread(name = "pty-wait", isDaemon = true) {
            val code = Pty.waitFor(pid)
            closed = true
            try { writeFd.close() } catch (_: Exception) { }
            Pty.close(fd)
            onExit(code)
        }
    }

    fun write(s: String) {
        if (closed) return
        val bytes = s.toByteArray(Charsets.UTF_8)
        writer.execute { try { out.write(bytes); out.flush() } catch (_: Exception) { } }
    }

    fun resize(rows: Int, cols: Int) { if (!closed) Pty.resize(fd, rows, cols) }

    fun kill() {
        if (closed) return
        Pty.kill(pid, 1)   // SIGHUP — как при закрытии окна терминала
        thread(isDaemon = true) { Thread.sleep(400); if (!closed) Pty.kill(pid, 9) }
    }
}

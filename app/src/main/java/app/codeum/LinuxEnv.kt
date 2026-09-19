package app.codeum

import android.content.Context
import android.os.Build
import android.system.Os
import org.apache.commons.compress.archivers.ar.ArArchiveInputStream
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream
import org.apache.commons.compress.compressors.gzip.GzipCompressorInputStream
import org.apache.commons.compress.compressors.xz.XZCompressorInputStream
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Linux-окружение Codeum: Alpine Linux, запущенный через proot (без root-прав).
 *
 * Раскладка в filesDir:
 *   usr/     — proot и его библиотеки (из репозитория Termux)
 *   rootfs/  — Alpine minirootfs; языки ставятся туда через `apk add`
 *   tmp/     — временные файлы proot
 */
object LinuxEnv {
    private const val ALPINE = "https://dl-cdn.alpinelinux.org/alpine/latest-stable/releases"
    private val TERMUX_MIRRORS = listOf(
        "https://packages-cf.termux.dev/apt/termux-main",
        "https://packages.termux.dev/apt/termux-main",
    )

    lateinit var ctx: Context
    private val files get() = ctx.filesDir
    val usr get() = File(files, "usr")
    val rootfs get() = File(files, "rootfs")
    private val tmp get() = File(files, "tmp")
    private val fakeProc get() = File(files, "fakeproc")
    private val readyMark get() = File(files, ".linux-ready")

    fun isReady() = readyMark.exists() && File(usr, "bin/proot").exists() && File(rootfs, "bin/busybox").exists()

    private val abi get() = Build.SUPPORTED_ABIS.firstOrNull() ?: "arm64-v8a"
    private fun termuxArch() = when (abi) {
        "armeabi-v7a" -> "arm"; "x86_64" -> "x86_64"; "x86" -> "i686"; else -> "aarch64"
    }
    private fun alpineArch() = when (abi) {
        "armeabi-v7a" -> "armv7"; "x86_64" -> "x86_64"; "x86" -> "x86"; else -> "aarch64"
    }
    fun abiName() = "$abi (${alpineArch()})"

    // ---------------- установка окружения ----------------

    @Synchronized
    fun bootstrap(progress: (String, Int) -> Unit) {
        if (isReady()) return
        tmp.mkdirs()

        progress("Скачиваю proot…", 2)
        installProot()

        progress("Скачиваю Alpine Linux…", 10)
        val arch = alpineArch()
        val yaml = httpText("$ALPINE/$arch/latest-releases.yaml")
        val name = Regex("""file:\s*(alpine-minirootfs-\S+\.tar\.gz)""").find(yaml)?.groupValues?.get(1)
            ?: throw IOException("не нашёл minirootfs для $arch")
        val tgz = File(tmp, "rootfs.tar.gz")
        download("$ALPINE/$arch/$name", tgz) { p -> progress("Скачиваю Alpine Linux… $p%", 10 + p * 30 / 100) }

        progress("Распаковываю Linux…", 42)
        rootfs.deleteRecursively()
        rootfs.mkdirs()
        TarArchiveInputStream(GzipCompressorInputStream(BufferedInputStream(FileInputStream(tgz)))).use {
            extractTar(it, rootfs, "")
        }
        tgz.delete()

        File(rootfs, "etc/resolv.conf").apply { delete(); writeText("nameserver 8.8.8.8\nnameserver 1.1.1.1\n") }
        File(rootfs, "etc/hosts").apply { delete(); writeText("127.0.0.1 localhost\n::1 localhost ip6-localhost\n") }
        File(rootfs, "root/projects").mkdirs()
        File(rootfs, "tmp").mkdirs()
        File(rootfs, "etc/profile.d").mkdirs()
        File(rootfs, "etc/profile.d/codeum.sh").writeText(
            "export PS1='\\w \$ '\nexport PATH=\"\$PATH:/opt/kotlinc/bin:/root/.cargo/bin\"\n"
        )
        writeFakeProc()

        progress("Обновляю список пакетов…", 50)
        val code = run("/root", "apk update") { }
        if (code != 0) throw IOException("apk update завершился с кодом $code — проверь интернет")
        readyMark.writeText("1")
    }

    /** proot + зависимости из репозитория Termux (собраны под Android bionic). */
    private fun installProot() {
        val arch = termuxArch()
        var index: String? = null
        var base = ""
        for (m in TERMUX_MIRRORS) {
            try {
                index = httpText("$m/dists/stable/main/binary-$arch/Packages"); base = m; break
            } catch (_: Exception) {
            }
        }
        if (index == null) throw IOException("репозиторий Termux недоступен")

        val pkgs = HashMap<String, Pair<String, List<String>>>() // name -> (filename, depends)
        for (block in index.split("\n\n")) {
            var n = ""; var f = ""; var d = listOf<String>()
            for (line in block.lines()) when {
                line.startsWith("Package: ") -> n = line.substring(9).trim()
                line.startsWith("Filename: ") -> f = line.substring(10).trim()
                line.startsWith("Depends: ") -> d = line.substring(9).split(",").map {
                    it.split("|")[0].replace(Regex("""\(.*?\)"""), "").trim()
                }.filter { it.isNotEmpty() }
            }
            if (n.isNotEmpty() && f.isNotEmpty()) pkgs[n] = f to d
        }
        val todo = ArrayDeque(listOf("proot"))
        val seen = HashSet<String>()
        usr.mkdirs()
        while (todo.isNotEmpty()) {
            val n = todo.removeFirst()
            if (!seen.add(n)) continue
            val (file, deps) = pkgs[n] ?: throw IOException("в Termux нет пакета $n")
            deps.forEach { todo.add(it) }
            val deb = File(tmp, "$n.deb")
            download("$base/$file", deb) { }
            extractDeb(deb, usr)
            deb.delete()
        }
        if (!File(usr, "bin/proot").exists()) throw IOException("proot не распаковался")
    }

    /** Android не даёт читать часть /proc — подставляем безобидные заглушки, как proot-distro. */
    private fun writeFakeProc() {
        fakeProc.mkdirs()
        File(fakeProc, "loadavg").writeText("0.12 0.07 0.02 2/165 765\n")
        File(fakeProc, "uptime").writeText("7713.21 43621.35\n")
        File(fakeProc, "version").writeText("Linux version 6.1.0-codeum (codeum@phone) #1 SMP PREEMPT\n")
        File(fakeProc, "stat").writeText(
            "cpu  1957 0 2877 93280 262 342 254 87 0 0\ncpu0 31 0 226 12027 82 10 4 9 0 0\n" +
                "intr 0\nctxt 0\nbtime 0\nprocesses 0\nprocs_running 1\nprocs_blocked 0\n"
        )
        File(fakeProc, "vmstat").writeText("nr_free_pages 146031\nnr_zone_inactive_anon 0\n")
    }

    // ---------------- запуск команд ----------------

    /**
     * На x86_64 seccomp-фильтр Android запрещает syscall fork/vfork, которые использует musl.
     * Прослойка (native/forkshim.c) подменяет их на разрешённый clone. На arm64 не нужна.
     */
    private const val FORKSHIM = "/usr/lib/codeum-forkshim.so"
    private fun needsForkShim() = abi == "x86_64"
    private fun ensureForkShim() {
        if (!needsForkShim() || !rootfs.isDirectory) return
        // apk 3 по умолчанию запускает скрипты пакетов с чистым окружением — без прослойки они падают.
        // preserve-env передаёт им LD_PRELOAD.
        val apkConf = File(rootfs, "etc/apk/config")
        if (!apkConf.exists() || !apkConf.readText().contains("preserve-env")) {
            apkConf.parentFile?.mkdirs()
            apkConf.appendText("preserve-env\n")
        }
        val f = File(rootfs, FORKSHIM.removePrefix("/"))
        if (f.exists() && f.length() > 0) return
        f.parentFile?.mkdirs()
        ctx.assets.open("forkshim-x86_64.so").use { i -> FileOutputStream(f).use { i.copyTo(it) } }
        f.setReadable(true, false)
    }

    fun prootCmd(cwd: String, vararg cmd: String): ProcessBuilder {
        val (args, env) = prootSpec(cwd, false, *cmd)
        val pb = ProcessBuilder(args)
        pb.environment().putAll(env)
        return pb
    }

    /** Интерактивная оболочка для PTY: цвета, $ENV с настройками Codeum, Tab-дополнение. */
    fun shellSpec(cwd: String): Pair<List<String>, Map<String, String>> {
        val (args, env) = prootSpec(cwd, true, "/bin/sh", "-i")
        val full = HashMap(env)
        full["PATH"] = "/system/bin:/system/xbin"
        full["ANDROID_ROOT"] = "/system"
        full["ANDROID_DATA"] = "/data"
        full["HOME"] = files.path
        full["TMPDIR"] = tmp.path
        return args to full
    }

    /** Аргументы proot и окружение хоста. tty=true — для интерактивного терминала. */
    private fun prootSpec(cwd: String, tty: Boolean, vararg cmd: String): Pair<List<String>, Map<String, String>> {
        ensureForkShim()
        val args = mutableListOf(
            File(usr, "bin/proot").path,
            "--kill-on-exit", "--link2symlink", "-0",
            "-r", rootfs.path,
            "-b", "/dev", "-b", "/proc", "-b", "/sys",
            "-b", "/proc/self/fd:/dev/fd",
            "-b", "/proc/self/fd/0:/dev/stdin",
            "-b", "/proc/self/fd/1:/dev/stdout",
            "-b", "/proc/self/fd/2:/dev/stderr",
            "-b", "/dev/urandom:/dev/random",
            "-b", "${tmp.path}:/dev/shm",
        )
        for (f in listOf("loadavg", "uptime", "version", "stat", "vmstat")) {
            if (!File("/proc/$f").canRead() && File(fakeProc, f).exists()) {
                args += listOf("-b", "${File(fakeProc, f).path}:/proc/$f")
            }
        }
        args += listOf(
            "-w", cwd,
            "/usr/bin/env", "-i",
            "HOME=/root", "USER=root", "LANG=C.UTF-8", "TMPDIR=/tmp",
            "PYTHONUNBUFFERED=1", "DOTNET_CLI_TELEMETRY_OPTOUT=1", "DOTNET_NOLOGO=1",
            "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/kotlinc/bin:/root/.cargo/bin",
        )
        args += if (tty) listOf("TERM=xterm-256color", "COLORTERM=truecolor", "ENV=$SHELL_RC") else listOf("TERM=dumb")
        if (needsForkShim()) args += "LD_PRELOAD=$FORKSHIM"
        args += cmd
        val env = HashMap<String, String>()
        env["PROOT_TMP_DIR"] = tmp.path
        env["PROOT_LOADER"] = File(usr, "libexec/proot/loader").path
        File(usr, "libexec/proot/loader32").let { if (it.exists()) env["PROOT_LOADER_32"] = it.path }
        env["LD_LIBRARY_PATH"] = File(usr, "lib").path
        return args to env
    }

    const val SHELL_RC = "/etc/codeum/shrc"

    /** Настройки оболочки генерирует интерфейс: приглашение, команды выбранной ОС, help на языке пользователя. */
    fun writeShellRc(text: String) {
        val f = File(rootfs, SHELL_RC.removePrefix("/"))
        f.parentFile?.mkdirs()
        f.writeText(text)
    }

    /** Выполняет команду sh -c в Linux и построчно отдаёт вывод. Возвращает код выхода. */
    fun run(cwd: String, script: String, onLine: (String) -> Unit): Int {
        val p = prootCmd(cwd, "/bin/sh", "-c", script).redirectErrorStream(true).start()
        p.outputStream.close()
        p.inputStream.bufferedReader().forEachLine(onLine)
        return p.waitFor()
    }

    // ---------------- языки ----------------

    private class Pkg(val apk: String, val post: String = "")

    private val PKGS = mapOf(
        "py" to Pkg("python3 py3-pip"),
        "ts" to Pkg("nodejs npm", "npm install -g --no-fund --no-audit typescript tsx"),
        "c" to Pkg("build-base"),
        "cpp" to Pkg("build-base"),
        "cs" to Pkg("dotnet8-sdk"),
        "java" to Pkg("openjdk21-jdk"),
        "kt" to Pkg(
            "openjdk21-jdk unzip curl",
            "curl -fsSL -o /tmp/kotlinc.zip https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip" +
                " && rm -rf /opt/kotlinc && unzip -q /tmp/kotlinc.zip -d /opt && rm /tmp/kotlinc.zip"
        ),
        "go" to Pkg("go"),
        "rs" to Pkg("rust cargo"),
        "php" to Pkg("php83", "[ -e /usr/bin/php ] || ln -sf /usr/bin/php83 /usr/local/bin/php"),
        "rb" to Pkg("ruby"),
        "lua" to Pkg("lua5.4", "ln -sf /usr/bin/lua5.4 /usr/local/bin/lua"),
        "sh" to Pkg("bash"),
    )

    private val prefs get() = ctx.getSharedPreferences("langs", Context.MODE_PRIVATE)
    private fun setInstalled(s: Set<String>) = prefs.edit().putStringSet("installed", HashSet(s)).apply()

    /** Программы, по которым видно, что язык действительно установлен (в том числе вручную через apk). */
    private val MARKERS = mapOf(
        "py" to listOf("usr/bin/python3"),
        "ts" to listOf("usr/local/bin/tsx", "usr/bin/tsx"),
        "c" to listOf("usr/bin/gcc"),
        "cpp" to listOf("usr/bin/g++"),
        "cs" to listOf("usr/bin/dotnet", "usr/lib/dotnet/dotnet"),
        "java" to listOf("usr/bin/javac", "usr/lib/jvm/default-jvm/bin/javac"),
        "kt" to listOf("opt/kotlinc/bin/kotlinc"),
        "go" to listOf("usr/bin/go", "usr/lib/go/bin/go"),
        "rs" to listOf("usr/bin/rustc"),
        "php" to listOf("usr/bin/php83", "usr/bin/php"),
        "rb" to listOf("usr/bin/ruby"),
        "lua" to listOf("usr/bin/lua5.4"),
        "sh" to listOf("bin/bash", "usr/bin/bash"),
    )

    /** lstat, а не exists(): многие файлы в rootfs — симлинки с абсолютными путями внутри Linux. */
    private fun present(rel: String) = try { Os.lstat(File(rootfs, rel).path); true } catch (_: Exception) { false }

    fun installed(): Set<String> {
        if (!isReady()) return emptySet()
        val found = MARKERS.filter { (_, paths) -> paths.any { present(it) } }.keys
        setInstalled(found)
        return found
    }

    /** Пакеты для установки языков из терминала (pkg install / apt install / brew install…). */
    fun pkgMapJson(): String {
        val o = org.json.JSONObject()
        for ((id, p) in PKGS) o.put(id, org.json.JSONObject().put("apk", p.apk).put("post", p.post))
        return o.toString()
    }

    fun install(id: String, progress: (String, Int) -> Unit) {
        val pkg = PKGS[id] ?: throw IOException("язык $id пока недоступен в Linux-окружении")
        bootstrap { m, p -> progress(m, p / 2) }
        progress("Устанавливаю пакеты: ${pkg.apk}", 52)
        val step = Regex("""\((\d+)/(\d+)\)""")
        val tail = ArrayDeque<String>()
        run("/root", "apk add --no-progress ${pkg.apk}") { line ->
            tail.addLast(line); if (tail.size > 6) tail.removeFirst()
            val m = step.find(line)
            val pct = if (m != null) 52 + m.groupValues[1].toInt() * 46 / m.groupValues[2].toInt().coerceAtLeast(1) else -1
            progress(line, pct)
        }
        // Код возврата apk не показатель: служебные скрипты busybox/триггеры могут упасть
        // (apk запускает их с очищенным окружением), хотя сами пакеты встали. Проверяем по факту.
        val names = pkg.apk.split(" ")
        val present = ArrayList<String>()
        run("/root", "apk info -e ${pkg.apk}") { present += it.trim() }
        val missing = names.filter { it !in present }
        if (missing.isNotEmpty()) throw IOException("не установились пакеты: ${missing.joinToString(", ")}. ${tail.lastOrNull() ?: ""}")
        if (pkg.post.isNotEmpty()) {
            progress("Настройка…", 98)
            val code = run("/root", pkg.post) { progress(it, -1) }
            if (code != 0) throw IOException("настройка прервалась (код $code)")
        }
        setInstalled(installed() + id)
    }

    fun uninstall(id: String) {
        val left = prefs.getStringSet("installed", emptySet())!! - id
        setInstalled(left)
        val pkg = PKGS[id] ?: return
        // не удаляем пакеты, которые нужны другим установленным языкам (например, C и C++)
        val keep = left.mapNotNull { PKGS[it]?.apk?.split(" ") }.flatten().toSet()
        val drop = pkg.apk.split(" ").filter { it !in keep && it != "curl" && it != "unzip" }
        if (drop.isNotEmpty() && isReady()) run("/root", "apk del ${drop.joinToString(" ")}") { }
    }

    // ---------------- проекты ----------------

    fun projectDir(name: String) = File(rootfs, "root/projects/" + safe(name))
    fun safe(name: String) = name.replace(Regex("""[^\w.\-]"""), "_").ifEmpty { "project" }

    private fun safeChild(dir: File, rel: String): File? {
        if (rel.isEmpty() || rel.startsWith("/") || rel.split('/').any { it == ".." }) return null
        return File(dir, rel)
    }

    fun writeProject(name: String, files: Map<String, String>) {
        val dir = projectDir(name)
        dir.mkdirs()
        for ((rel, content) in files) {
            val f = safeChild(dir, rel) ?: continue
            f.parentFile?.mkdirs()
            if (!f.exists() || f.readText() != content) f.writeText(content)
        }
    }

    private val SKIP_DIRS = setOf("node_modules", "target", ".git", "bin", "obj", "build", "__pycache__", ".gradle", ".cargo")

    /** Текстовые файлы проекта с диска — чтобы в редакторе появлялись файлы, созданные из терминала. */
    fun readProject(name: String): Map<String, String> {
        val dir = projectDir(name)
        val out = LinkedHashMap<String, String>()
        if (!dir.isDirectory) return out
        dir.walkTopDown().onEnter { it == dir || it.name !in SKIP_DIRS }.forEach { f ->
            if (out.size >= 300 || !f.isFile || f.length() > 300_000) return@forEach
            val bytes = f.readBytes()
            if (bytes.take(8000).any { it == 0.toByte() }) return@forEach
            out[f.relativeTo(dir).invariantSeparatorsPath] = String(bytes, Charsets.UTF_8)
        }
        return out
    }

    // ---------------- сеть и архивы ----------------

    private fun open(url: String): HttpURLConnection {
        var u = url
        repeat(5) {
            val c = URL(u).openConnection() as HttpURLConnection
            c.connectTimeout = 20000; c.readTimeout = 60000
            c.setRequestProperty("User-Agent", "Codeum/0.3 (Android)")
            c.instanceFollowRedirects = true
            val code = c.responseCode
            if (code in 300..399) { u = URL(URL(u), c.getHeaderField("Location")).toString(); c.disconnect(); return@repeat }
            if (code != 200) throw IOException("HTTP $code: $u")
            return c
        }
        throw IOException("слишком много перенаправлений: $url")
    }

    private fun httpText(url: String) = open(url).let { c -> c.inputStream.use { it.readBytes().toString(Charsets.UTF_8) } }

    private fun download(url: String, dest: File, onPct: (Int) -> Unit) {
        val c = open(url)
        val total = c.contentLengthLong
        var done = 0L; var last = -1
        c.inputStream.use { input ->
            FileOutputStream(dest).use { out ->
                val buf = ByteArray(64 * 1024)
                while (true) {
                    val n = input.read(buf); if (n < 0) break
                    out.write(buf, 0, n); done += n
                    if (total > 0) { val p = (done * 100 / total).toInt(); if (p != last) { last = p; onPct(p) } }
                }
            }
        }
    }

    private const val TERMUX_PREFIX = "data/data/com.termux/files/usr/"

    private fun extractDeb(deb: File, dest: File) {
        ArArchiveInputStream(BufferedInputStream(FileInputStream(deb))).use { ar ->
            while (true) {
                val e = ar.nextArEntry ?: break
                if (!e.name.startsWith("data.tar")) continue
                val raw: InputStream = when {
                    e.name.endsWith(".xz") -> XZCompressorInputStream(ar)
                    e.name.endsWith(".gz") -> GzipCompressorInputStream(ar)
                    else -> ar
                }
                extractTar(TarArchiveInputStream(raw), dest, TERMUX_PREFIX)
                return
            }
        }
        throw IOException("в ${deb.name} нет data.tar")
    }

    private fun extractTar(tar: TarArchiveInputStream, dest: File, strip: String) {
        val hardlinks = ArrayList<Pair<File, String>>()
        val dirs = ArrayList<Pair<File, Int>>()
        while (true) {
            val e = tar.nextTarEntry ?: break
            var name = e.name.removePrefix("./").removePrefix("/")
            if (strip.isNotEmpty()) { if (!name.startsWith(strip)) continue; name = name.removePrefix(strip) }
            name = name.trimEnd('/')
            if (name.isEmpty() || name.split('/').any { it == ".." }) continue
            val out = File(dest, name)
            when {
                e.isDirectory -> { out.mkdirs(); dirs += out to (e.mode and 0x1ff) }
                e.isSymbolicLink -> {
                    out.parentFile?.mkdirs(); out.delete()
                    try { Os.symlink(e.linkName, out.path) } catch (_: Exception) { }
                }
                e.isLink -> hardlinks += out to e.linkName
                else -> {
                    out.parentFile?.mkdirs(); out.delete()
                    FileOutputStream(out).use { tar.copyTo(it) }
                    try { Os.chmod(out.path, (e.mode and 0x1ff) or 0x180) } catch (_: Exception) { }
                }
            }
        }
        for ((out, target) in hardlinks) {
            var t = target.removePrefix("./").removePrefix("/")
            if (strip.isNotEmpty()) t = t.removePrefix(strip)
            val src = File(dest, t)
            out.parentFile?.mkdirs(); out.delete()
            try { Os.link(src.path, out.path) } catch (_: Exception) {
                if (src.isFile) { src.copyTo(out, true); out.setExecutable(src.canExecute()) }
            }
        }
        for ((d, mode) in dirs) try { Os.chmod(d.path, mode or 0x1c0) } catch (_: Exception) { }
    }
}

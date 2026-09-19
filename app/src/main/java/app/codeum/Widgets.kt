package app.codeum

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar

/** Виджет «Код дня» 4×2 */
open class CodeWidget : AppWidgetProvider() {
    open val small = false
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) mgr.updateAppWidget(id, Widgets.build(ctx, small))
        Widgets.schedule(ctx)
    }
}

/** Виджет «Код дня» 2×2 */
class CodeWidgetSmall : CodeWidget() {
    override val small = true
}

/** Срабатывает, когда пора показать следующий код. */
class WidgetTick : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) = Widgets.updateAll(ctx)
}

/** После перезагрузки телефона или смены времени будильник нужно поставить заново. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) = Widgets.updateAll(ctx)
}

object Widgets {
    private class Snip(val lang: String, val code: String, val title: Map<String, String>, val expl: Map<String, String>)
    private class Lang(val name: String, val color: Int, val mono: String, val com: String, val kw: List<String>)

    // цвета темы Midnight — как в приложении
    private val C_KW = Color.parseColor("#C792EA")
    private val C_STR = Color.parseColor("#B5E08D")
    private val C_NUM = Color.parseColor("#FF9E64")
    private val C_COM = Color.parseColor("#5C6680")
    private val C_FN = Color.parseColor("#7AA2F7")
    private val C_TY = Color.parseColor("#FFCB6B")

    private var snips: List<Snip>? = null
    private var langs: Map<String, Lang> = emptyMap()
    private var labels: Map<String, String> = emptyMap()

    private fun strMap(o: JSONObject): Map<String, String> = o.keys().asSequence().associateWith { o.getString(it) }

    private fun load(ctx: Context) {
        if (snips != null) return
        val o = JSONObject(ctx.assets.open("snippets.json").bufferedReader().use { it.readText() })
        val lo = o.getJSONObject("langs")
        langs = lo.keys().asSequence().associateWith { k ->
            val l = lo.getJSONObject(k)
            val kw = l.getJSONArray("kw")
            Lang(l.getString("name"), Color.parseColor(l.getString("c")), l.getString("m"), l.getString("com"),
                List(kw.length()) { kw.getString(it) })
        }
        labels = strMap(o.getJSONObject("labels"))
        val arr = o.getJSONArray("snippets")
        snips = List(arr.length()) {
            val s = arr.getJSONObject(it)
            Snip(s.getString("l"), s.getString("c"), strMap(s.getJSONObject("t")), strMap(s.getJSONObject("x")))
        }
    }

    // ------------ интервал смены: «day» или «5h» (та же формула, что в приложении) ------------

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("widget", Context.MODE_PRIVATE)
    fun setInterval(ctx: Context, v: String) = prefs(ctx).edit().putString("int", if (v == "5h") "5h" else "day").apply()
    fun setLanguage(ctx: Context, code: String) = prefs(ctx).edit().putString("lang", code).apply()
    private fun lang(ctx: Context) = prefs(ctx).getString("lang", null) ?: java.util.Locale.getDefault().language
    private fun Map<String, String>.forLang(code: String) = this[code] ?: this["en"] ?: values.firstOrNull() ?: ""

    /** Номер текущего «окна» и время начала следующего. */
    private fun bucket(ctx: Context): Pair<Long, Long> {
        val now = System.currentTimeMillis()
        return if (prefs(ctx).getString("int", "day") == "5h") {
            val len = 5 * 3_600_000L
            val b = Math.floorDiv(now, len)
            b to (b + 1) * len
        } else {
            val c = Calendar.getInstance().apply {
                timeInMillis = now; set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            }
            val midnight = c.timeInMillis
            c.add(Calendar.DAY_OF_YEAR, 1)
            Math.floorDiv(midnight, 86_400_000L) to c.timeInMillis
        }
    }

    private fun current(ctx: Context): Snip {
        load(ctx)
        val list = snips!!
        val b = bucket(ctx).first
        val idx = ((b * 2654435761L) and 0xFFFFFFFFL) % list.size
        return list[idx.toInt()]
    }

    // ------------ отрисовка ------------

    fun build(ctx: Context, small: Boolean): RemoteViews {
        val s = current(ctx)
        val l = langs[s.lang]
        val code = lang(ctx)
        val v = RemoteViews(ctx.packageName, if (small) R.layout.widget_code_small else R.layout.widget_code)
        v.setTextViewText(R.id.w_k, labels.forLang(code).uppercase(java.util.Locale(code)))
        v.setTextViewText(R.id.w_title, s.title.forLang(code))
        v.setTextViewText(R.id.w_lang, l?.name ?: s.lang)
        v.setTextViewText(R.id.w_tile_m, l?.mono ?: "")
        if (l != null) {
            v.setInt(R.id.w_tile, "setColorFilter", l.color)
            v.setTextColor(R.id.w_tile_m, if (luma(l.color) > 150) Color.parseColor("#16181D") else Color.WHITE)
        }
        if (!small) {
            v.setTextViewText(R.id.w_code, highlight(s.code, l))
            v.setTextViewText(R.id.w_expl, s.expl.forLang(code))
        }
        val open = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        v.setOnClickPendingIntent(R.id.w_root, open)
        return v
    }

    private fun luma(c: Int) = (Color.red(c) * 299 + Color.green(c) * 587 + Color.blue(c) * 114) / 1000

    private fun highlight(src: String, l: Lang?): CharSequence {
        if (l == null) return src
        val com = when (l.com) { "#" -> "#.*"; "--" -> "--.*"; else -> """//.*|/\*[\s\S]*?\*/""" }
        val str = """"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'"""
        val kw = l.kw.joinToString("|") { Regex.escape(it) }
        val re = Regex("""($com)|($str)|\b($kw)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)(?=\s*[(!])|\b([A-Z][A-Za-z0-9_]*)\b""")
        val sb = SpannableStringBuilder(src)
        for (m in re.findAll(src)) {
            val color = when {
                m.groups[1] != null -> C_COM
                m.groups[2] != null -> C_STR
                m.groups[3] != null -> C_KW
                m.groups[4] != null -> C_NUM
                m.groups[5] != null -> C_FN
                else -> C_TY
            }
            sb.setSpan(ForegroundColorSpan(color), m.range.first, m.range.last + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        return sb
    }

    // ------------ обновление и расписание ------------

    fun updateAll(ctx: Context) {
        val mgr = AppWidgetManager.getInstance(ctx)
        var any = false
        for ((cls, small) in listOf(CodeWidget::class.java to false, CodeWidgetSmall::class.java to true)) {
            val ids = mgr.getAppWidgetIds(ComponentName(ctx, cls))
            for (id in ids) { mgr.updateAppWidget(id, build(ctx, small)); any = true }
        }
        if (any) schedule(ctx)
    }

    fun schedule(ctx: Context) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = PendingIntent.getBroadcast(
            ctx, 0, Intent(ctx, WidgetTick::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        // неточный будильник: без спецразрешений и бережёт батарею; сработает в течение пары минут после смены
        am.set(AlarmManager.RTC, bucket(ctx).second + 5_000, pi)
    }
}

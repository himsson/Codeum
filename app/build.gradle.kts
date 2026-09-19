import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Версия берётся из gradle.properties (codeumVersion=1.2.3).
// versionCode растёт автоматически: 1.2.3 -> 10203, поэтому обновления ставятся поверх.
val codeumVersion = (project.findProperty("codeumVersion") as String?) ?: "1.0.0"
val codeumVersionCode = (codeumVersion.removePrefix("v").split(".").map { it.toIntOrNull() ?: 0 } + listOf(0, 0, 0))
    .let { (a, b, c) -> a * 10000 + b * 100 + c }

// Постоянный ключ подписи. Одна и та же подпись = обновление без потери данных.
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore/keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "app.codeum"
    compileSdk = 35
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "app.codeum"
        minSdk = 26
        // targetSdk 28 — осознанно, как у Termux: начиная с targetSdk 29 Android запрещает
        // запускать скачанные бинарники (компиляторы) из папки приложения.
        // Из-за этого APK распространяется напрямую / через GitHub Releases, а не через Google Play.
        @Suppress("ExpiredTargetSdkVersion")
        targetSdk = 28
        versionCode = codeumVersionCode
        versionName = codeumVersion
    }

    signingConfigs {
        create("codeum") {
            if (keystoreProps.isNotEmpty()) {
                storeFile = rootProject.file("app/" + keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        val sign = if (keystoreProps.isNotEmpty()) signingConfigs.getByName("codeum") else signingConfigs.getByName("debug")
        release {
            isMinifyEnabled = false
            signingConfig = sign
        }
        debug {
            // тот же ключ, что и у релиза: debug-сборку можно ставить поверх релизной и наоборот
            signingConfig = sign
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
        disable += setOf("ExpiredTargetSdkVersion", "OldTargetApi")
    }
    packaging {
        resources {
            excludes += setOf("META-INF/DEPENDENCIES", "META-INF/LICENSE*", "META-INF/NOTICE*", "META-INF/*.kotlin_module")
        }
    }
    // APK называется codeum-v1.0.0.apk (debug: codeum-v1.0.0-debug.apk)
    applicationVariants.all {
        val variant = this
        outputs.all {
            (this as com.android.build.gradle.internal.api.BaseVariantOutputImpl).outputFileName =
                "codeum-v${variant.versionName}" + (if (variant.buildType.name == "release") "" else "-${variant.buildType.name}") + ".apk"
        }
    }
}

dependencies {
    implementation("androidx.core:core:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.documentfile:documentfile:1.0.1")
    // 1.20 — последняя версия без java.nio.file.FileTime в tar-классах (совместимость с Android)
    implementation("org.apache.commons:commons-compress:1.20")
    implementation("org.tukaani:xz:1.9")
}

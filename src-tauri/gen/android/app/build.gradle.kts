import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

fun signingInput(name: String): String? =
    providers.gradleProperty(name).orNull ?: System.getenv(name)

val androidReleaseSigningInputs = mapOf(
    "STARLIGHT_ANDROID_KEYSTORE_PATH" to signingInput("STARLIGHT_ANDROID_KEYSTORE_PATH"),
    "STARLIGHT_ANDROID_KEYSTORE_PASSWORD" to signingInput("STARLIGHT_ANDROID_KEYSTORE_PASSWORD"),
    "STARLIGHT_ANDROID_KEY_ALIAS" to signingInput("STARLIGHT_ANDROID_KEY_ALIAS"),
    "STARLIGHT_ANDROID_KEY_PASSWORD" to signingInput("STARLIGHT_ANDROID_KEY_PASSWORD"),
)

val missingAndroidReleaseSigningInputs = androidReleaseSigningInputs
    .filterValues { it.isNullOrBlank() }
    .keys

android {
    compileSdk = 34
    namespace = "com.starlight_app.app"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "com.starlight_app.app"
        minSdk = 24
        targetSdk = 34
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }
    signingConfigs {
        if (missingAndroidReleaseSigningInputs.isEmpty()) {
            create("release") {
                storeFile = file(requireNotNull(androidReleaseSigningInputs["STARLIGHT_ANDROID_KEYSTORE_PATH"]))
                storePassword = requireNotNull(androidReleaseSigningInputs["STARLIGHT_ANDROID_KEYSTORE_PASSWORD"])
                keyAlias = requireNotNull(androidReleaseSigningInputs["STARLIGHT_ANDROID_KEY_ALIAS"])
                keyPassword = requireNotNull(androidReleaseSigningInputs["STARLIGHT_ANDROID_KEY_PASSWORD"])
            }
        }
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            if (missingAndroidReleaseSigningInputs.isEmpty()) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = true
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

tasks.configureEach {
    if (name.contains("Release", ignoreCase = true)) {
        doFirst {
            if (missingAndroidReleaseSigningInputs.isNotEmpty()) {
                throw GradleException(
                    "Signed Android release requires ${missingAndroidReleaseSigningInputs.joinToString()}. " +
                        "Provide protected environment variables or Gradle properties; see docs/RELEASE_GUIDE.md."
                )
            }
        }
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.6.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.8.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")

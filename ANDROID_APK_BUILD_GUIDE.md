# AstraVital AI — Android APK & PWA Installation Guide
**NASA Space Apps Challenge 2026 • Team Zero**

This guide provides 4 ways to install and run **AstraVital AI** on mobile devices (Android & iOS):

---

## 🚀 Method 1: Instant PWA Direct Install (No APK Needed)

AstraVital AI is a fully compliant Progressive Web App (PWA) with offline capabilities.

1. Open your browser on Android (Chrome, Edge, Samsung Internet, Brave) or iOS (Safari).
2. Navigate to: **[https://astravital-ai.vercel.app](https://astravital-ai.vercel.app)**
3. **Android:**
   - Tap the **`📲 INSTALL APP`** button in the top navigation bar or the slide-over **`☰ MODULES`** drawer footer.
   - Alternatively, tap browser menu `(⋮)` → Select **"Install app"** or **"Add to Home screen"**.
4. **iOS (iPhone/iPad):**
   - Tap the **Share** button (`⎙` / `[↑]`) at the bottom of Safari.
   - Scroll down and tap **"Add to Home Screen"**.
5. The AstraVital AI icon will now appear on your phone's home screen and app drawer, launching in full-screen standalone mode with offline telemetry caching.

---

## 🤖 Method 2: Automatic Cloud APK Build (GitHub Actions)

We have configured an automated CI/CD pipeline in `.github/workflows/build-apk.yml`. Every commit builds a fresh Android debug APK using JDK 17 and Android SDK.

### How to Download the APK:
1. Go to your GitHub repository: `https://github.com/AvengerNabil/astravital-ai`
2. Click on the **Actions** tab at the top.
3. Click on the latest workflow run: **"Build AstraVital Android APK"**.
4. Scroll down to the **Artifacts** section at the bottom.
5. Click **`AstraVital-AI-Android-APK`** to download the compiled `.apk` file directly.
6. Transfer or download the APK to your Android phone, tap to install (enable "Install unknown apps" if prompted), and launch!

---

## 🛠️ Method 3: Local Android Studio Build (Capacitor)

The repository includes a pre-configured native Android project (`/android`) generated via `@capacitor/android`.

### Prerequisites:
- [Android Studio (Hedgehog / Iguana / Jellyfish or later)](https://developer.android.com/studio)
- JDK 17+ installed

### Steps:
```bash
# 1. Sync latest web assets into Android project
npx cap sync android

# 2. Open Android project in Android Studio
npx cap open android
```
- In Android Studio:
  - Wait for Gradle sync to complete.
  - Connect your physical Android phone (with USB Debugging enabled) or choose an Android Emulator.
  - Click the green **Run (▶)** button to install and test on device.
  - To generate a release APK: Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
  - The APK will be saved at: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🌐 Method 4: 1-Click APK Generation via PWABuilder (TWA)

You can generate a signed or unsigned Android package (APK & AAB) instantly through Microsoft's official PWABuilder:

1. Visit **[https://www.pwabuilder.com](https://www.pwabuilder.com)**.
2. Enter your live URL: `https://astravital-ai.vercel.app` and click **Start**.
3. PWABuilder will audit the manifest, icons, and service worker (All green / 100% compliant).
4. Click **Package for Stores** → Choose **Android**.
5. Configure package name (`com.teamzero.astravital`) and click **Generate Package**.
6. Download the generated zip containing the ready-to-publish APK and Google Play bundle!

---

## 📋 PWA & Android Specifications

| Parameter | Value |
|---|---|
| **App Name** | AstraVital AI - Astronaut Health & Digital Twin |
| **Short Name** | AstraVital AI |
| **Package ID** | `com.teamzero.astravital` |
| **Start URL** | `https://astravital-ai.vercel.app/?source=pwa` |
| **Theme Color** | `#060A12` |
| **Background Color** | `#030712` |
| **Display Mode** | `standalone` |
| **Service Worker** | `public/sw.js` (Offline Telemetry & Stale-While-Revalidate) |
| **Android Framework** | Capacitor v7 + Trusted Web Activity (TWA) ready |


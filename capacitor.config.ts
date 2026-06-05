import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.karunya.aicourtroom',
  appName: 'AI Court',
  // When running as an APK, load from the live Vercel deployment.
  // The WebView opens the production URL — all API routes (TTS, AI judge)
  // work because they run on Vercel, not locally on the phone.
  server: {
    url: 'https://your-app.vercel.app',  // ← replace after deploying to Vercel
    cleartext: false,
  },
  // Fallback: static web dir (used if no server.url — for local testing)
  webDir: 'out',
  android: {
    minSdkVersion: 22,     // Android 5.1+ (covers ~99% of active Android devices)
    targetSdkVersion: 34,
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config

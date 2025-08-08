import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ona.btpapp',
  appName: 'ONA BTP CC',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    // Configuration CORS pour éviter les problèmes
    allowNavigation: ['https://btp.onaerp.com/*', 'https://httpbin.org/*'],
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: "always",
    // Configuration pour éviter les problèmes CORS
    allowsLinkPreview: false,
    scrollEnabled: true
  }
};

export default config;

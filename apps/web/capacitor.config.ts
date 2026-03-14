import type { CapacitorConfig } from "@capacitor/cli";

const SERVER_URLS: Record<string, string> = {
  production: "https://app.geklix.com",
  development: "https://dev.geklix.com",
};

const env = process.env.CAPACITOR_ENV ?? "production";
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? SERVER_URLS[env] ?? SERVER_URLS.production;

const config: CapacitorConfig = {
  appId: "com.geklix.app",
  appName: env === "production" ? "Geklix" : `Geklix (${env})`,
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    scheme: "Geklix",
  },
};

export default config;

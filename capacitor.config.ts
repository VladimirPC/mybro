import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "me.grok.mybro",
  appName: "Дыши",
  webDir: "native/www",
  server: {
    url: "https://cabin-nova-wood-craft.grok.me",
    androidScheme: "https",
    // OAuth (Google / X / Grok broker) must stay in the same WebView so the
    // session cookie is set here, not in Chrome.
    allowNavigation: [
      "*.grok.me",
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com",
      "x.com",
      "*.x.com",
      "twitter.com",
      "*.twitter.com",
      "api.twitter.com",
      "api.x.com",
    ],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0c0d0c",
    // Strip WebView markers: Google blocks OAuth if UA contains "; wv".
    overrideUserAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0d0c",
    },
  },
};

export default config;

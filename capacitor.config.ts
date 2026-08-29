import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "me.grok.mybro",
  appName: "Дыши",
  webDir: "native/www",
  server: {
    url: "https://mybro.grok.me",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0c0d0c",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0d0c",
    },
  },
};

export default config;

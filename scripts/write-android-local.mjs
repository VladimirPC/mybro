import { writeFileSync } from "node:fs";
import { join } from "node:path";

const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk) {
  console.error("Задайте ANDROID_HOME (папка Android SDK) и откройте новый терминал.");
  process.exit(1);
}

const sdkDir = sdk.replaceAll("\\", "/");
writeFileSync(join("android", "local.properties"), `sdk.dir=${sdkDir}\n`);
console.log(`sdk.dir=${sdkDir}`);

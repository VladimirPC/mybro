# Нативная оболочка Android

Capacitor 8 + Kotlin. Пакет: `me.grok.mybro`.

## Google Play Protect и иконка

**Run / Debug APK** из Android Studio подписан debug-ключом. Play Protect часто помечает такие файлы как подозрительные — это не вирус, а debug-подпись. PWABuilder был тише, потому что там стоял настоящий `signing.keystore`.

Соберите **Release** со своим ключом:

1. Положите `signing.keystore` в `android/app/release.keystore` (в git не кладите).
2. Скопируйте `android/app/keystore.properties.example` → `android/app/keystore.properties` и впишите пароли.
3. Android Studio: **Build → Generate Signed App Bundle / APK → APK → release**.

Или: `cd android && ./gradlew assembleRelease`. APK: `android/app/build/outputs/apk/release/app-release.apk`.

Иконка — тёмный лист. Если после установки старая — удалите приложение и поставьте заново.

## Вход Google / X

OAuth идёт внутри WebView. После изменения `capacitor.config.ts`: `npx cap sync android` и пересоберите APK.

## Собрать debug (Play Protect может ругаться)

```bash
npm install
npx cap sync android
cd android
./gradlew assembleDebug
```

## Виджеты

Долгий тап по рабочему столу → Виджеты → Дыши. Цифры появляются после того, как открыто приложение и загрузился аккаунт.

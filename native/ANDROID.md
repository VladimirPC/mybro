# Нативная оболочка Android

Capacitor 8 + Kotlin. Пакет: `me.grok.mybro`. Сайт внутри приложения: `https://cabin-nova-wood-craft.grok.me`.

## Почему Play Protect ругается, а PWABuilder — нет

Кнопка **Run** в Android Studio ставит **debug APK**. Он подписан тестовым ключом Studio. Google Play Protect почти всегда помечает такие файлы как подозрительные. PWABuilder подписывал **release-ключом** — поэтому там было тихо.

Иконка-робот Android Studio больше не используется. На рабочем столе — тёмный лист «Дыши». После смены иконки **удалите старое приложение** и поставьте новое, иначе лаунчер кэширует старую картинку.

## Как собрать правильно (чтобы не ругался Protect)

1. Android Studio: **Build → Generate Signed App Bundle or APK → APK**.
2. Создайте ключ (или возьмите `signing.keystore` из zip PWABuilder).
3. Build variant: **release**, не debug.
4. Поставьте `app-release.apk`.

Либо файлы в проекте:

- `android/app/release.keystore`
- `android/app/keystore.properties` (из `keystore.properties.example`)

Затем:

```bash
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`.

Debug (`Run`) для себя можно, но Protect будет ругаться — это не вирус.

## Виджеты

После установки откройте приложение, войдите в Google и подождите загрузку учёта. Цифры уходят на виджеты сами. Долгий тап по рабочему столу → Виджеты → Дыши.

Если виджет пустой — откройте «Дыши» ещё раз (чтобы сайт с мостом виджета успел загрузиться) и не закрывайте его сразу.

## После правок сайта

Сайт внутри APK — удалённый. Сначала опубликуйте веб-приложение, потом при смене адреса в `capacitor.config.ts` сделайте `npx cap sync android` и соберите **новый release APK**.

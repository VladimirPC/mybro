# Нативная оболочка Android

Capacitor 8 + Kotlin. Пакет: `me.grok.mybro`. Это отдельное приложение от TWA `me.grok.mybrobreathe.twa`. В оболочке нет адресной строки. Виджеты рабочего стола: Сегодня, Остаток, Выкурить, Сводка.

Сайт внутри WebView: [https://mybro.grok.me](https://mybro.grok.me). Цифры на виджетах обновляются, пока открыто приложение.

## Вход Google / X

OAuth идёт **внутри WebView**, не через Chrome. Список `allowNavigation` в `capacitor.config.ts` держит Google, X и `*.grok.me` в приложении. User-Agent без метки `wv`, иначе Google отвечает «небезопасный браузер».

После изменения конфига:

```bash
npx cap sync android
```

Затем пересоберите APK. Если Google всё равно блокирует WebView — войдите почтой.

## Собрать APK

Нужны JDK 17 и Android SDK (API 36). Android Studio не обязательна.

### VS Code + Gradle

1. Установите JDK 17 и Android SDK, задайте `JAVA_HOME` и `ANDROID_HOME` (см. ниже).
2. Клонируйте репозиторий, откройте **корневую папку** в VS Code.
3. Когда VS Code предложит расширения — поставьте **Extension Pack for Java** (внутри него Gradle for Java) и **Kotlin**.
4. Новый терминал: `npm install`
5. `Terminal → Run Task…`:
   - **Gradle: assembleDebug** — debug-APK
   - **Gradle: installDebug** — сборка и установка на подключённый телефон

Либо вручную:

```bash
npm install
npx cap sync android
node scripts/write-android-local.mjs
cd android
./gradlew assembleDebug
```

Windows: `gradlew.bat` вместо `./gradlew`. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

В панели **Gradle** (иконка слона) корень проекта — папка `android/`. Если её нет: Command Palette → `Gradle: Refresh Gradle Projects`.

`android/local.properties` создаётся сам из `ANDROID_HOME`. Пример пути — `android/local.properties.example`. Файл в git не коммитится.

### Android Studio

1. `npm install`
2. Откройте папку `android/` в Android Studio.
3. Дождитесь Gradle Sync.
4. Run на телефоне или Build → Build APK(s).

Подпись — своим ключом. Файл `.keystore` в git не кладите. После первой подписи добавьте SHA-256 отпечаток в `public/.well-known/assetlinks.json` вторым блоком с `package_name` `me.grok.mybro`, если понадобятся App Links.

## Виджеты

На телефоне: долгий тап по рабочему столу → Виджеты → Дыши.

| Виджет | Что делает |
| --- | --- |
| Сегодня | число за день |
| Остаток | сколько ещё можно |
| Выкурить | «+» открывает приложение и ставит отметку |
| Сводка | сегодня / остаток / лимит |

Кнопка «+» не пишет в облако сама: открывает приложение, сайт дописывает сигарету и синхронизирует виджеты.

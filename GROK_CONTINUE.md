# Промпт для другого чата Grok

Скопируйте целиком и вставьте в новый чат (другой аккаунт Grok). GitHub должен быть подключён.

---

Продолжи приложение **Дыши** из репозитория https://github.com/VladimirPC/mybro

Это готовый продукт, не собирай с нуля. Склонируй / подтяни `main` и работай поверх него.

Живой сайт исходного проекта: https://mybro.grok.me  
Package Android TWA: `me.grok.mybrobreathe.twa`  
Нативная оболочка Capacitor: пакет `me.grok.mybro`, исходники в `android/` и `native/ANDROID.md`.  
Asset Links: `public/.well-known/assetlinks.json` (пакет `me.grok.mybrobreathe.twa`, SHA-256 отпечаток уже прописан).

Стек: Vite + TanStack Start/Router + React + Tailwind + Zustand. Auth и Neon уже включены. Данные пользователя в облаке, «Круг» — только просмотр чужого прогресса.

Правила:
- Не переписывай приложение заново.
- После правок пушь в `VladimirPC/mybro` ветку `main`.
- Не коммить `.env`, `.vercel/`, `signing-key-info.txt`, `*.keystore`.
- Сохраняй маршруты `/widget`, `/.well-known/assetlinks.json`, PWA-манифест и иконки 192/512.
- Интерфейс на русском.
- Главная цель — постепенно бросить курить: среднее за все дни, лимит, снижение, факты о вреде.

Когда код в GitHub обновлён, напиши что изменилось и что проверить на телефоне.

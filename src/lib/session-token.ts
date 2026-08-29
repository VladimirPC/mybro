/** Same key `src/lib/auth/client.ts` reads — do not rename. */
const BEARER_KEY = "grok-auth.bearer-token";

/** Keep the live-preview session when cookies in the iframe are partitioned. */
export function persistPreviewBearer(token: string | null | undefined) {
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* storage blocked */
  }
}

export function authErrorText(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const m = raw.toLowerCase();
  if (m.includes("pop-up") || m.includes("popup")) {
    return "Браузер закрыл окно входа. Разрешите всплывающие окна или войдите почтой ниже.";
  }
  if (m.includes("cancelled") || m.includes("canceled") || m.includes("failed")) {
    return "Вход через Google/X не завершился. Во встроенном окне так бывает — войдите почтой.";
  }
  if (m.includes("invalid origin")) {
    return "Этот адрес не в списке доверенных. Откройте приложение по обычной ссылке предпросмотра.";
  }
  if (m.includes("invalid email or password") || m.includes("invalid_email_or_password")) {
    return "Неверная почта или пароль.";
  }
  if (m.includes("user already exists") || m.includes("already exists")) {
    return "Такой аккаунт уже есть — нажмите «Войти».";
  }
  if (m.includes("password") && m.includes("invalid")) {
    return "Пароль слишком короткий. Минимум 8 символов.";
  }
  if (m.includes("timeout")) {
    return "Сервер не ответил. Попробуйте ещё раз.";
  }
  return raw || "Не вышло войти";
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

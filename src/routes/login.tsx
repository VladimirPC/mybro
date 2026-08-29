import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { authErrorText, persistPreviewBearer, withTimeout } from "@/lib/session-token";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function finishWithToken(token?: string | null) {
    persistPreviewBearer(token);
    try {
      await withTimeout(authClient.getSession(), 8000);
    } catch {
      /* bearer is enough for the next page */
    }
    window.location.href = "/";
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    try {
      if (mode === "up") {
        const { data, error: err } = await withTimeout(
          authClient.signUp.email({
            email,
            password,
            name: name.trim() || email.split("@")[0] || "Друг",
          }),
          15000,
        );
        if (err) throw new Error(err.message);
        await finishWithToken(data?.token);
      } else {
        const { data, error: err } = await withTimeout(
          authClient.signIn.email({ email, password }),
          15000,
        );
        if (err) throw new Error(err.message);
        await finishWithToken(data?.token);
      }
    } catch (err) {
      setError(authErrorText(err));
      setBusy(null);
    }
  }

  async function onOauth(providerId: string) {
    setBusy(providerId);
    setError(null);
    try {
      await withTimeout(signIn(providerId, { callbackURL: "/" }), 90_000);
    } catch (err) {
      setError(authErrorText(err));
      setBusy(null);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10 text-fg">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-wide text-muted uppercase">Дыши</p>
        <h1 className="font-display mt-2 text-3xl tracking-tight">Войти в свой учёт</h1>
        <p className="mt-2 text-sm text-muted">
          Во встроенном предпросмотре Google и X часто зависают на «Signing you in…» — окно не может вернуться. Почта
          работает сразу.
        </p>

        <form className="mt-6 space-y-3" onSubmit={onEmail}>
          {mode === "up" ? (
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input id="name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label htmlFor="email">Почта</Label>
            <Input
              id="email"
              className="mt-1"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              className="mt-1"
              type="password"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy !== null}>
            {busy === "email" ? "Входим…" : mode === "up" ? "Создать аккаунт" : "Войти по почте"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-primary"
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setError(null);
          }}
        >
          {mode === "up" ? "Уже есть аккаунт — войти" : "Нет аккаунта — создать"}
        </button>

        {authEnabled ? (
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-3 text-xs text-subtle">
              <span className="h-px flex-1 bg-border" />
              или отдельным окном
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={busy !== null}
                  onClick={() => void onOauth(p.providerId)}
                >
                  {busy === p.providerId ? "Ждём окно входа…" : `Продолжить с ${p.label}`}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-subtle">
              Нужно разрешить всплывающие окна. Если зависло «Signing you in…» — закройте его и войдите почтой.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Вход выключен.</p>
        )}

        <p className="mt-8 text-center text-sm text-muted">
          <Link to="/" className="text-primary">
            Пока без входа, только на этом телефоне
          </Link>
        </p>
      </div>
    </main>
  );
}

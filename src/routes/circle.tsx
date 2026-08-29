import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { followByCode, getCircle, unfollow, type CircleInfo } from "@/lib/cloud";
import { formatNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/circle")({ component: CirclePage });

function CirclePage() {
  const { user, isPending } = useCurrentUserState();
  const [info, setInfo] = useState<CircleInfo | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const next = await getCircle();
    setInfo(next);
  }

  useEffect(() => {
    if (!user || user.isDevFallback) return;
    void refresh().catch(() => setInfo(null));
  }, [user]);

  if (isPending) {
    return (
      <AppShell title="Круг">
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function onFollow(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await followByCode({ data: code });
      setCode("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вышло");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.inviteCode);
    } catch {
      /* ignore */
    }
  }

  return (
    <AppShell title="Круг">
      <div className="page-enter space-y-4">
        <Card>
          <CardTitle>Ваш код</CardTitle>
          <CardHint className="mt-1">
            Отправьте другу приложение и этот код. Он ведёт учёт у себя — вы видите прогресс. Если вы бросаете, а
            смотрит кто-то другой — дайте ему этот же код.
          </CardHint>
          <p className="font-display mt-4 text-4xl tracking-widest">{info?.inviteCode ?? "······"}</p>
          <Button className="mt-4" variant="secondary" onClick={copyCode} disabled={!info}>
            Скопировать
          </Button>
        </Card>

        <Card>
          <CardTitle>Следить за другом</CardTitle>
          <CardHint className="mt-1">Введите его код — откроется его счётчик только для просмотра.</CardHint>
          <form className="mt-4 flex gap-2" onSubmit={onFollow}>
            <div className="flex-1">
              <Label htmlFor="code" className="sr-only">
                Код друга
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                autoCapitalize="characters"
              />
            </div>
            <Button type="submit" disabled={busy || code.length < 4}>
              Связать
            </Button>
          </form>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        </Card>

        <div>
          <h2 className="font-display text-lg tracking-tight">Кого смотрите</h2>
          {info && info.watching.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Пока никого. Друг заходит в приложение, копирует свой код и шлёт вам.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {info?.watching.map((p) => (
                <li key={p.userId}>
                  <Link
                    to="/circle/$userId"
                    params={{ userId: p.userId }}
                    className={cn(
                      "block rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
                      p.overLimit && "shadow-[0_0_0_1px_var(--color-danger)]",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{p.name}</span>
                      <span className="tabular text-muted">
                        {p.today}
                        {p.limit != null ? ` / ${p.limit}` : ""} сегодня
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      среднее {formatNum(p.allTimeAvg)} · {p.daysTracked} дн.
                    </p>
                  </Link>
                  <button
                    type="button"
                    className="mt-1 text-xs text-subtle"
                    onClick={() => void unfollow({ data: p.userId }).then(refresh)}
                  >
                    Отвязать
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {info && info.watchedBy.length > 0 ? (
          <Card>
            <CardTitle>Кто видит вас</CardTitle>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {info.watchedBy.map((p) => (
                <li key={p.userId}>{p.name}</li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

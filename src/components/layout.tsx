import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, HeartPulse, Home, LayoutGrid, Target, Users } from "lucide-react";
import type { ReactNode } from "react";
import { AuthBar } from "@/components/auth-bar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Сегодня", icon: Home },
  { to: "/analytics", label: "Аналитика", icon: Activity },
  { to: "/plan", label: "План", icon: Target },
  { to: "/circle", label: "Круг", icon: Users },
  { to: "/health", label: "Тело", icon: HeartPulse },
  { to: "/settings", label: "Ещё", icon: LayoutGrid },
] as const;

export function AppShell({ children, title, action }: { children: ReactNode; title?: string; action?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed top-0 left-0 hidden h-dvh w-56 flex-col border-r border-border px-4 py-6 md:flex">
        <div className="font-display px-2 text-xl tracking-tight">Дыши</div>
        <p className="px-2 pt-1 text-xs text-muted">постепенно к нулю</p>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : item.to === "/circle"
                  ? pathname.startsWith("/circle")
                  : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
                  active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-2 pt-4">
          <AuthBar />
        </div>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-bg/90 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="text-xs tracking-wide text-muted uppercase md:hidden">Дыши</p>
            {title ? <h1 className="font-display text-xl tracking-tight">{title}</h1> : null}
          </div>
          <div className="flex items-center gap-3">
            {action}
            <div className="md:hidden">
              <AuthBar compact />
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-3xl px-5 pb-28 md:pb-10">{children}</div>
      </div>

      <nav className="fixed right-0 bottom-0 left-0 z-30 border-t border-border bg-bg/95 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-lg">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : item.to === "/circle"
                  ? pathname.startsWith("/circle")
                  : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[10px]",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

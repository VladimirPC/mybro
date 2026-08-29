import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthBar({ compact }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setWaited(false);
      return;
    }
    const t = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(t);
  }, [isPending]);

  if (isPending && !waited) {
    return <div className="size-8 shrink-0 animate-pulse rounded-full bg-surface-2" />;
  }
  if (!user) {
    return (
      <Link to="/login" className="text-sm text-primary">
        Войти
      </Link>
    );
  }
  if (compact) {
    const label = user.displayName ?? user.primaryEmail ?? "Я";
    return (
      <Link to="/settings" className="grid size-8 place-items-center overflow-hidden rounded-full bg-surface-2 text-xs">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="" className="size-8 object-cover" />
        ) : (
          label.charAt(0).toUpperCase()
        )}
      </Link>
    );
  }
  return <UserButton />;
}

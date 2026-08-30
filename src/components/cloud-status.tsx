import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCloudStatus, subscribeCloudStatus, type CloudStatus } from "@/lib/sync";

export function CloudStatusLine() {
  const { user } = useCurrentUserState();
  const [status, setStatus] = useState<CloudStatus>(getCloudStatus);
  useEffect(() => subscribeCloudStatus(setStatus), []);
  if (!user || user.isDevFallback) return null;
  const who = user.primaryEmail || user.displayName || "аккаунт";
  return (
    <p className="text-center text-xs text-subtle">
      {status.saving
        ? "Сохраняем в аккаунт…"
        : status.lastError
          ? `Не сохранилось: ${status.lastError}`
          : `Учёт в аккаунте · ${who}`}
    </p>
  );
}

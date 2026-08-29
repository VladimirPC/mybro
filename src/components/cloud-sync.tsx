import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { startCloudSync, stopCloudSync } from "@/lib/sync";
import { useSmokeStore } from "@/lib/store";

export function CloudSync() {
  const { user, isPending } = useCurrentUserState();
  const hydrated = useSmokeStore((s) => s.hydrated);

  useEffect(() => {
    if (isPending || !hydrated) return;
    if (!user || user.isDevFallback) {
      stopCloudSync();
      return;
    }
    void startCloudSync(user.displayName ?? user.primaryEmail ?? "");
    return () => stopCloudSync();
  }, [user, isPending, hydrated]);

  return null;
}

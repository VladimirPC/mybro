import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { startCloudSync, stopCloudSync } from "@/lib/sync";

export function CloudSync() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (isPending) return;
    if (!user || user.isDevFallback) {
      stopCloudSync();
      return;
    }
    void startCloudSync(user.displayName ?? user.primaryEmail ?? "");
    return () => stopCloudSync();
  }, [user, isPending]);

  return null;
}

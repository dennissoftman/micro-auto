import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export type SyncState =
  | "offline"
  | "online_unauthenticated"
  | "syncing"
  | "synced";

export function useSyncStatus(): SyncState {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : false,
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync status could also update with window focus
    const handleFocus = () => setIsOnline(navigator.onLine);
    window.addEventListener("focus", handleFocus);

    // Listen to sync events from SyncManager
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => setIsSyncing(false);
    window.addEventListener("sync-start", handleSyncStart);
    window.addEventListener("sync-end", handleSyncEnd);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("sync-start", handleSyncStart);
      window.removeEventListener("sync-end", handleSyncEnd);
    };
  }, []);

  const metadata = useLiveQuery(() => db.syncMetadata.get("default"), []);

  if (!isOnline) {
    return "offline";
  }

  if (isSyncing) {
    return "syncing";
  }

  if (metadata && metadata.userToken) {
    return "synced";
  }

  return "online_unauthenticated";
}

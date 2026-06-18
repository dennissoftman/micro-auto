"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, X, AlertTriangle } from "lucide-react";

const CHECK_INTERVAL_MS = 2 * 60 * 1000;
const DISMISSED_VERSION_KEY = "dismissedAppUpdateVersion";
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

type VersionResponse = {
  version?: string;
};

export function AppUpdateBanner() {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(DISMISSED_VERSION_KEY);
  });

  const updateServiceWorker = useCallback(async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !CURRENT_VERSION ||
      CURRENT_VERSION === "dev" ||
      !navigator.onLine
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/version.json?ts=${Date.now().toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as VersionResponse;
      const nextVersion = payload.version?.trim();

      if (!nextVersion) return;

      if (nextVersion !== CURRENT_VERSION) {
        setLatestVersion(nextVersion);
        await updateServiceWorker();
        return;
      }

      setLatestVersion(null);
      if (dismissedVersion !== null) {
        window.localStorage.removeItem(DISMISSED_VERSION_KEY);
        setDismissedVersion(null);
      }
    } catch {
      // Ignore network errors. The banner only matters when online.
    }
  }, [dismissedVersion, updateServiceWorker]);

  useEffect(() => {
    const initialCheckId = window.setTimeout(() => {
      void checkForUpdate();
    }, 0);

    const intervalId = window.setInterval(() => {
      void checkForUpdate();
    }, CHECK_INTERVAL_MS);

    const handleFocus = () => {
      void checkForUpdate();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    };

    const handleOnline = () => {
      void checkForUpdate();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(initialCheckId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForUpdate]);

  const isVisible =
    latestVersion !== null && latestVersion !== dismissedVersion;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    if (!latestVersion) return;
    window.localStorage.setItem(DISMISSED_VERSION_KEY, latestVersion);
    setDismissedVersion(latestVersion);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-[26rem]">
      <div className="glass flex items-start gap-3 rounded-xl border border-primary/20 bg-white/90 px-4 py-3 shadow-lg dark:bg-zinc-950/90">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            New version available
          </div>
          <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Refresh to load the latest site version.
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh now
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
          aria-label="Dismiss update notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

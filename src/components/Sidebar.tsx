"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Wrench,
  Settings,
  LayoutDashboard,
  Download,
  Upload,
  Users,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { db } from "@/lib/db";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { LoginModal } from "./LoginModal";
import { exportBackup, importBackup } from "@/lib/backup";
import { useAppPreferences } from "@/lib/appPreferences";

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const syncState = useSyncStatus();
  const { usesClients } = useAppPreferences();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleExport = async () => {
    try {
      await exportBackup();
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : err}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmAction = window.confirm(t("confirmImport"));
    if (!confirmAction) {
      e.target.value = "";
      return;
    }

    try {
      await importBackup(file);
      alert(t("importSuccess"));
    } catch (err) {
      alert(`${t("importError")}: ${err instanceof Error ? err.message : err}`);
    } finally {
      e.target.value = "";
    }
  };

  const handleCloudClick = async () => {
    if (syncState === "online_unauthenticated") {
      setShowLoginModal(true);
    } else if (syncState === "synced") {
      const confirmLogout = window.confirm(t("confirmLogout"));
      if (confirmLogout) {
        await db.syncMetadata.delete("default");
      }
    }
  };

  const getSyncStateName = () => {
    switch (syncState) {
      case "offline":
        return t("offline");
      case "online_unauthenticated":
        return t("onlineUnauthenticated");
      case "syncing":
        return t("syncing");
      case "synced":
        return t("synced");
      default:
        return "";
    }
  };

  return (
    <aside className="w-full md:w-64 glass md:min-h-screen p-6 flex flex-col border-b md:border-b-0 md:border-r border-border sticky top-0 z-10">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 shadow-inner">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">µAuto</h1>
        </div>

        {/* Sync Status Indicator */}
        <button
          onClick={handleCloudClick}
          className={`flex items-center p-1.5 rounded-lg transition-all ${
            syncState === "offline"
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          }`}
          title={t("syncStatus", { status: getSyncStateName() })}
          disabled={syncState === "offline"}
        >
          {syncState === "offline" && (
            <CloudOff className="w-5 h-5 text-gray-400" />
          )}
          {syncState === "online_unauthenticated" && (
            <Cloud className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
          )}
          {syncState === "syncing" && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {syncState === "synced" && (
            <Cloud className="w-5 h-5 text-green-500 hover:text-red-400 transition-colors" />
          )}
        </button>
      </div>

      <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 flex-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium hover:pl-5 group ${pathname === "/" ? "bg-black/5 dark:bg-white/10 text-primary" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-500"}`}
        >
          <LayoutDashboard
            className={`w-4 h-4 transition-colors ${pathname === "/" ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}
          />
          {t("dashboard")}
        </Link>

        {usesClients && (
          <Link
            href="/clients"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium hover:pl-5 group ${pathname === "/clients" ? "bg-black/5 dark:bg-white/10 text-primary" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-500"}`}
          >
            <Users
              className={`w-4 h-4 transition-colors ${pathname === "/clients" ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}
            />
            {t("clients")}
          </Link>
        )}

        <Link
          href="/settings"
          className={`flex md:mt-auto items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium hover:pl-5 group ${pathname === "/settings" ? "bg-black/5 dark:bg-white/10 text-primary" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-500"}`}
        >
          <Settings
            className={`w-4 h-4 transition-colors ${pathname === "/settings" ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}
          />
          {t("settings")}
        </Link>
      </nav>

      {/* Backup controls in Sidebar */}
      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-zinc-800 flex md:flex-col gap-1 overflow-x-auto">
        <button
          onClick={handleExport}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-primary cursor-pointer w-full text-left"
        >
          <Download className="w-4 h-4 text-slate-400 group-hover:text-primary" />
          <span>{t("exportData")}</span>
        </button>
        <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-primary cursor-pointer w-full">
          <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary" />
          <span>{t("importData")}</span>
          <input
            type="file"
            accept=".json,.zip"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </aside>
  );
}

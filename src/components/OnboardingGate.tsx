"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Check,
  Database,
  Languages,
  Moon,
  Palette,
  Sun,
  Upload,
  Users,
  Wrench,
  Monitor,
} from "lucide-react";
import { importBackup } from "@/lib/backup";
import {
  type ClientTrackingMode,
  useAppPreferences,
} from "@/lib/appPreferences";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/dictionaries";

type ThemeChoice = "system" | "light" | "dark";

const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "uk", label: "Українська" },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const {
    onboardingComplete,
    setOnboardingComplete,
    clientTrackingMode,
    setClientTrackingMode,
  } = useAppPreferences();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  if (onboardingComplete) return <>{children}</>;

  const selectedTheme = (theme || "system") as ThemeChoice;

  const completeSetup = () => {
    setImportError("");
    setOnboardingComplete(true);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError("");
    try {
      await importBackup(file);
      setOnboardingComplete(true);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : t("importError"),
      );
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const themeOptions: Array<{
    value: ThemeChoice;
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: "system", label: t("system"), icon: <Monitor className="w-4 h-4" /> },
    { value: "light", label: t("light"), icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: t("dark"), icon: <Moon className="w-4 h-4" /> },
  ];

  const modeOptions: Array<{
    value: ClientTrackingMode;
    label: string;
    description: string;
  }> = [
    {
      value: "clients",
      label: t("trackClients"),
      description: t("trackClientsDesc"),
    },
    {
      value: "cars_only",
      label: t("carsOnly"),
      description: t("carsOnlyDesc"),
    },
  ];

  return (
    <main className="min-h-screen w-full bg-background text-foreground p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-4xl flex-col justify-center md:min-h-[calc(100vh-4rem)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 shadow-inner">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              µAuto
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("welcomeTitle")}
            </h1>
          </div>
        </div>

        <section className="glass rounded-2xl p-5 md:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {t("welcomeSetup")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t("welcomeSetupDesc")}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Languages className="h-4 w-4 text-slate-500" />
                  {t("language")}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {languageOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLocale(value)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        locale === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white/50 text-slate-600 hover:border-primary/40 dark:bg-zinc-900/50 dark:text-slate-300"
                      }`}
                    >
                      {label}
                      {locale === value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Palette className="h-4 w-4 text-slate-500" />
                  {t("theme")}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                        selectedTheme === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white/50 text-slate-600 hover:border-primary/40 dark:bg-zinc-900/50 dark:text-slate-300"
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-slate-500" />
                  {t("clientTracking")}
                </div>
                <div className="grid gap-3">
                  {modeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setClientTrackingMode(option.value)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        clientTrackingMode === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-white/50 hover:border-primary/40 dark:bg-zinc-900/50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                        {option.label}
                        {clientTrackingMode === option.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </span>
                      <span className="mt-2 block text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white/50 p-4 dark:bg-zinc-900/50">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      {t("importExistingDatabase")}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                      {t("importExistingDatabaseDesc")}
                    </p>
                  </div>
                </div>

                {importError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                    {t("importError")}: {importError}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {isImporting ? t("importing") : t("importData")}
                  </button>
                  <button
                    type="button"
                    onClick={completeSetup}
                    disabled={isImporting}
                    className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300"
                  >
                    {t("skipImport")}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.zip"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

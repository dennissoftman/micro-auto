"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, Locale } from "./dictionaries";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    key: keyof typeof dictionaries.en,
    params?: Record<string, string | number>,
  ) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
    } else {
      if (navigator.language.startsWith("ru")) {
        setLocaleState("ru");
      }
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (
    key: keyof typeof dictionaries.en,
    params?: Record<string, string | number>,
  ) => {
    let str = (dictionaries[locale][key] ??
      dictionaries.en[key] ??
      key) as string;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#09090b]" />;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

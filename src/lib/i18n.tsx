"use client";

import React, { createContext, useContext } from "react";
import { dictionaries, Locale } from "./dictionaries";
import { useLocalStorage } from "./useLocalStorage";
import { LOCALE_KEY } from "./storageKeys";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    key: keyof typeof dictionaries.en,
    params?: Record<string, string | number>,
  ) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

function getDefaultLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
  if (saved && dictionaries[saved]) return saved;

  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("uk")) return "uk";
  if (browserLanguage.startsWith("ru")) return "ru";
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useLocalStorage<Locale>(
    LOCALE_KEY,
    getDefaultLocale(),
  );

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
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

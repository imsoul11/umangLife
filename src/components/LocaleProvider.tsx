"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, translateWith, localeTag, type Locale, type TranslationKey } from "@/lib/i18n";
import { loadLocale, saveLocale } from "@/lib/repository";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** BCP-47 tag for Date.toLocaleDateString, e.g. "hi-IN" */
  localeTag: string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = loadLocale();
    if (saved && saved !== "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    saveLocale(l);
  };

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    vars ? translateWith(locale, key, vars) : translate(locale, key);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, localeTag: localeTag(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within <LocaleProvider>");
  return ctx;
}

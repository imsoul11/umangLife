"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Locale, type TranslationKey } from "@/lib/i18n";
import { loadLocale, saveLocale } from "@/lib/repository";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
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

  const t = (key: TranslationKey) => translate(locale, key);

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within <LocaleProvider>");
  return ctx;
}

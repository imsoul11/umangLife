"use client";

import type { Locale } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const OPTIONS: { id: Locale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "hi", label: "हिंदी" },
];

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex gap-0.5 rounded-full glass ring-1 ring-indigo-ink/[0.08] shadow-sm p-0.5 text-xs">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => setLocale(o.id)}
          className={`px-2 py-0.5 rounded-full transition font-medium ${
            locale === o.id ? "bg-indigo-ink text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

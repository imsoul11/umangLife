"use client";

import type { CitizenProfile } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import LanguageToggle from "./LanguageToggle";

export default function DashboardHeader({ profile, onReset, onOpenProfile }: { profile: CitizenProfile; onReset: () => void; onOpenProfile: () => void }) {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-indigo-ink/10 bg-white/70 backdrop-blur-lg px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-deep text-white grid place-items-center font-bold shadow-md shadow-saffron/25">
          <span className="font-display text-lg leading-none">उ</span>
        </div>
        <div>
          <h1 className="font-display font-semibold text-indigo-ink text-lg leading-tight tracking-tight">
            UMANG <span className="text-saffron">&middot;</span> Life Journey
          </h1>
          <p className="text-[11px] text-slate-500">{t("header.subtitle")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[13px] flex-wrap ml-auto">
        <a href="/benefits" className="font-medium text-slate-600 hover:text-saffron border border-slate-200 rounded-full px-3.5 py-1.5 hover:border-saffron/50 transition">
          {t("nav.benefits")}
        </a>
        <a href="/calendar" className="font-medium text-slate-600 hover:text-saffron border border-slate-200 rounded-full px-3.5 py-1.5 hover:border-saffron/50 transition">
          {t("nav.calendar")}
        </a>
        <a href="/about" className="font-medium text-slate-600 hover:text-saffron border border-slate-200 rounded-full px-3.5 py-1.5 hover:border-saffron/50 transition">
          {t("nav.about")}
        </a>
        <LanguageToggle />
        <button onClick={onOpenProfile} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 transition text-left" title={t("header.editProfile")}>
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
            {profile.name[0]}
          </span>
          <span className="leading-tight">
            <span className="block font-medium text-slate-800">{profile.name}</span>
            <span className="block text-xs text-slate-500">{profile.state} · {profile.occupation}</span>
          </span>
          <span className="text-[10px] text-slate-400 ml-1">✎</span>
        </button>
        <button
          onClick={onReset}
          className="ml-3 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          {t("header.reset")}
        </button>
      </div>
    </header>
  );
}

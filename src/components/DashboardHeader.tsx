"use client";

import type { CitizenProfile } from "@/lib/types";
import PageHeader from "./PageHeader";
import LanguageToggle from "./LanguageToggle";
import { useLocale } from "./LocaleProvider";
import type { CommandItem } from "./CommandPalette";

export default function DashboardHeader({
  profile,
  onReset,
  onOpenProfile,
  journeys,
  onSelectJourney,
}: {
  profile: CitizenProfile;
  onReset: () => void;
  onOpenProfile: () => void;
  journeys: { id: string; emoji: string; title: string; progressLabel: string }[];
  onSelectJourney: (id: string) => void;
}) {
  const { t } = useLocale();

  const commandItems: CommandItem[] = [
    {
      id: "action:profile",
      label: "Edit profile & documents",
      icon: "🪪",
      group: "Actions",
      keywords: "profile digilocker documents edit",
      run: onOpenProfile,
    },
    ...journeys.map((j) => ({
      id: `journey:${j.id}`,
      label: j.title.replace(" Journey", ""),
      icon: j.emoji,
      group: "Journeys",
      hint: j.progressLabel,
      run: () => onSelectJourney(j.id),
    })),
  ];

  return (
    <PageHeader
      icon={<span className="font-display text-lg leading-none">उ</span>}
      title={
        <>
          UMANG <span className="text-saffron">&middot;</span> Life Journey
        </>
      }
      subtitle={t("header.subtitle")}
      commandItems={commandItems}
      actions={
        <>
          <LanguageToggle />
          <button
            onClick={onOpenProfile}
            title={t("header.editProfile")}
            className="group flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-2.5 ring-1 ring-indigo-ink/10 shadow-sm transition hover:bg-white hover:ring-saffron/40 text-left"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-ink to-[#3a2d7d] text-white grid place-items-center font-semibold ring-1 ring-white/40 ring-inset">
              {profile.name[0]}
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block text-xs font-semibold text-slate-800">{profile.name}</span>
              <span className="block text-[10px] text-slate-500">{profile.state} · {profile.occupation}</span>
            </span>
            <span className="text-[10px] text-slate-300 transition group-hover:text-saffron">✎</span>
          </button>
          <button
            onClick={onReset}
            className="ml-1 px-2 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
          >
            {t("header.reset")}
          </button>
        </>
      }
    />
  );
}
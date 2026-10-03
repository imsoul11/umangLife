"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useJourneys } from "@/components/JourneyProvider";
import { useLocale } from "@/components/LocaleProvider";
import { buildCalendar } from "@/lib/engine";
import { loadSlaBannerDismissedDay, saveSlaBannerDismissedDay } from "@/lib/repository";

export default function SlaBanner() {
  const { journeys, building } = useJourneys();
  const { t } = useLocale();
  const [dismissedDay, setDismissedDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const day = loadSlaBannerDismissedDay();
      if (!cancelled) setDismissedDay(day);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const urgentCount = useMemo(
    () => journeys.reduce((n, j) => n + buildCalendar(j).filter((e) => e.severity === "urgent").length, 0),
    [journeys],
  );

  const today = new Date().toISOString().slice(0, 10);
  if (building || urgentCount === 0 || dismissedDay === today) return null;

  return (
    <div className="anim-rise flex items-center gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-red-50/70 to-red-50/40 px-4 py-3 shadow-sm shadow-red-100/60" role="alert">
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-lg ring-1 ring-red-200">🚨</span>
      <p className="flex-1 text-sm text-red-800 leading-snug">{t("sla.banner", { n: urgentCount })}</p>
      <Link
        href="/calendar"
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition shrink-0"
      >
        {t("sla.review")}
      </Link>
      <button
        onClick={() => {
          saveSlaBannerDismissedDay(today);
          setDismissedDay(today);
        }}
        className="text-xs text-red-500 hover:text-red-700 underline shrink-0"
      >
        {t("sla.dismiss")}
      </button>
    </div>
  );
}
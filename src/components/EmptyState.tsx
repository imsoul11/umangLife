"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function EmptyState({ onPrompt }: { onPrompt: (t: string) => void }) {
  const { t } = useLocale();
  const samples = [t("sample.job"), t("sample.vehicle"), t("sample.pending")];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-5">
      <div className="text-5xl">🏛️</div>
      <h2 className="text-xl font-semibold text-slate-800">{t("empty.title")}</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto">{t("empty.body")}</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {samples.slice(0, 2).map((s) => (
          <button key={s} onClick={() => onPrompt(s)} className="text-xs px-3 py-2 rounded-full border border-slate-300 text-slate-600 hover:border-orange-500 hover:text-orange-600 transition">
            “{s}”
          </button>
        ))}
      </div>
    </div>
  );
}
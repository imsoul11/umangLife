"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function EmptyState({ onPrompt }: { onPrompt: (t: string) => void }) {
  const { t } = useLocale();
  const samples = [t("sample.job"), t("sample.vehicle"), t("sample.pending")];
  return (
    <div className="card relative overflow-hidden p-10 text-center">
      <div aria-hidden className="absolute -top-24 left-1/2 h-56 w-[30rem] -translate-x-1/2 rounded-full bg-saffron/10 blur-3xl" />
      <div aria-hidden className="floaty absolute left-7 top-7 text-2xl opacity-30 select-none">📜</div>
      <div aria-hidden className="floaty absolute right-9 top-11 text-xl opacity-25 select-none" style={{ animationDelay: "-2.5s" }}>🪪</div>
      <div aria-hidden className="floaty absolute bottom-9 right-12 text-lg opacity-20 select-none" style={{ animationDelay: "-4s" }}>🏛️</div>
      <div aria-hidden className="floaty absolute bottom-12 left-10 text-lg opacity-20 select-none" style={{ animationDelay: "-1.5s" }}>🛡️</div>

      <div className="relative">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-saffron/15 to-gold/10 text-4xl ring-1 ring-saffron/25 shadow-soft">
          🏛️
        </div>
        <h2 className="font-display text-xl font-semibold text-indigo-ink">{t("empty.title")}</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">{t("empty.body")}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-6">
          {samples.slice(0, 2).map((s) => (
            <button
              key={s}
              onClick={() => onPrompt(s)}
              className="text-xs font-medium px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-saffron/60 hover:text-saffron hover:shadow-md hover:-translate-y-0.5 transition"
            >
              “{s}”
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
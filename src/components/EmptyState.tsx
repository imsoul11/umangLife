"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/components/LocaleProvider";

/** WebGL scene is heavy — load it lazily, never on the server, with the static tile as fallback. */
const GatewayScene = dynamic(() => import("@/components/three/GatewayScene"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] md:h-[280px] grid place-items-center" aria-hidden>
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-saffron/15 to-gold/10 text-4xl ring-1 ring-saffron/25 shadow-soft animate-pulse">
        🏛️
      </div>
    </div>
  ),
});

export default function EmptyState({ onPrompt }: { onPrompt: (t: string) => void }) {
  const { t } = useLocale();
  const samples = [t("sample.job"), t("sample.vehicle")];
  const icons = ["💼", "🚗"];
  return (
    <div className="relative py-10 md:py-12 text-center anim-rise">
      <div aria-hidden className="absolute -top-10 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-saffron/10 blur-3xl" />
      <div aria-hidden className="floaty absolute left-[12%] top-14 text-2xl opacity-25 select-none">📜</div>
      <div aria-hidden className="floaty absolute right-[12%] top-20 text-xl opacity-20 select-none" style={{ animationDelay: "-2.5s" }}>🪪</div>
      <div aria-hidden className="floaty absolute bottom-16 right-[18%] text-lg opacity-20 select-none" style={{ animationDelay: "-4s" }}>🛡️</div>

      <div className="relative">
        <div className="h-[240px] md:h-[280px] max-w-2xl mx-auto -mb-2">
          <GatewayScene />
        </div>

        <h2 className="font-display text-3xl md:text-4xl font-semibold text-indigo-ink tracking-tight">{t("empty.title")}</h2>
        <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto mt-3">{t("empty.body")}</p>

        <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-9">
          {samples.map((s, i) => (
            <button
              key={s}
              onClick={() => onPrompt(s)}
              className="card card-hover group flex items-center gap-3 p-4 text-left"
            >
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-saffron/10 to-gold/5 text-lg ring-1 ring-saffron/15">
                {icons[i]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-700 leading-snug">“{s}”</span>
              </span>
              <span aria-hidden className="text-slate-300 transition group-hover:text-saffron group-hover:translate-x-0.5">→</span>
            </button>
          ))}
        </div>

        <p className="mt-9 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          {t("empty.kbdHint")}
          <span className="kbd">⌘</span>
          <span className="kbd">K</span>
        </p>
      </div>
    </div>
  );
}
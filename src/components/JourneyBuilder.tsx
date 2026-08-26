"use client";

export const JOURNEY_BUILD_STAGES = 5;
export const JOURNEY_BUILD_STEP_MS = 480;

const STAGES = [
  { label: "Analyzing your situation" },
  {
    label: "Mapping relevant government services",
    pills: ["EPFO", "Income Tax", "RTO", "UIDAI", "DigiLocker", "State Schemes"],
  },
  { label: "Resolving dependencies between tasks", skeleton: true },
  { label: "Checking documents you already hold", sub: "via DigiLocker · with your consent" },
  { label: "Optimizing your journey graph" },
];

export default function JourneyBuilder({ stage }: { stage: number }) {
  const pct = Math.min(((stage + 1) / STAGES.length) * 100, 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[430px] flex flex-col">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full border-[3px] border-orange-500 border-t-transparent animate-spin" />
        <div>
          <h3 className="font-semibold text-slate-900">Building your journey…</h3>
          <p className="text-xs text-slate-500">matching your life event against 2,000+ government services</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-6 space-y-3.5 flex-1">
        {STAGES.map((st, i) => {
          const isDone = i < stage;
          const isActive = i === stage;
          return (
            <div key={st.label}>
              <div className="flex items-center gap-3">
                {isDone ? (
                  <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-500 text-white grid place-items-center text-[10px] font-bold stage-check">✓</span>
                ) : isActive ? (
                  <span className="w-5 h-5 shrink-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                ) : (
                  <span className="w-5 h-5 shrink-0 rounded-full border-2 border-slate-200" />
                )}
                <span className={`text-sm ${isDone ? "text-slate-600" : isActive ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                  {st.label}
                </span>
              </div>

              {/* department pills fly in during mapping */}
              {st.pills && stage >= 1 && (
                <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
                  {st.pills.map((p, pi) => (
                    <span
                      key={p}
                      className={`anim-pop text-[11px] font-medium px-2.5 py-1 rounded-full ${
                        stage >= 2 ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "shimmer text-transparent"
                      }`}
                      style={{ animationDelay: `${pi * 90}ms` }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* skeleton DAG appears while resolving dependencies */}
              {st.skeleton && stage >= 2 && (
                <div className="ml-8 mt-3 space-y-2">
                  <div className="flex gap-2">
                    {[0, 1].map((b) => (
                      <div key={b} className={`h-7 w-28 rounded-lg ${stage >= 3 ? "bg-slate-200" : "shimmer"}`} style={{ transitionDelay: `${b * 120}ms` }} />
                    ))}
                  </div>
                  <div className="text-slate-300 text-xs leading-none pl-12">↓</div>
                  <div className={`h-7 w-40 rounded-lg ${stage >= 3 ? "bg-slate-200" : "shimmer"}`} />
                </div>
              )}

              {st.sub && stage >= 3 && (
                <p className="ml-8 mt-1 text-[11px] text-emerald-600 font-medium">{st.sub}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

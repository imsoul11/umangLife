"use client";

import { useEffect, useMemo, useState } from "react";
import type { CitizenProfile, DigilockerDocument, LifeEventEntities, TaskInstance } from "@/lib/types";
import { resolveSource } from "@/lib/sources";
import { StatusBadge } from "./Dashboard";

type Values = Record<string, { value: string; source?: string }>;

const STEPS = ["Form", "Verify", "Submit"];
const FETCH_STAGES = [
  { label: "Connecting to department portal", ms: 750 },
  { label: "Fetching official application form", ms: 650 },
  { label: "Prefilling fields from your authorized data", ms: 850 },
];

const SUBMIT_STAGES = [
  "Encrypting & signing your documents…",
  "Uploading application to the department portal…",
  "Acknowledgment received — generating reference number…",
];

function sourceChip(source?: string): { label: string; cls: string } | null {
  if (!source) return null;
  if (source.startsWith("entity:")) return { label: "from your chat", cls: "bg-sky-100 text-sky-700" };
  if (source.startsWith("profile:")) return { label: "your profile", cls: "bg-sky-100 text-sky-700" };
  const dept = {
    aadhaar: "DigiLocker·UIDAI",
    pan: "DigiLocker·ITD",
    bank_passbook: "DigiLocker·Bank",
    dl: "DigiLocker·RTO",
    vehicle_rc: "DigiLocker·RTO",
    vehicle_insurance: "DigiLocker·Insurer",
  }[source.split(".")[0]];
  return dept ? { label: dept + " ✓", cls: "bg-emerald-100 text-emerald-700" } : null;
}

export default function TaskWizard({
  task,
  entities,
  docs,
  profile,
  savedDraft,
  skipFetch,
  onClose,
  onComplete,
  onDraftChange,
  onAskAi,
  onFetched,
}: {
  task: TaskInstance;
  entities: LifeEventEntities;
  docs: DigilockerDocument[];
  profile: CitizenProfile;
  /** previously typed values, so users can hop to chat and come back */
  savedDraft?: Values;
  /** form already fetched this session — skip the ceremony */
  skipFetch?: boolean;
  onClose: () => void;
  onComplete: (taskId: string, submitOnly: boolean, ref?: string) => void;
  onDraftChange?: (taskId: string, values: Values) => void;
  onAskAi?: (fieldLabel: string, taskTitle: string) => void;
  onFetched?: () => void;
}) {
  const ctx = useMemo(() => ({ docs, profile, entities }), [docs, profile, entities]);

  const [fetchStage, setFetchStage] = useState(skipFetch ? FETCH_STAGES.length : 0);
  useEffect(() => {
    if (fetchStage >= FETCH_STAGES.length) return;
    const next = fetchStage + 1;
    const t = setTimeout(() => {
      setFetchStage(next);
      if (next >= FETCH_STAGES.length) onFetched?.();
    }, FETCH_STAGES[fetchStage].ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire-once-per-fetch semantics
  }, [fetchStage]);
  const formReady = fetchStage >= FETCH_STAGES.length;

  // deterministic seed merged with any saved draft
  const seeded = useMemo(() => {
    const v: Values = {};
    for (const f of task.formFields ?? []) {
      if (f.source && f.type !== "select") {
        const val = resolveSource(f.source, ctx);
        if (val) v[f.id] = { value: val, source: f.source };
      }
    }
    for (const [id, val] of Object.entries(savedDraft ?? {})) v[id] = val;
    return v;
  }, [task, ctx, savedDraft]);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(seeded);
  const [declared, setDeclared] = useState<Record<string, boolean>>({});
  const [generatedRef, setGeneratedRef] = useState("");
  const [submitStage, setSubmitStage] = useState<number | null>(null);

  const fields = task.formFields ?? [];
  const prefilledCount = fields.filter((f) => values[f.id]?.source && values[f.id].source !== "you").length;
  const filledCount = fields.filter((f) => values[f.id]?.value || f.type === "select").length;
  const missingRequired = fields.filter((f) => f.required !== false && !values[f.id]?.value);

  function update(id: string, value: string) {
    setValues((v) => {
      const next = { ...v, [id]: { value, source: "you" } };
      onDraftChange?.(task.id, next);
      return next;
    });
  }

  function submit() {
    let ref: string | undefined;
    if (task.slaDays) {
      ref = `${task.service.slice(0, 2)}-${Math.floor(10000 + Math.random() * 89999)}`;
      setGeneratedRef(ref);
    }
    setSubmitStage(0);
    const tick = (i: number) => {
      if (i < SUBMIT_STAGES.length - 1) {
        setTimeout(() => {
          setSubmitStage(i + 1);
          tick(i + 1);
        }, 620);
      } else {
        setTimeout(() => {
          onComplete(task.id, Boolean(task.slaDays), ref);
          setStep(2);
          setSubmitStage(null);
        }, 700);
      }
    };
    tick(0);
  }

  const justSubmitted = step === 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden anim-pop" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{task.service.replace("_", " ")} · official application</p>
              <h3 className="font-semibold text-lg text-slate-900 leading-snug">{task.title}</h3>
            </div>
            <StatusBadge status={justSubmitted ? "done" : task.status} />
          </div>
          {!justSubmitted && (
            <div className="mt-3 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${i <= step && formReady ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-500"}`}>{i + 1}</span>
                  <span className={`text-xs ${i === step ? "text-slate-800 font-medium" : "text-slate-400"}`}>{s}</span>
                  {i < 2 && <span className="text-slate-300">→</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- FETCH SEQUENCE ---------- */}
        {!formReady ? (
          <div className="p-8 space-y-4 min-h-[280px]">
            {FETCH_STAGES.map((st, i) => (
              <div key={st.label} className="flex items-center gap-3 text-sm anim-rise" style={{ animationDelay: `${i * 120}ms` }}>
                {i < fetchStage ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white grid place-items-center text-[10px] stage-check">✓</span>
                ) : i === fetchStage ? (
                  <span className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-200" />
                )}
                <span className={i <= fetchStage ? "text-slate-700 font-medium" : "text-slate-400"}>{st.label}</span>
                {i === fetchStage && <span className="ml-auto text-xs text-slate-400">please wait…</span>}
              </div>
            ))}
            {fetchStage >= 2 && (
              <div className="pt-2 space-y-2">
                {[...Array(Math.min(prefilledCount || 3, 4))].map((_, i) => (
                  <div key={i} className="shimmer h-9 rounded-lg" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            )}
          </div>
        ) : justSubmitted ? (
          /* ---------- SUCCESS ---------- */
          <div className="p-8 text-center space-y-3 min-h-[240px] anim-pop">
            <div className="text-5xl">{task.slaDays ? "📨" : "✅"}</div>
            <h4 className="font-semibold text-xl text-slate-900">{task.slaDays ? "Application submitted" : "Completed"}</h4>
            {task.slaDays ? (
              <>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Track it under My Government Calendar — we&apos;ll alert you if processing exceeds the expected {task.slaDays} days.
                </p>
                {generatedRef && (
                  <div className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 font-mono text-base text-blue-800 tracking-wide">
                    {generatedRef}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-600">This unlocks the next steps in your journey.</p>
            )}
          </div>
        ) : step === 0 ? (
          /* ---------- FORM ---------- */
          <>
            <div className="px-6 pt-4">
              <p className="text-xs text-slate-400">
                Prefilled <b className="text-emerald-600">{prefilledCount}</b> of {fields.length} fields from your authorized documents.
                Fields with a dashed border need your input.
              </p>
            </div>
            <div className="px-6 py-3 space-y-3 max-h-[52vh] overflow-y-auto">
              {fields.map((f, idx) => {
                const entry = values[f.id];
                const chip = sourceChip(entry?.source ?? f.source);
                const isPrefilled = entry?.source && entry.source !== "you";
                const needsInput = !entry?.value;
                return (
                  <div key={f.id} className="anim-rise" style={{ animationDelay: `${idx * 45}ms` }}>
                    <label className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600 mb-1">
                      <span>{f.label}{f.required !== false && <span className="text-red-400"> *</span>}</span>
                      {chip && <span className={`px-1.5 py-0.5 rounded text-[10px] ${chip.cls}`}>{chip.label}</span>}
                    </label>
                    {f.type === "select" ? (
                      <select
                        value={entry?.value ?? ""}
                        onChange={(e) => update(f.id, e.target.value)}
                        className={`w-full text-sm px-3 py-2 rounded-lg border focus:outline-none ${
                          isPrefilled ? "border-l-4 border-l-emerald-400 border-slate-200 bg-emerald-50/30" : needsInput ? "border-dashed border-amber-300 bg-amber-50/30" : "border-slate-200"
                        } focus:border-orange-500`}
                      >
                        <option value="">Select…</option>
                        {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        value={entry?.value ?? ""}
                        placeholder={needsInput && f.required !== false ? "Required — type here" : "Optional"}
                        onChange={(e) => update(f.id, e.target.value)}
                        className={`w-full text-sm px-3 py-2 rounded-lg border focus:outline-none ${
                          isPrefilled ? "border-l-4 border-l-emerald-400 border-slate-200 bg-emerald-50/30" : needsInput && f.required !== false ? "border-dashed border-amber-300 bg-amber-50/30" : "border-slate-200"
                        } focus:border-orange-500`}
                      />
                    )}
                    {needsInput && f.required !== false && (
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[11px] text-slate-400">✍️ Not on file — please enter manually</p>
                        {onAskAi && (
                          <button
                            onClick={() => {
                              onDraftChange?.(task.id, values);
                              onAskAi(f.label, task.title);
                            }}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                          >
                            🤖 Ask AI where to find it
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ---------- VERIFY ---------- */
          <>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 mx-6 mt-4">
              {fields.map((f) => (
                <div key={f.id} className="flex justify-between gap-4 px-3.5 py-2.5 text-sm">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="font-medium text-slate-800 text-right truncate">{values[f.id]?.value || <span className="text-red-400">missing</span>}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pt-3 pb-1 space-y-2">
              {[
                "I verify that the above details match my official documents.",
                `I consent to sharing these verified fields with ${task.service.replace("_", " ")} for this application only.`,
              ].map((d, i) => (
                <label key={i} className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!declared[i]}
                    onChange={(e) => setDeclared((x) => ({ ...x, [i]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-orange-600"
                  />
                  {d}
                </label>
              ))}
            </div>
          </>
        )}

        {/* submit staging overlay inside footer area */}
        {submitStage !== null && (
          <div className="px-6 py-4 border-t border-slate-100 space-y-2">
            {SUBMIT_STAGES.map((st, i) => (
              <div key={st} className="flex items-center gap-2.5 text-sm">
                {i < submitStage ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white grid place-items-center text-[9px] stage-check">✓</span>
                ) : i === submitStage ? (
                  <span className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-200" />
                )}
                <span className={i <= submitStage ? "text-slate-700" : "text-slate-400"}>{st}</span>
              </div>
            ))}
          </div>
        )}

        {/* footer actions */}
        {submitStage === null && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
            {!justSubmitted && formReady && (
              <>
                {step === 0 && (
                  <button
                    onClick={() => setStep(1)}
                    disabled={missingRequired.length > 0}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition"
                  >
                    {missingRequired.length > 0
                      ? `Fill ${missingRequired.length} remaining field${missingRequired.length !== 1 ? "s" : ""} to continue`
                      : `Review & verify (${filledCount}/${fields.length})`}
                  </button>
                )}
                {step === 1 && (
                  <>
                    <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700">← Edit</button>
                    <button
                      onClick={submit}
                      disabled={!declared[0] || !declared[1]}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition"
                    >
                      {task.slaDays ? `🚀 Submit application · ${task.slaDays}-day SLA` : "🚀 Confirm & Continue"}
                    </button>
                  </>
                )}
              </>
            )}
            {justSubmitted && (
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition anim-pop">
                Back to journey graph →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { CitizenProfile, DigilockerDocument, LifeEventEntities, TaskInstance } from "@/lib/types";
import { resolveSource } from "@/lib/sources";
import { StatusBadge } from "./Dashboard";

type Values = Record<string, { value: string; source?: string }>;

const STEPS = ["Form", "Verify", "Submit"];

function sourceChip(source?: string): { label: string; cls: string } | null {
  if (!source) return null;
  if (source === "gemini") return { label: "✨ matched by Gemini", cls: "bg-purple-100 text-purple-700" };
  if (source.startsWith("entity:")) return { label: "from your chat", cls: "bg-sky-100 text-sky-700" };
  if (source.startsWith("profile:")) return { label: "your profile", cls: "bg-sky-100 text-sky-700" };
  const dept = { aadhaar: "DigiLocker·UIDAI", pan: "DigiLocker·ITD", bank_passbook: "DigiLocker·Bank", dl: "DigiLocker·RTO", vehicle_rc: "DigiLocker·RTO" }[source.split(".")[0]];
  return dept ? { label: dept + " ✓", cls: "bg-emerald-100 text-emerald-700" } : null;
}

export default function TaskWizard({
  task,
  entities,
  docs,
  profile,
  onClose,
  onComplete,
}: {
  task: TaskInstance;
  entities: LifeEventEntities;
  docs: DigilockerDocument[];
  profile: CitizenProfile;
  onClose: () => void;
  onComplete: (taskId: string, submitOnly: boolean) => void;
}) {
  const ctx = useMemo(() => ({ docs, profile, entities }), [docs, profile, entities]);

  // seed deterministic values
  const initial = useMemo(() => {
    const v: Values = {};
    for (const f of task.formFields ?? []) {
      if (f.source && f.type !== "select") {
        const val = resolveSource(f.source, ctx);
        if (val) v[f.id] = { value: val, source: f.source };
      }
    }
    return v;
  }, [task, ctx]);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(initial);
  const [autofilling, setAutofilling] = useState(false);
  const [declared, setDeclared] = useState<Record<string, boolean>>({});
  const [generatedRef, setGeneratedRef] = useState<string>("");

  const fields = task.formFields ?? [];
  const filledCount = fields.filter((f) => values[f.id]?.value || f.type === "select").length;
  const missingRequired = fields.filter((f) => f.required !== false && !values[f.id]?.value);

  async function autofill() {
    setAutofilling(true);
    try {
      const res = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: task.title, fields, context: ctx }),
      });
      const data = await res.json();
      setValues((prev) => {
        const next = { ...prev };
        for (const [id, v] of Object.entries(data.values ?? {}) as [string, { value: string; source: string }][]) {
          if (!next[id]) next[id] = { value: v.value, source: v.source };
        }
        return next;
      });
    } finally {
      setAutofilling(false);
    }
  }

  function submit() {
    if (task.slaDays) {
      setGeneratedRef(`${task.service.slice(0, 2)}-${Math.floor(10000 + Math.random() * 89999)}`);
    }
    onComplete(task.id, Boolean(task.slaDays));
    setStep(2);
  }

  const justSubmitted = step === 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                  <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${i <= step ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-500"}`}>{i + 1}</span>
                  <span className={`text-xs ${i === step ? "text-slate-800 font-medium" : "text-slate-400"}`}>{s}</span>
                  {i < 2 && <span className="text-slate-300">→</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {justSubmitted ? (
            <div className="text-center space-y-3 py-6">
              <div className="text-4xl">{task.slaDays ? "📨" : "✅"}</div>
              <h4 className="font-semibold text-slate-900">{task.slaDays ? "Application submitted" : "Completed"}</h4>
              {task.slaDays ? (
                <>
                  <p className="text-sm text-slate-600">Track it under My Government Calendar — we&apos;ll alert you if processing exceeds the expected {task.slaDays} days.</p>
                  {generatedRef && (
                    <div className="inline-block mt-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 font-mono text-sm text-blue-800">
                      {generatedRef}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-600">This unlocks the next steps in your journey.</p>
              )}
            </div>
          ) : step === 0 ? (
            <>
              <p className="text-sm text-slate-500">
                This is what you&apos;d fill on the department portal. We prefill what you&apos;ve authorized — check each value before submitting.
              </p>
              <div className="space-y-3">
                {fields.map((f) => {
                  const entry = values[f.id];
                  const chip = sourceChip(entry?.source ?? f.source);
                  return (
                    <div key={f.id}>
                      <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>{f.label}{f.required !== false && <span className="text-red-400"> *</span>}</span>
                        {chip && <span className={`px-1.5 py-0.5 rounded text-[10px] ${chip.cls}`}>{chip.label}</span>}
                      </label>
                      {f.type === "select" ? (
                        <select
                          value={entry?.value ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [f.id]: { value: e.target.value, source: "you" } }))}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="">Select…</option>
                          {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          value={entry?.value ?? ""}
                          placeholder={f.required !== false ? "Type here" : "Optional"}
                          onChange={(e) => setValues((v) => ({ ...v, [f.id]: { value: e.target.value, source: "you" } }))}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                {fields.map((f) => (
                  <div key={f.id} className="flex justify-between gap-4 px-3.5 py-2.5 text-sm">
                    <span className="text-slate-500">{f.label}</span>
                    <span className="font-medium text-slate-800 text-right truncate">{values[f.id]?.value || <span className="text-red-400">missing</span>}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-1">
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
        </div>

        {/* footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
          {!justSubmitted && (
            <>
              {step === 0 && (
                <>
                  <button onClick={autofill} disabled={autofilling || missingRequired.length === 0}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition">
                    {autofilling ? "✨ Matching your data…" : `✨ Autofill remaining (${missingRequired.length}) with Gemini`}
                  </button>
                  <button onClick={() => setStep(1)} disabled={missingRequired.length > 0}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition">
                    Review & verify ({filledCount}/{fields.length})
                  </button>
                </>
              )}
              {step === 1 && (
                <>
                  <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700">← Edit</button>
                  <button onClick={submit} disabled={!declared[0] || !declared[1]}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition">
                    {task.slaDays ? `🚀 Submit application · ${task.slaDays}-day SLA` : "🚀 Confirm & Continue"}
                  </button>
                </>
              )}
            </>
          )}
          {justSubmitted && (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition">
              Back to journey graph
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

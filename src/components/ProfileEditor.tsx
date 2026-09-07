"use client";

import { useState } from "react";
import type { CitizenProfile, DocType } from "@/lib/types";
import { useJourneys } from "@/components/JourneyProvider";

const ALL_DOC_TYPES: { type: DocType; label: string }[] = [
  { type: "AADHAAR", label: "Aadhaar" },
  { type: "PAN", label: "PAN card" },
  { type: "BANK_PASSBOOK", label: "Bank passbook" },
  { type: "ADDRESS_PROOF", label: "Address proof" },
  { type: "EMPLOYER_DETAILS", label: "Employer details" },
  { type: "DL", label: "Driving licence" },
  { type: "VEHICLE_RC", label: "Vehicle RC" },
  { type: "VEHICLE_INSURANCE", label: "Vehicle insurance" },
  { type: "PUC", label: "PUC certificate" },
];

const OCCUPATIONS: CitizenProfile["occupation"][] = ["salaried", "self_employed", "student", "farmer", "unemployed"];

const inputCls = "px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export default function ProfileEditor({ onClose }: { onClose: () => void }) {
  const { profile, setProfile, docs, setDocs } = useJourneys();
  const [newDocType, setNewDocType] = useState<DocType | "">("");
  const [newDocIssuer, setNewDocIssuer] = useState("");

  function patch(p: Partial<CitizenProfile>) {
    setProfile((prev) => ({ ...prev, ...p }));
  }

  const present = new Set(docs.map((d) => d.type));
  const addable = ALL_DOC_TYPES.filter((t) => !present.has(t.type));

  function addDoc() {
    if (!newDocType) return;
    setDocs((prev) => [
      ...prev,
      { type: newDocType, issuer: newDocIssuer.trim() || "Self uploaded", verified: true, fields: {} },
    ]);
    setNewDocType("");
    setNewDocIssuer("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-display font-semibold text-indigo-ink">Profile & DigiLocker</h2>
            <p className="text-[11px] text-slate-500">Edits feed the eligibility engine, task gating and form autofill instantly.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Citizen profile</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Name</span>
                <input className={`${inputCls} w-full`} value={profile.name} onChange={(e) => patch({ name: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">State</span>
                <input className={`${inputCls} w-full`} value={profile.state} onChange={(e) => patch({ state: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Occupation</span>
                <select className={`${inputCls} w-full`} value={profile.occupation} onChange={(e) => patch({ occupation: e.target.value as CitizenProfile["occupation"] })}>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>{o.replace("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Annual income (₹)</span>
                <input type="number" className={`${inputCls} w-full`} value={profile.annualIncomeInr} onChange={(e) => patch({ annualIncomeInr: Number(e.target.value) || 0 })} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["married", "Married"],
                ["paysIncomeTax", "Pays income tax"],
                ["hasDisability", "Has disability"],
                ["hasDrivingLicence", "Has driving licence"],
                ["ownsVehicle", "Owns a vehicle"],
              ] as [keyof CitizenProfile, string][]).map(([key, label]) => (
                <label key={String(key)} className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(profile[key])}
                    onChange={(e) => patch({ [key]: e.target.checked } as Partial<CitizenProfile>)}
                    className="accent-orange-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">DigiLocker documents ({docs.length})</h3>
            <ul className="space-y-1.5">
              {docs.map((d) => (
                <li key={d.type} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {ALL_DOC_TYPES.find((t) => t.type === d.type)?.label ?? d.type}
                      {d.verified && <span className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">verified</span>}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{d.issuer}</p>
                  </div>
                  <button
                    onClick={() => setDocs((prev) => prev.filter((x) => x.type !== d.type))}
                    className="text-xs text-slate-400 hover:text-red-600 underline shrink-0"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
            {addable.length > 0 && (
              <div className="flex gap-2 items-end pt-1">
                <label className="space-y-1 flex-1">
                  <span className="text-xs font-medium text-slate-600">Add document</span>
                  <select className={`${inputCls} w-full`} value={newDocType} onChange={(e) => setNewDocType(e.target.value as DocType)}>
                    <option value="">Select type…</option>
                    {addable.map((t) => (
                      <option key={t.type} value={t.type}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 flex-1">
                  <span className="text-xs font-medium text-slate-600">Issuer (optional)</span>
                  <input className={`${inputCls} w-full`} placeholder="Self uploaded" value={newDocIssuer} onChange={(e) => setNewDocIssuer(e.target.value)} />
                </label>
                <button
                  onClick={addDoc}
                  disabled={!newDocType}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-orange-700 transition"
                >
                  Add
                </button>
              </div>
            )}
            <p className="text-[11px] text-slate-400">Tip: add “Address proof” or “PUC certificate” to unlock tasks that are currently blocked on missing documents.</p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gradient-to-br from-saffron to-saffron-deep text-white text-sm font-semibold shadow-md hover:opacity-95 transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Transparency page — the brief rewards honesty about what is real,
 * what is mocked, and how this could ever touch production safely.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen relative z-[1]">
      <header className="sticky top-0 z-40 border-b border-indigo-ink/10 bg-white/70 backdrop-blur-lg px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-deep text-white grid place-items-center font-bold shadow-md">
            <span className="font-display text-lg leading-none">उ</span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-indigo-ink text-lg leading-tight tracking-tight">About this prototype</h1>
            <p className="text-[11px] text-slate-500">What is real, what is mocked, how it could work safely at scale</p>
          </div>
        </div>
        <a href="/" className="text-sm text-saffron font-medium hover:underline">← Back to journeys</a>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-6 space-y-6">
        {/* problem */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-lg font-semibold text-indigo-ink">The problem we&apos;re solving</h2>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            Every life event in India — changing jobs, buying a vehicle or home, having a child, getting married —
            triggers a <b>spread of government obligations</b> across EPFO, Income-Tax, RTOs, UIDAI and state departments.
            Today citizens must <b>know the service names themselves</b>, find portals, order steps on their own,
            and re-enter the same documents everywhere.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            This prototype asks <b>“What happened in your life?”</b> and turns the answer into one ordered,
            dependency-aware journey of tasks — with documents autofilled from consented data, deadlines on a
            calendar, and an escalation path when a department goes silent.
          </p>
        </section>

        {/* journey */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-lg font-semibold text-indigo-ink">The complete citizen journey</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600">
            {[
              "You describe a life event in plain words (“I bought a second-hand car yesterday”).",
              "The assistant detects the event and builds a task graph — in dependency order, with parallel lanes, and only tasks relevant to YOU (vehicle work hidden if you don’t own a vehicle).",
              "Every task carries an official application form, prefilled instantly from your authorized documents (name, DOB, PAN, bank, RC…). Missing fields are visibly marked for manual entry.",
              "You verify, consent, and submit — receiving a reference number. SLA deadlines land on the Government Calendar.",
              "If an application drifts past its expected decision date, one click drafts a fully-contextual grievance (references, department, dates) — ready to file, nothing re-typed.",
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-saffron/15 text-saffron inline-grid place-items-center text-[11px] font-bold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        {/* real vs mocked */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-lg font-semibold text-indigo-ink">What is real vs. what is mocked</h2>
          <p className="text-xs text-slate-500 mt-1">You should never be able to guess which is which from the interface — hence this page.</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">✓ Real — the product logic</h3>
              <ul className="mt-2 space-y-1 text-xs text-emerald-900/80">
                <li>Life-event detection &amp; entity extraction</li>
                <li>Dependency-aware task graphs (DAG), validated against real process rules</li>
                <li>Deterministic eligibility engine with explainable “why”</li>
                <li>Urgency scoring, SLA calendar and overdue detection</li>
                <li>The citizen consent + verify flow</li>
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">🟡 Mocked — the outside systems</h3>
              <ul className="mt-2 space-y-1 text-xs text-amber-900/80">
                <li>DigiLocker document store (synthetic citizen docs)</li>
                <li>EPFO / RTO / Income-Tax / state portals &amp; statuses</li>
                <li>OTP, payments and e-sign steps</li>
                <li>CPGRAMS grievance filing (returns a mock reference)</li>
              </ul>
              <p className="mt-2 text-[11px] text-amber-800/70">No real Aadhaar/PAN/OTP/payment/health data is used anywhere. Offerings are built with mock data and are clearly not an official government product.</p>
            </div>
          </div>
        </section>

        {/* consent & safety */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-lg font-semibold text-indigo-ink">Built on consent, ready to scale</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><span>🔐</span> Documents are pulled only per-purpose, after explicit consent, and only for the fields that form needs — mirroring the existing DigiLocker consent model.</li>
            <li className="flex gap-2"><span>🔁</span> Exchanging DigiLocker/EPFO/CP Data for their real, documented APIs is a drop-in: the engines only speak to lightweight interfaces, so a production adapter swaps in without rewriting the journey logic.</li>
            <li className="flex gap-2"><span>🧩</span> No LLM decides what you&apos;re owed. Every journey, dependency, eligibility and grievance is generated from curated, versioned, human-verified rules — the LLM only understands language and routes to those rules.</li>
          </ul>
        </section>

        {/* stack */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-lg font-semibold text-indigo-ink">How it was built</h2>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            The task-graph engine, journey templates, eligibility matcher, calendar and all mock integrations were built
            with <b>Codex</b> (an OpenAI agent). The two conversational moments — detecting a life event from free text and
            generating grounded grievance text — are driven by a generative model (Gemini) through its OpenAI-compatible
            API. Department data and systems (DigiLocker, EPFO, CPGRAMS) are simulated; the pattern they follow mirrors
            how the real integrations dock in.
          </p>
        </section>
      </main>
    </div>
  );
}
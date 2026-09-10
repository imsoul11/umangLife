"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

const inputCls =
  "px-3 py-2 rounded-xl border border-slate-300 text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export default function AuthMenu() {
  const { user, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: mode === "register" ? name : undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      window.location.reload(); // auth cookie set — reload so data loads under the account
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2 text-[13px]">
        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-semibold" title={user.email}>
          {(user.name ?? user.email)[0].toUpperCase()}
        </span>
        <button onClick={() => void signOut()} className="text-xs text-slate-400 hover:text-slate-600 underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-medium text-slate-600 hover:text-saffron border border-slate-200 rounded-full px-3.5 py-1.5 hover:border-saffron/50 transition"
      >
        Sign in
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-display font-semibold text-indigo-ink">{mode === "login" ? "Sign in" : "Create account"}</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
            </div>
            <form
              className="px-6 py-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) void submit();
              }}
            >
              {mode === "register" && (
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600">Name (optional)</span>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
              )}
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Email</span>
                <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Password{mode === "register" ? " (min 8 chars)" : ""}</span>
                <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : undefined} />
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-gradient-to-br from-saffron to-saffron-deep text-white text-sm font-semibold shadow-md hover:opacity-95 transition disabled:opacity-50">
                {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
              <p className="text-xs text-slate-500 text-center">
                {mode === "login" ? (
                  <>No account? <button type="button" onClick={() => { setMode("register"); setError(null); }} className="text-orange-600 underline">Create one</button></>
                ) : (
                  <>Already have one? <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-orange-600 underline">Sign in</button></>
                )}
              </p>
              <p className="text-[11px] text-slate-400 text-center">Your current journey data moves into your account automatically.</p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

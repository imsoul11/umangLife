"use client";

import type { Journey } from "@/lib/types";

export default function ProgressCard({ journey, progress, done, total }: { journey: Journey; progress: number; done: number; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="text-3xl">{journey.emoji}</div>
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-slate-900">{journey.title}</h2>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-slate-900">{done}/{total}</p>
        <p className="text-xs text-slate-500">completed</p>
      </div>
    </div>
  );
}

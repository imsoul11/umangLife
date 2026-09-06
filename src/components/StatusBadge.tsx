"use client";

import type { TaskInstance } from "@/lib/types";

export default function StatusBadge({ status }: { status: TaskInstance["status"] }) {
  const map = {
    locked: ["🔒", "bg-slate-100 text-slate-500"],
    ready: ["▶", "bg-blue-100 text-blue-700"],
    in_progress: ["⏳", "bg-yellow-100 text-yellow-700"],
    action_required: ["⚠️", "bg-amber-100 text-amber-800"],
    done: ["✓", "bg-emerald-100 text-emerald-700"],
  } as const;
  const [icon, cls] = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {icon} {status.replace("_", " ")}
    </span>
  );
}

import type { TaskStatus } from "@/lib/types";

/**
 * Shared task-status styling — the single source used by the status badge,
 * graph nodes and list rows, so the three views never drift apart.
 */
export const TASK_BADGE: Record<TaskStatus, readonly [string, string]> = {
  locked: ["🔒", "bg-slate-100 text-slate-500"],
  ready: ["▶", "bg-blue-100 text-blue-700"],
  in_progress: ["⏳", "bg-yellow-100 text-yellow-700"],
  action_required: ["⚠️", "bg-amber-100 text-amber-800"],
  done: ["✓", "bg-emerald-100 text-emerald-700"],
};

export const TASK_NODE_STYLE: Record<TaskStatus, string> = {
  locked: "border-slate-200 bg-slate-50 border-dashed opacity-70",
  ready: "border-orange-500 bg-white shadow-md shadow-orange-100 ring-2 ring-orange-200 animate-pulse-border",
  action_required: "border-amber-400 bg-amber-50",
  in_progress: "border-yellow-400 bg-yellow-50",
  done: "border-emerald-400 bg-emerald-50",
};

export const TASK_ROW_STYLE: Record<TaskStatus, string> = {
  locked: "border-dashed border-slate-200 bg-slate-100/60 opacity-70 cursor-not-allowed",
  ready: "border-orange-400 bg-white shadow-sm hover:shadow-md cursor-pointer",
  action_required: "border-amber-300 bg-amber-50/60 cursor-pointer",
  in_progress: "border-yellow-300 bg-yellow-50/60 cursor-pointer",
  done: "border-emerald-200 bg-emerald-50/60",
};

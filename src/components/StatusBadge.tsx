"use client";

import type { TaskInstance } from "@/lib/types";
import { TASK_BADGE } from "@/lib/taskStyle";

export default function StatusBadge({ status }: { status: TaskInstance["status"] }) {
  const [icon, cls] = TASK_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {icon} {status.replace("_", " ")}
    </span>
  );
}

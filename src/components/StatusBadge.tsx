"use client";

import type { TaskInstance } from "@/lib/types";
import { TASK_BADGE } from "@/lib/taskStyle";
import { useLocale } from "./LocaleProvider";

export default function StatusBadge({ status }: { status: TaskInstance["status"] }) {
  const { t } = useLocale();
  const [icon, cls] = TASK_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {icon} {t(`status.${status}`)}
    </span>
  );
}

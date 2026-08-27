import type { TaskDef } from "@/lib/types";
import { JOB_CHANGE_TASKS } from "./job-change";
import { VEHICLE_PURCHASE_TASKS } from "./vehicle-purchase";
import { NEW_CHILD_TASKS } from "./new-child";
import { HOME_PURCHASE_TASKS } from "./home-purchase";
import { MARRIAGE_TASKS } from "./marriage";

/** Template registry — the ONLY place that maps life events to their DAG. */
export const JOURNEY_TEMPLATES: Record<string, TaskDef[]> = {
  JOB_CHANGE: JOB_CHANGE_TASKS,
  VEHICLE_PURCHASE: VEHICLE_PURCHASE_TASKS,
  NEW_CHILD: NEW_CHILD_TASKS,
  HOME_PURCHASE: HOME_PURCHASE_TASKS,
  MARRIAGE: MARRIAGE_TASKS,
};

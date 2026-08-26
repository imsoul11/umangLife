/* ============================================================
   FROZEN CONTRACT — do not change without telling the team.
   Engines (L3/L4) produce these. UI (L6) consumes these.
   ============================================================ */

export type ServiceId =
  | "DIGILOCKER"
  | "EPFO"
  | "INCOME_TAX"
  | "UIDAI"
  | "STATE"
  | "TRANSPORT";

export type LifeEventId = "JOB_CHANGE" | "NEW_CHILD" | "VEHICLE_PURCHASE" | "HOME_PURCHASE";

export type TaskStatus = "locked" | "ready" | "in_progress" | "action_required" | "done";

/** Static definition of a task inside a life-event DAG (authored data). */
export interface TaskDef {
  id: string;
  title: string;
  description: string;
  service: ServiceId;
  /** ids of TaskDefs that must complete before this unlocks */
  dependsOn: string[];
  /** document types the citizen must have (checked against digilocker mock) */
  requiredDocs?: DocType[];
  /** expected processing days once submitted — drives calendar + exception detection */
  slaDays?: number;
  /** fields we can prefill from authorized sources */
  autofillFields?: AutofillFieldSpec[];
  /** slug into the knowledge base for contextual Q&A */
  kbSlug?: string;
  /**
   * Profile predicates that must hold for this task to be relevant at all
   * (e.g. vehicle tasks only for vehicle owners). Unmet => task is excluded
   * from the journey entirely. Same predicate language as the eligibility engine.
   */
  requiresProfile?: Criterion[];
  urgency?: UrgencyHint;
  /** the mock government application form shown in the task wizard */
  formFields?: FormField[];
}

export type DocType =
  | "AADHAAR"
  | "PAN"
  | "BANK_PASSBOOK"
  | "ADDRESS_PROOF"
  | "EMPLOYER_DETAILS"
  | "DL"
  | "VEHICLE_RC"
  | "VEHICLE_INSURANCE"
  | "PUC";

/** Why a task matters NOW — drives deterministic prioritization. */
export interface UrgencyHint {
  kind: "legal_deadline" | "money_at_risk" | "gateway" | "civic";
  /** human-readable cost of delaying, shown verbatim in UI */
  consequence: string;
  /** static weight 0-100; dynamic state adds on top */
  base: number;
}

/** One field on the mock government application form for a task. */
export interface FormField {
  id: string;
  label: string;
  type?: "text" | "select";
  options?: string[];
  required?: boolean;
  /**
   * Deterministic prefill source:
   *   "<doctype>.<field>" e.g. "aadhaar.name"
   *   "entity:<key>"      e.g. "entity:employerName" (from chat extraction)
   *   "profile:<key>"     e.g. "profile:state"
   */
  source?: string;
}

export interface AutofillFieldSpec {
  /** form field name shown to user */
  field: string;
  /** where the value comes from */
  source: `${DocLower}.${string}` | "profile";
}

type DocLower = Lowercase<DocType>;

/** A task inside a live journey — definition + runtime state. */
export interface TaskInstance extends TaskDef {
  status: TaskStatus;
  completedAt?: string;
  submittedAt?: string;
  /** e.g. "PF-12345" — stands in for applications.external_reference */
  applicationRef?: string;
}

/** Extracted facts from the user's chat utterance. */
export interface LifeEventEntities {
  fromState?: string;
  toState?: string;
  employerName?: string;
  eventDate?: string;
  [key: string]: string | undefined;
}

export interface Journey {
  id: string;
  lifeEvent: LifeEventId;
  title: string;
  emoji: string;
  createdAt: string;
  entities: LifeEventEntities;
  tasks: TaskInstance[];
}

/* ---------------- Profile & Benefits ---------------- */

export interface CitizenProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  state: string;
  occupation: "salaried" | "self_employed" | "student" | "farmer" | "unemployed";
  annualIncomeInr: number;
  married: boolean;
  children: { age: number; gender: "male" | "female" }[];
  hasDisability: boolean;
  paysIncomeTax: boolean;
  /** optional facts that gate conditional tasks */
  hasDrivingLicence?: boolean;
  ownsVehicle?: boolean;
}

export type PredicateOp = "eq" | "neq" | "gte" | "lte" | "in" | "exists";

/** One machine-checkable eligibility rule with a human-readable label for the "why". */
export interface Criterion {
  label: string;
  field: string; // dot-path into CitizenProfile, e.g. "children.length", "state"
  op: PredicateOp;
  value: unknown;
}

export interface Scheme {
  id: string;
  name: string;
  department: string;
  level: "central" | "state";
  /** null = any state */
  state?: string;
  benefits: string[];
  criteria: Criterion[];
  sourceUrl: string;
  lastUpdated: string; // ISO date — shown in citations
}

export interface SchemeMatch {
  scheme: Scheme;
  eligible: boolean;
  matchedWhy: string[];
  unmet: string[];
  /** matched / total criteria, 0..1 — sort key for display */
  score: number;
}

/* ---------------- Knowledge base ---------------- */

export interface KbTopic {
  slug: string;
  title: string;
  department: string;
  lastUpdated: string;
  /** which journeys this topic belongs to — enables filter()-style routing */
  lifeEvents: LifeEventId[];
  keywords: string[];
  content: string;
}

/* ---------------- Chat & API ---------------- */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
  /** action chips attached to assistant messages */
  actions?: ChatAction[];
}

/** POST /api/chat request body */
export interface ChatRequest {
  message: string;
  /** ALL of the user's journeys — enables dedupe + cross-journey recall */
  journeys?: Journey[];
  profile: CitizenProfile;
  history: ChatMessage[];
}

/** POST /api/chat response — exactly one of the branches fills its payload. */
export interface ChatResponse {
  reply: string;
  /** set when the utterance was detected as a life event */
  detection?: {
    lifeEvent: LifeEventId;
    entities: LifeEventEntities;
    journey: Journey;
  };
  /** updated tasks when user completed/advanced something via chat */
  journeyUpdate?: Journey;
  /** tappable action chips rendered under the assistant message */
  actions?: ChatAction[];
}

/** A proposed user action attached to an assistant message. Server-validated. */
export interface ChatAction {
  taskId: string;
  kind: "open_form" | "mark_done";
  label: string;
}

/** POST /api/journey/[id]/complete — mark task done, get recomputed graph */
export interface CompleteTaskRequest {
  taskId: string;
}

/* ---------------- Mock integrations ---------------- */

export interface DigilockerDocument {
  type: DocType;
  issuer: string;
  verified: boolean;
  fields: Record<string, string>;
}

export interface CalendarEntry {
  id: string;
  date: string; // ISO
  title: string;
  reason: "sla_deadline" | "renewal" | "followup";
  relatedTaskId?: string;
  severity: "info" | "warning" | "urgent";
}

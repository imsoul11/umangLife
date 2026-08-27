import type { TaskDef } from "@/lib/types";

/**
 * NEW_CHILD — birth journey.
 * Legal anchor: birth registration within 21 days (RBD Act 1969 §13(1))
 * is free; beyond 21 days fees kick in, beyond 30 days an affidavit +
 * registrar permission, beyond 1 year a magistrate order. Everything
 * downstream (child Aadhaar, ration card, maternity benefit) waits on
 * the registered birth certificate.
 */
export const NEW_CHILD_TASKS: TaskDef[] = [
  {
    id: "verify-identity",
    title: "Verify parents' identity",
    description:
      "DigiLocker e-KYC for both parents — the birth-registration form needs your Aadhaar and, ideally, your marriage certificate.",
    service: "DIGILOCKER",
    dependsOn: [],
    requiredDocs: ["AADHAAR"],
    autofillFields: [
      { field: "Parent 1 Name", source: "aadhaar.name" },
      { field: "Date of Birth", source: "aadhaar.dob" },
      { field: "Address", source: "aadhaar.address" },
    ],
    formFields: [
      { id: "parent1Name", label: "Parent 1 name (as per Aadhaar)", required: true, source: "aadhaar.name" },
      { id: "parent2Name", label: "Parent 2 name", required: true },
      { id: "address", label: "Address", required: true, source: "aadhaar.address" },
    ],
    kbSlug: "birth-registration",
  },
  {
    id: "apply-birth-registration",
    title: "Register the birth within 21 days",
    description:
      "Form 1 via the municipal registrar or the hospital's auto-filing. Free within 21 days of birth; 21–30d attracts a late fee, 30d–1yr needs an affidavit, beyond a year a magistrate order.",
    service: "STATE",
    dependsOn: ["verify-identity"],
    slaDays: 7,
    urgency: {
      kind: "legal_deadline",
      consequence: "Free within 21 days; delay snowballs into late fees, affidavits, and finally a magistrate order",
      base: 90,
    },
    formFields: [
      { id: "childName", label: "Child's name", required: true },
      { id: "birthDate", label: "Date & time of birth", required: true },
      { id: "birthPlace", label: "Place of birth (hospital / home)", required: true },
      { id: "parentsMarried", label: "Parents' marriage certificate available?", type: "select", options: ["Yes", "No — affidavit instead"], required: true },
    ],
    kbSlug: "birth-registration",
  },
  {
    id: "child-aadhaar",
    title: "Enrol child for Baal Aadhaar",
    description:
      "Aadhaar for a child under 5 (no biometrics). Needs the birth certificate; biometrics capture at age 5. Portable ID for school and bank accounts.",
    service: "UIDAI",
    dependsOn: ["apply-birth-registration"],
    urgency: { kind: "civic", consequence: "The child's foundational ID for school, bank, and scheme applications", base: 35 },
    formFields: [
      { id: "childName", label: "Child name (as per birth certificate)", required: true },
      { id: "birthCertRef", label: "Birth certificate ref", required: true },
      { id: "centre", label: "Aadhaar enrolment centre", required: false },
    ],
    kbSlug: "birth-registration",
  },
  {
    id: "ration-add-child",
    title: "Add newborn to ration card",
    description:
      "Birth certificate (and child's Aadhaar where available) enables adding the child as a household member to keep food subsidies and household benefits correct.",
    service: "STATE",
    dependsOn: ["apply-birth-registration"],
    urgency: { kind: "civic", consequence: "Subsidised food quota and household benefits stay correct", base: 35 },
    formFields: [
      { id: "childName", label: "Child name", required: true },
      { id: "rationCardNo", label: "Ration card number", required: true },
      { id: "birthCertRef", label: "Birth certificate ref", required: true },
    ],
    kbSlug: "birth-registration",
  },
  {
    id: "maternity-benefit-claim",
    title: "Claim maternity benefit (PMMV / state)",
    description:
      "Pradhan Mantri Matru Vandana Yojana ₹5,000 for the first living child — conditional on registration, vaccination milestones, and state rules. Similar state top-ups exist.",
    service: "STATE",
    dependsOn: ["apply-birth-registration"],
    requiresProfile: [
      { label: "Claimant is the mother", field: "gender", op: "eq", value: "female" },
      { label: "Has a child under 1", field: "youngestChildAge", op: "lte", value: 1 },
    ],
    urgency: { kind: "money_at_risk", consequence: "₹5,000+ benefit forfeited if missed or applied after milestones lapse", base: 50 },
    formFields: [
      { id: "motherName", label: "Mother name (as per Aadhaar)", required: true, source: "aadhaar.name" },
      { id: "birthCertRef", label: "Birth certificate ref", required: true },
      { id: "bankAccount", label: "Bank account (DBT)", required: true, source: "bank_passbook.accountNumber" },
    ],
    kbSlug: "birth-registration",
  },
  {
    id: "nomination-update-child",
    title: "Add child as nominee (EPF / bank)",
    description:
      "Update EPF and bank nominations to include the new child — so family entitlements, and any claims, resolve without dispute.",
    service: "EPFO",
    dependsOn: [],
    urgency: { kind: "civic", consequence: "Keeps our family entitlements aligned after a new member arrives", base: 25 },
    formFields: [
      { id: "childName", label: "Nominee to add", required: true },
      { id: "accountType", label: "Account", type: "select", options: ["EPF (UAN)", "Bank savings", "Both"], required: true },
    ],
    kbSlug: "birth-registration",
  },
];
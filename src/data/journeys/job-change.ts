import type { TaskDef } from "@/lib/types";

/**
 * JOB_CHANGE journey DAG — content validated against official sources
 * (EPFO citizen charter ~20d transfer window; Sec 47 MV Act 12-month
 * re-registration rule; ECI Form 8 for voter ID shift; Parivahan DL address).
 *
 * Graph behaviors on display:
 *  - serial chain (identity -> UAN -> KYC -> PF transfer)
 *  - independent parallel branches (tax, address)
 *  - cross-service dependencies (transport + civic tasks unlock AFTER
 *    the new-state address exists)
 *  - conditional tasks (vehicle branch only materializes if ownsVehicle)
 */
export const JOB_CHANGE_TASKS: TaskDef[] = [
  {
    id: "verify-identity",
    title: "Verify your identity",
    description:
      "Confirm your Aadhaar e-KYC details so every department in this journey can trust them.",
    service: "DIGILOCKER",
    dependsOn: [],
    requiredDocs: ["AADHAAR"],
    autofillFields: [
      { field: "Full Name", source: "aadhaar.name" },
      { field: "Date of Birth", source: "aadhaar.dob" },
      { field: "Gender", source: "aadhaar.gender" },
    ],
    formFields: [
      { id: "fullName", label: "Full name (as per Aadhaar)", required: true, source: "aadhaar.name" },
      { id: "dob", label: "Date of birth", required: true, source: "aadhaar.dob" },
      { id: "gender", label: "Gender", required: true, source: "aadhaar.gender" },
      { id: "address", label: "Address", required: true, source: "aadhaar.address" },
    ],
    kbSlug: "digilocker-ekyc",
  },
  {
    id: "activate-uan",
    title: "Activate your UAN with the new employer",
    description:
      "Your Universal Account Number is permanent across jobs. The new employer must file your details before anything else in PF can happen.",
    service: "EPFO",
    dependsOn: ["verify-identity"],
    requiredDocs: ["EMPLOYER_DETAILS"],
    kbSlug: "epfo-pf-transfer",
    urgency: { kind: "gateway", consequence: "Blocks your entire PF chain", base: 55 },
    formFields: [
      { id: "uan", label: "UAN number", required: true },
      { id: "employerName", label: "New employer name", required: true, source: "entity:employerName" },
      { id: "establishmentId", label: "Establishment ID (from employer HR)", required: true },
      { id: "doj", label: "Date of joining", required: true },
    ],
  },
  {
    id: "uan-kyc",
    title: "Seed & approve KYC on your UAN",
    description:
      "Bank account + IFSC must be seeded and employer-approved. Stale IFSCs after bank mergers are a classic silent failure here.",
    service: "EPFO",
    dependsOn: ["activate-uan"],
    requiredDocs: ["PAN", "BANK_PASSBOOK"],
    autofillFields: [
      { field: "PAN Number", source: "pan.panNumber" },
      { field: "Bank Account", source: "bank_passbook.accountNumber" },
      { field: "IFSC", source: "bank_passbook.ifsc" },
    ],
    kbSlug: "epfo-pf-transfer",
    urgency: { kind: "money_at_risk", consequence: "Without it the transfer cannot be filed; old account heads toward inoperative status (no interest after 36 months)", base: 70 },
    formFields: [
      { id: "nameAsPerBank", label: "Name (as per bank records)", required: true, source: "aadhaar.name" },
      { id: "pan", label: "PAN", required: true, source: "pan.panNumber" },
      { id: "account", label: "Bank account number", required: true, source: "bank_passbook.accountNumber" },
      { id: "ifsc", label: "IFSC code", required: true, source: "bank_passbook.ifsc" },
    ],
  },
  {
    id: "pf-transfer",
    title: "Initiate PF transfer (Form 13)",
    description:
      "One Member–One EPF Account transfer request. Either employer may attest — pick the responsive one. Citizen-charter window: 20 days.",
    service: "EPFO",
    dependsOn: ["uan-kyc"],
    slaDays: 20,
    kbSlug: "epfo-pf-transfer",
    urgency: { kind: "money_at_risk", consequence: "Old balance stops earning interest once inactive for 36 months; service continuity affects pension + tax-free withdrawal", base: 80 },
    formFields: [
      { id: "prevMemberId", label: "Previous PF Member ID / UAN", required: true },
      { id: "currentEmployer", label: "Current employer", required: true, source: "entity:employerName" },
      { id: "attestBy", label: "Attestation by", type: "select", options: ["Previous employer", "Present employer"], required: true },
      { id: "reason", label: "Reason", type: "select", options: ["Change of employment (EPF only)"], required: true },
    ],
  },
  {
    id: "new-employer-tax",
    title: "Disclose previous salary to new employer (Form 12B)",
    description:
      "Without it your new employer under-deducts TDS (they see only their own salary) and both employers may double-claim deductions. Shortfalls above ₹10k attract advance-tax interest.",
    service: "INCOME_TAX",
    dependsOn: [],
    kbSlug: "income-tax-new-employer",
    urgency: { kind: "money_at_risk", consequence: "TDS shortfall above \u20b910,000 attracts 1% per month interest at filing time", base: 75 },
    formFields: [
      { id: "prevEmployer", label: "Previous employer name & period", required: true },
      { id: "prevSalary", label: "Salary received from previous employer (FY)", required: true },
      { id: "tdsDeducted", label: "TDS already deducted", required: true },
      { id: "newEmployer", label: "Submitted to", required: true, source: "entity:employerName" },
    ],
  },
  {
    id: "address-update",
    title: "Update address to Karnataka",
    description:
      "Hub task: your new-state address proof unlocks driving licence, voter ID and vehicle re-registration downstream.",
    service: "UIDAI",
    dependsOn: [],
    requiredDocs: ["ADDRESS_PROOF"],
    autofillFields: [{ field: "Current Address", source: "aadhaar.address" }],
    kbSlug: "uidai-address-update",
    urgency: { kind: "gateway", consequence: "Unlocks voter ID, driving licence and vehicle re-registration", base: 65 },
    formFields: [
      { id: "newAddress", label: "New address", required: true, source: "aadhaar.address" },
      { id: "proofType", label: "Proof of address", type: "select", options: ["Registered rent agreement", "Utility bill (<3 months)", "Passport", "Bank passbook"], required: true },
      { id: "contact", label: "Mobile (Aadhaar-linked)", required: true },
    ],
  },
  {
    id: "state-benefits",
    title: "Check Karnataka benefits you now qualify for",
    description:
      "Residency unlocks state schemes. We'll match your profile against published eligibility criteria.",
    service: "STATE",
    dependsOn: ["address-update"],
    kbSlug: "karnataka-benefits",
    urgency: { kind: "civic", consequence: "Money left on the table for every month you wait", base: 35 },
  },
  {
    id: "dl-address-change",
    title: "Change address on your driving licence",
    description:
      "The MV Act requires your licence to reflect current residence — apply via Parivahan with your new-state address proof.",
    service: "TRANSPORT",
    dependsOn: ["address-update"],
    requiresProfile: [{ label: "Holds a driving licence", field: "hasDrivingLicence", op: "eq", value: true }],
    requiredDocs: ["DL"],
    autofillFields: [{ field: "Licence Number", source: "dl.dlNumber" }],
    kbSlug: "dl-address-change",
    urgency: { kind: "legal_deadline", consequence: "MV Act requires licence to reflect current residence", base: 60 },
    formFields: [
      { id: "dlNumber", label: "Driving licence number", required: true, source: "dl.dlNumber" },
      { id: "newAddress", label: "New address", required: true, source: "aadhaar.address" },
      { id: "state", label: "State", required: true, source: "profile:state" },
    ],
  },
  {
    id: "voter-id-shift",
    title: "Shift voter registration to new constituency",
    description:
      "Form 8 ('Shifting of Residence') on the ECI portal — free, and you can't vote in Karnataka until this is done.",
    service: "STATE",
    dependsOn: ["address-update"],
    requiresProfile: [{ label: "Age 18 or above", field: "age", op: "gte", value: 18 }],
    kbSlug: "voter-id-shift",
    urgency: { kind: "civic", consequence: "You cannot vote in Karnataka until this is done", base: 30 },
    formFields: [
      { id: "newState", label: "New state", required: true, source: "profile:state" },
      { id: "constituency", label: "Assembly constituency", required: true },
      { id: "houseAddress", label: "House address", required: true, source: "aadhaar.address" },
    ],
  },
  {
    id: "vehicle-noc",
    title: "Get NOC from old-state RTO (Form 28)",
    description:
      "Sec 47 MV Act: out-of-state vehicles must re-register within 12 months. Start with the No-Objection Certificate from the old RTO.",
    service: "TRANSPORT",
    dependsOn: [],
    requiresProfile: [{ label: "Owns a vehicle", field: "ownsVehicle", op: "eq", value: true }],
    requiredDocs: ["VEHICLE_RC", "VEHICLE_INSURANCE", "PUC"],
    kbSlug: "vehicle-interstate-move",
    urgency: { kind: "legal_deadline", consequence: "Sec 47 MV Act: must re-register within 12 months or face penalties (~\u20b910,000+ exposure); NOC itself expires in ~6 months", base: 90 },
    formFields: [
      { id: "regNumber", label: "Vehicle registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "chassisLast4", label: "Chassis number (last 4 digits)", required: true },
      { id: "oldRto", label: "Current RTO", required: true },
      { id: "reason", label: "Reason for NOC", type: "select", options: ["Permanent relocation to another state"], required: true },
    ],
  },
  {
    id: "vehicle-reregistration",
    title: "Re-register vehicle in Karnataka + road tax",
    description:
      "Pay Karnataka road tax (claim pro-rata refund from the old state), file Form 27 at the new RTO within NOC validity, get the new RC.",
    service: "TRANSPORT",
    dependsOn: ["vehicle-noc", "address-update"],
    slaDays: 30,
    requiresProfile: [{ label: "Owns a vehicle", field: "ownsVehicle", op: "eq", value: true }],
    requiredDocs: ["VEHICLE_RC", "ADDRESS_PROOF"],
    kbSlug: "vehicle-interstate-move",
    urgency: { kind: "legal_deadline", consequence: "12-month legal limit; road-tax refund from old state shrinks as you wait", base: 85 },
    formFields: [
      { id: "regNumber", label: "Vehicle registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "nocRef", label: "NOC reference number", required: true },
      { id: "roadTaxPaid", label: "Karnataka road tax paid", type: "select", options: ["Yes — receipt attached"], required: true },
      { id: "insuranceAddr", label: "Insurance address updated to Karnataka", type: "select", options: ["Yes"], required: true },
    ],
  },
];

export const JOURNEY_TEMPLATES: Record<string, TaskDef[]> = {
  JOB_CHANGE: JOB_CHANGE_TASKS,
};

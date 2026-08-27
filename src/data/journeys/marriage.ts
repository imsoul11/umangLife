import type { TaskDef } from "@/lib/types";

/**
 * MARRIAGE — getting married.
 * Legal anchors: registration is mandatory for legal recognition
 * (Hindu Marriage Act 1955 recordable; Special Marriage Act 1954 → 30-day
 * notice period, 3 witnesses). If a spouse opts to change surname,
 * the money trail is: notarised affidavit → gazette notification
 * (2-8 weeks) → Aadhaar (₹50, ~10-15 days) → PAN (15-20 days).
 */
export const MARRIAGE_TASKS: TaskDef[] = [
  {
    id: "verify-identity",
    title: "Verify both spouses' identities",
    description:
      "DigiLocker e-KYC for each spouse — registration needs age & address proof from both.",
    service: "DIGILOCKER",
    dependsOn: [],
    requiredDocs: ["AADHAAR"],
    autofillFields: [
      { field: "Spouse 1 Name", source: "aadhaar.name" },
      { field: "Address", source: "aadhaar.address" },
    ],
    formFields: [
      { id: "spouse1Name", label: "Spouse 1 name (as per Aadhaar)", required: true, source: "aadhaar.name" },
      { id: "spouse2Name", label: "Spouse 2 name", required: true },
      { id: "dateOfMarriage", label: "Date of marriage", required: true },
    ],
    kbSlug: "marriage-registration",
  },
  {
    id: "register-marriage",
    title: "Register the marriage",
    description:
      "Hindu Marriage Act (same-religion, same-day certificate, 2 witnesses) or Special Marriage Act (inter-religion; 30-day notice, 3 witnesses). Required for visas, joint property and any name change.",
    service: "STATE",
    dependsOn: ["verify-identity"],
    slaDays: 15,
    urgency: { kind: "gateway", consequence: "The certificate is the key to every downstream step — without it no name change, no joint records", base: 80 },
    formFields: [
      { id: "act", label: "Registration under", type: "select", options: ["Hindu Marriage Act", "Special Marriage Act"], required: true },
      { id: "spouse1DOB", label: "Spouse 1 date of birth", required: true },
      { id: "spouse2DOB", label: "Spouse 2 date of birth", required: true },
      { id: "witness1", label: "Witness 1 name", required: true },
    ],
    kbSlug: "marriage-registration",
  },
  {
    id: "nomination-update",
    title: "Add spouse as nominee",
    description:
      "Update EPF, bank, PPF and LIC nominations to include your spouse — one visit or online form per account.",
    service: "EPFO",
    dependsOn: ["register-marriage"],
    urgency: { kind: "civic", consequence: "Family entitlements stay correct after marriage — modest effort", base: 30 },
    formFields: [
      { id: "accountType", label: "Account", type: "select", options: ["EPF (UAN)", "Bank savings", "PPF", "All"], required: true },
      { id: "spouseName", label: "Nominee to add", required: true },
    ],
    kbSlug: "marriage-registration",
  },
  {
    id: "health-cover-spouse",
    title: "Add spouse to family health cover",
    description:
      "Add your spouse to any Ayushman Bharat / employer / state scheme family policy; check state scheme eligibility for women members.",
    service: "STATE",
    dependsOn: ["register-marriage"],
    urgency: { kind: "civic", consequence: "If uninsured, a single hospital bill runs into lakhs", base: 45 },
    formFields: [
      { id: "scheme", label: "Cover", type: "select", options: ["Ayushman Bharat PM-JAY", "Employer group policy", "Private family floater"], required: true },
      { id: "spouseName", label: "Member to add", required: true },
    ],
    kbSlug: "marriage-registration",
  },
  {
    id: "name-change-affidavit",
    title: "Name-change affidavit + gazette (if changing)",
    description:
      "If a spouse takes the other's surname: notarised affidavit + two newspaper notices, then gazette notification (2–8 weeks) — the gateway for PAN & Aadhaar re-issue under the new name.",
    service: "STATE",
    dependsOn: ["register-marriage"],
    requiresProfile: [{ label: "Surname to be changed", field: "isChangingName", op: "eq", value: true }],
    urgency: { kind: "legal_deadline", consequence: "Without gazette notice PAN/Aadhaar updates under a new spelling can be rejected", base: 55 },
    formFields: [
      { id: "newName", label: "New name on document", required: true },
      { id: "affidavit", label: "Notarised affidavit", type: "select", options: ["Yes"], required: true },
    ],
    kbSlug: "marriage-name-change",
  },
  {
    id: "aadhaar-name-update",
    title: "Update Aadhaar name",
    description:
      "myAadhaar → Update Aadhaar → Name update; needs the gazette/affidavit & marriage certificate; fee ₹50; ~working 2-3 weeks.",
    service: "UIDAI",
    dependsOn: ["name-change-affidavit"],
    urgency: { kind: "civic", consequence: "Keeps your primary ID synced or KYC checks break everywhere", base: 40 },
    formFields: [
      { id: "name", label: "New name", required: true },
      { id: "source", label: "Proof", type: "select", options: ["Gazette notification", "Affidavit + newspaper clippings"], required: true },
    ],
    kbSlug: "marriage-name-change",
  },
  {
    id: "pan-name-update",
    title: "Update PAN name",
    description:
      "PAN correction via NSDL/UTI with the married certificate + updated Aadhaar: name changes, the PAN number stays.",
    service: "INCOME_TAX",
    dependsOn: ["aadhaar-name-update"],
    urgency: { kind: "civic", consequence: "Mismatched PAN blocks to new banking & tax KYC", base: 45 },
    formFields: [
      { id: "pan", label: "PAN", required: true, source: "pan.panNumber" },
      { id: "newName", label: "New name", required: true },
    ],
    kbSlug: "marriage-name-change",
  },
];
import type { TaskDef } from "@/lib/types";

/**
 * VEHICLE_PURCHASE (second-hand) journey.
 * Legal anchors: RC ownership transfer within 30 days (CMV Rule 56),
 * insurance transfer within 14 days else claim rejection,
 * valid PUC mandatory for RTO work.
 *
 * Shape: three parallel prep lanes converge on the RTO hub,
 * FASTag hangs off completion — mirrors the job-change graph language.
 */
export const VEHICLE_PURCHASE_TASKS: TaskDef[] = [
  {
    id: "verify-identity",
    title: "Verify your identity",
    description:
      "Confirm Aadhaar e-KYC once; every department in this journey reuses it.",
    service: "DIGILOCKER",
    dependsOn: [],
    requiredDocs: ["AADHAAR"],
    autofillFields: [
      { field: "Full Name", source: "aadhaar.name" },
      { field: "Date of Birth", source: "aadhaar.dob" },
    ],
    formFields: [
      { id: "fullName", label: "Full name (as per Aadhaar)", required: true, source: "aadhaar.name" },
      { id: "dob", label: "Date of birth", required: true, source: "aadhaar.dob" },
      { id: "address", label: "Address", required: true, source: "aadhaar.address" },
    ],
    kbSlug: "digilocker-ekyc",
  },
  {
    id: "collect-seller-docs",
    title: "Collect documents from the seller",
    description:
      "Original RC, signed Forms 29 & 30, insurance papers, valid PUC, seller's Aadhaar copy, and bank NOC if the car was on loan.",
    service: "TRANSPORT",
    dependsOn: [],
    requiredDocs: ["VEHICLE_RC"],
    urgency: { kind: "gateway", consequence: "Nothing at the RTO moves without the seller's signed forms", base: 60 },
    formFields: [
      { id: "regNumber", label: "Vehicle registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "sellerName", label: "Seller name (as on RC)", required: true },
      { id: "saleDate", label: "Date of sale", required: true },
      { id: "loanCleared", label: "Was the car financed?", type: "select", options: ["No loan / hypothecation cleared", "Bank NOC attached"], required: true },
    ],
    kbSlug: "vehicle-rc-ownership-transfer",
  },
  {
    id: "clear-challans",
    title: "Check & clear pending challans",
    description:
      "Pending e-challans transfer headaches to you — clear them on the Parivahan portal before the RTO visit.",
    service: "TRANSPORT",
    dependsOn: [],
    urgency: { kind: "money_at_risk", consequence: "Old challans become your liability and stall the RC transfer", base: 65 },
    formFields: [
      { id: "regNumber", label: "Registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "challanStatus", label: "Pending challans found", type: "select", options: ["None pending", "Cleared before transfer"], required: true },
    ],
    kbSlug: "vehicle-rc-ownership-transfer",
  },
  {
    id: "puc-renew",
    title: "Get a valid PUC certificate",
    description:
      "A current emission certificate is compulsory for the insurance and RC processes — and driving without one attracts fines.",
    service: "TRANSPORT",
    dependsOn: [],
    requiredDocs: ["PUC"],
    urgency: { kind: "legal_deadline", consequence: "Driving without a valid PUC is an offence; RTO will not accept the file", base: 70 },
    formFields: [
      { id: "regNumber", label: "Registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "fuelType", label: "Fuel type", type: "select", options: ["Petrol", "Diesel", "CNG", "Electric (exempt)"], required: true },
      { id: "centerId", label: "PUCC center ID", required: false },
    ],
    kbSlug: "vehicle-rc-ownership-transfer",
  },
  {
    id: "insurance-transfer",
    title: "Transfer insurance into your name",
    description:
      "Statutory 14-day window after purchase — beyond that the insurer can reject claims outright.",
    service: "STATE",
    dependsOn: ["collect-seller-docs"],
    slaDays: 7,
    urgency: { kind: "legal_deadline", consequence: "After 14 days the insurer may refuse claim settlement entirely", base: 85 },
    autofillFields: [{ field: "Owner Name", source: "aadhaar.name" }],
    formFields: [
      { id: "policyNumber", label: "Existing policy number", required: true, source: "vehicle_insurance.policyNumber" },
      { id: "insurer", label: "Insurer", required: true, source: "vehicle_insurance.issuer" },
      { id: "newOwnerName", label: "New owner name", required: true, source: "aadhaar.name" },
      { id: "saleProof", label: "Sale document attached", type: "select", options: ["Yes — sale letter/Form 29 copy"], required: true },
    ],
    kbSlug: "vehicle-insurance-transfer",
  },
  {
    id: "rc-ownership-transfer",
    title: "Apply for RC ownership transfer (Form 29/30)",
    description:
      "File online via Parivahan within 30 days of purchase (CMV Rule 56). Needs valid insurance, PUC, cleared challans and seller-signed forms.",
    service: "TRANSPORT",
    dependsOn: ["collect-seller-docs", "insurance-transfer", "clear-challans", "puc-renew"],
    slaDays: 30,
    urgency: { kind: "legal_deadline", consequence: "Beyond 30 days: late fees and you remain legally exposed for a car not in your name", base: 95 },
    autofillFields: [
      { field: "Buyer Name", source: "aadhaar.name" },
      { field: "Registration Number", source: "vehicle_rc.registrationNumber" },
    ],
    formFields: [
      { id: "regNumber", label: "Registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "chassisLast5", label: "Chassis number (last 5 digits)", required: true },
      { id: "engineLast5", label: "Engine number (last 5 digits)", required: true },
      { id: "buyerAddress", label: "Buyer address proof", required: true, source: "aadhaar.address" },
      { id: "insuranceValid", label: "Insurance transferred?", type: "select", options: ["Yes"], required: true },
      { id: "purchaseDate", label: "Date of purchase", required: true },
    ],
    kbSlug: "vehicle-rc-ownership-transfer",
  },
  {
    id: "fastag-update",
    title: "Update FASTag to your name & new RC",
    description:
      "Old tag stays linked to the seller — update KYC on the FASTag or get a fresh one to avoid toll double-charges.",
    service: "STATE",
    dependsOn: ["rc-ownership-transfer"],
    urgency: { kind: "civic", consequence: "Mismatched FASTag means failed toll reads and fines", base: 25 },
    formFields: [
      { id: "newRegNumber", label: "Registration number", required: true, source: "vehicle_rc.registrationNumber" },
      { id: "tagAction", label: "Action", type: "select", options: ["Update KYC on existing tag", "Buy new FASTag"], required: true },
    ],
    kbSlug: "vehicle-rc-ownership-transfer",
  },
];

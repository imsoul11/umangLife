import type { TaskDef } from "@/lib/types";

/**
 * HOME_PURCHASE — buying a home.
 * Legal anchors: stamp duty + registration are mandatory for any
 * transfer of ownership (TP Act 1882 §54, Registration Act 1908 §17,
 * §32); the sale deed must reach the sub-registrar within 4 months
 * (§23). After registration: mutation, property tax, utilities.
 */
export const HOME_PURCHASE_TASKS: TaskDef[] = [
  {
    id: "verify-identity",
    title: "Verify buyer identity",
    description:
      "DigiLocker e-KYC (Aadhaar/PAN) — every property step from stamp paper to sub-registrar needs verified identity.",
    service: "DIGILOCKER",
    dependsOn: [],
    requiredDocs: ["AADHAAR"],
    autofillFields: [
      { field: "Full Name", source: "aadhaar.name" },
      { field: "Address", source: "aadhaar.address" },
    ],
    formFields: [
      { id: "name", label: "Buyer name (as per PAN/Aadhaar)", required: true, source: "aadhaar.name" },
      { id: "pan", label: "PAN", required: true, source: "pan.panNumber" },
      { id: "address", label: "Address", required: true, source: "aadhaar.address" },
    ],
    kbSlug: "home-sale-deed-registration",
  },
  {
    id: "title-encumbrance-check",
    title: "Run encumbrance & title check",
    description:
      "Obtain an encumbrance certificate (13+ years recommended) to confirm no pending mortgages, court orders or unpaid liens on the property — non-negotiable before you pay the full amount.",
    service: "STATE",
    dependsOn: ["verify-identity"],
    urgency: { kind: "money_at_risk", consequence: "Buying a clean-title HomeP once — skip the check and you inherit the seller's liabilities", base: 75 },
    formFields: [
      { id: "propAddress", label: "Property address / survey number", required: true },
      { id: "period", label: "Search period", type: "select", options: ["13 years", "30 years"], required: true },
      { id: "holderName", label: "Certificate in the name of", required: true, source: "aadhaar.name" },
    ],
    kbSlug: "home-sale-deed-registration",
  },
  {
    id: "stamp-duty-payment",
    title: "Pay stamp duty (e-stamp / IGRS)",
    description:
      "Stamp duty (state-defined, ~5–8% of circle value) on e-stamp paper via the state IGRS portal. No stamp duty, no registration — it is the state's proof of the transaction.",
    service: "STATE",
    dependsOn: ["verify-identity"],
    urgency: { kind: "gateway", consequence: "Registration cannot proceed without correct stamp duty", base: 75 },
    formFields: [
      { id: "propValue", label: "Agreement value (₹)", required: true },
      { id: "state", label: "State", required: true, source: "profile:state" },
      { id: "buyerName", label: "Buyer name", required: true, source: "aadhaar.name" },
    ],
    kbSlug: "home-sale-deed-registration",
  },
  {
    id: "sale-deed-registration",
    title: "Register the sale deed (sub-registrar)",
    description:
      "Both parties appear with two witnesses before the sub-registrar in the property's jurisdiction; biometric verification, witnesses sign, deed endorsed with a registration number. Do it within 4 months of execution.",
    service: "STATE",
    dependsOn: ["title-encumbrance-check", "stamp-duty-payment"],
    slaDays: 15,
    urgency: {
      kind: "legal_deadline",
      consequence: "Unregistered deed = no legal title; Sec 23 gives a 4-month window, then late-fee + registrar discretion",
      base: 95,
    },
    requiredDocs: ["AADHAAR"],
    autofillFields: [{ field: "Buyer Name", source: "aadhaar.name" }],
    formFields: [
      { id: "regNumber", label: "Property survey / plot no.", required: true },
      { id: "saleDeedValue", label: "Sale consideration (₹)", required: true },
      { id: "witness1", label: "Witness 1 name", required: true },
      { id: "witness2", label: "Witness 2 name", required: true },
    ],
    kbSlug: "home-sale-deed-registration",
  },
  {
    id: "mutation-khata",
    title: "Mutation / khata transfer",
    description:
      "Update the revenue record (khata in Karnataka) to your name at the municipal/tehsildar office. Before this, property-tax notices still arrive to the seller.",
    service: "STATE",
    dependsOn: ["sale-deed-registration"],
    slaDays: 45,
    urgency: { kind: "money_at_risk", consequence: "Until mutation completes, tax notices land in the seller's name — pay arrears to avoid penalties", base: 60 },
    formFields: [
      { id: "deedRef", label: "Registered deed number", required: true },
      { id: "propAddress", label: "Property address", required: true },
      { id: "previousOwner", label: "Previous owner name", required: true },
    ],
    kbSlug: "home-sale-deed-registration",
  },
  {
    id: "property-tax-name",
    title: "Move property tax into your name",
    description:
      "Register the property with the municipal corporation so the next property-tax bill issues in your name (pro-rata for the year).",
    service: "STATE",
    dependsOn: ["mutation-khata"],
    urgency: { kind: "civic", consequence: "Delays mean bills in seller's name and penalty risk — base: 40", base: 40 },
    formFields: [
      { id: "propertyId", label: "Property / PID number", required: true },
      { id: "ownerName", label: "Owner name", required: true, source: "aadhaar.name" },
    ],
    kbSlug: "home-sale-deed-registration",
  },
  {
    id: "utilities-ownership",
    title: "Transfer utility connections",
    description:
      "Electricity (DISCOM), water (municipal), and gas to your name — fees ~₹500–5,000 per utility, so budget early.",
    service: "STATE",
    dependsOn: ["sale-deed-registration"],
    urgency: { kind: "civic", consequence: "Billing mismatches and supply interruptions until moved", base: 30 },
    formFields: [
      { id: "utility", label: "Utility", type: "select", options: ["Electricity", "Water", "Gas pipeline"], required: true },
      { id: "meterNo", label: "Meter / connection no.", required: true },
      { id: "deedRef", label: "Deed reference", required: true },
    ],
    kbSlug: "home-sale-deed-registration",
  },
];
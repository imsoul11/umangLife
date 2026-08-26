import type { Scheme } from "@/lib/types";

/**
 * Eligibility criteria are machine-checkable predicates over the profile.
 * Every criterion carries a `label` — that label is what the UI shows
 * as the human-readable "why you match / what's missing".
 */
export const SCHEMES: Scheme[] = [
  {
    id: "sukanya-samriddhi",
    name: "Sukanya Samriddhi Yojana",
    department: "Ministry of Finance",
    level: "central",
    benefits: [
      "8.2% p.a. interest (among the highest govt-backed rates)",
      "Tax-free maturity under Sec 80C + EEE status",
    ],
    criteria: [
      { label: "You have a daughter under 10", field: "youngestGirlChildAge", op: "lte", value: 10 },
      { label: "Account opened in her name before she turns 10", field: "age", op: "gte", value: 18 },
    ],
    sourceUrl: "https://www.india.gov.in/sukanya-samriddhi-yojana",
    lastUpdated: "2026-04-01",
  },
  {
    id: "nps-vatsalya",
    name: "NPS Vatsalya (pension account for minors)",
    department: "PFRDA",
    level: "central",
    benefits: ["Start a pension corpus in your child's name", "Converts to NPS at 18"],
    criteria: [
      { label: "You have at least one child", field: "childCount", op: "gte", value: 1 },
      { label: "Child below 18", field: "youngestChildAge", op: "lte", value: 18 },
    ],
    sourceUrl: "https://npstrust.org.in/nps-vatsalya",
    lastUpdated: "2025-09-18",
  },
  {
    id: "atal-pension",
    name: "Atal Pension Yojana",
    department: "PFRDA / Ministry of Finance",
    level: "central",
    benefits: ["Guaranteed pension ₹1,000–₹5,000/month from age 60"],
    criteria: [
      { label: "Age between 18 and 40", field: "age", op: "gte", value: 18 },
      { label: "Not older than 40", field: "age", op: "lte", value: 40 },
      { label: "Has a bank account", field: "hasBankAccount", op: "eq", value: true },
    ],
    sourceUrl: "https://www.jansuraksha.gov.in",
    lastUpdated: "2026-01-12",
  },
  {
    id: "ka-gruha-jyothi",
    name: "Gruha Jyothi (free electricity up to 200 units)",
    department: "Govt. of Karnataka",
    level: "state",
    state: "Karnataka",
    benefits: ["Zero electricity bill up to 200 units/month for households"],
    criteria: [
      { label: "Resident of Karnataka", field: "state", op: "eq", value: "Karnataka" },
      { label: "Household electricity connection registered in your name", field: "hasBankAccount", op: "eq", value: true },
    ],
    sourceUrl: "https://seva.karnataka.gov.in",
    lastUpdated: "2026-06-30",
  },
  {
    id: "ka-gruha-lakshmi",
    name: "Gruha Lakshmi (₹2,000/month to woman head of family)",
    department: "Govt. of Karnataka",
    level: "state",
    state: "Karnataka",
    benefits: ["₹2,000 monthly direct transfer to the woman head of household"],
    criteria: [
      { label: "Resident of Karnataka", field: "state", op: "eq", value: "Karnataka" },
      { label: "Woman head of family applies", field: "gender", op: "eq", value: "female" },
      { label: "Not an income-tax payer", field: "paysIncomeTax", op: "eq", value: false },
    ],
    sourceUrl: "https://seva.karnataka.gov.in",
    lastUpdated: "2026-06-30",
  },
  {
    id: "ayushman-bharat",
    name: "Ayushman Bharat PM-JAY (₹5 lakh health cover)",
    department: "National Health Authority",
    level: "central",
    benefits: ["Cashless hospitalization cover of ₹5 lakh/family/year"],
    criteria: [
      { label: "Family income within low-income threshold", field: "annualIncomeInr", op: "lte", value: 300000 },
      { label: "No member pays income tax", field: "paysIncomeTax", op: "eq", value: false },
    ],
    sourceUrl: "https://pmjay.gov.in",
    lastUpdated: "2026-02-14",
  },
  {
    id: "pm-kisan",
    name: "PM-KISAN (income support for farmers)",
    department: "Ministry of Agriculture",
    level: "central",
    benefits: ["₹6,000/year in three installments to landholding farmer families"],
    criteria: [
      { label: "Occupation is farming", field: "occupation", op: "in", value: ["farmer"] },
      { label: "Cultivable landholding", field: "ownsLand", op: "eq", value: true },
    ],
    sourceUrl: "https://pmkisan.gov.in",
    lastUpdated: "2026-05-02",
  },
  {
    id: "ka-yuva-nidhi",
    name: "Yuva Nidhi (unemployment allowance, Karnataka)",
    department: "Govt. of Karnataka",
    level: "state",
    state: "Karnataka",
    benefits: ["₹3,000/month allowance for unemployed graduates"],
    criteria: [
      { label: "Resident of Karnataka", field: "state", op: "eq", value: "Karnataka" },
      { label: "Currently unemployed", field: "occupation", op: "eq", value: "unemployed" },
    ],
    sourceUrl: "https://sevasindhuservices.karnataka.gov.in",
    lastUpdated: "2025-11-20",
  },
  {
    id: "pm-suraksha-bima",
    name: "Pradhan Mantri Suraksha Bima Yojana (accident insurance)",
    department: "Ministry of Finance",
    level: "central",
    benefits: ["₹2 lakh accidental death/disability cover at ₹20/year"],
    criteria: [
      { label: "Age between 18 and 70", field: "age", op: "gte", value: 18 },
      { label: "Age not above 70", field: "age", op: "lte", value: 70 },
      { label: "Has a bank account", field: "hasBankAccount", op: "eq", value: true },
    ],
    sourceUrl: "https://www.jansuraksha.gov.in",
    lastUpdated: "2026-01-12",
  },
  {
    id: "e-shram",
    name: "e-Shram registration (unorganised workers)",
    department: "Ministry of Labour & Employment",
    level: "central",
    benefits: ["Universal worker ID; accident insurance of ₹2 lakh for 1 year"],
    criteria: [
      { label: "Employed in unorganised sector", field: "occupation", op: "in", value: ["self_employed", "farmer", "unemployed"] },
      { label: "Age between 16 and 59", field: "age", op: "gte", value: 16 },
    ],
    sourceUrl: "https://eshram.gov.in",
    lastUpdated: "2025-12-08",
  },
];

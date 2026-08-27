import type { KbTopic } from "@/lib/types";

export const KB_TOPICS_EXTRA: KbTopic[] = [
  {
    slug: "birth-registration",
    title: "Birth registration and the child's first documents",
    department: "Registrar of Births & Deaths · Municipal",
    lastUpdated: "2026-05-02",
    lifeEvents: ["NEW_CHILD"],
    keywords: ["birth", "certificate", "21 days", "registrar", "Baal Aadhaar", "ration", "RBD Act"],
    content: `# Registering a newborn and the child's first documents

## The 21-day rule (RBD Act, 1969, Sec 13)
Every birth must be registered within 21 days of birth — free, usually done by the hospital (Form 1). After that it escalates:
- **21–30 days:** late fee
- **30 days – 1 year:** registrar written permission + affidavit for the delay
- **After 1 year:** magistrate order + sworn affidavit + documentary proof

## Documents
Hospital discharge sheet / doctor's certificate, Form 1, both parents' Aadhaar, parents' marriage certificate (or affidavit for home births), address proof.

## Why the certificate matters
It is the foundational ID: school admission, passport, Aadhaar for the child, adding the child to the ration card, maternity benefit claims, and inheritance. Births at home must be applied for manually.

## The first-child pipeline after registration
1. **Baal Aadhaar** — under-5 enrolment has no biometrics; biometrics captured at age 5.
2. **Ration card** — add the child as a household member (birth certificate + often child's Aadhaar).
3. **Maternity benefit** — PM-MVY ₹5,000 for first child is gated on registration reference + vaccination milestones.`,
  },
  {
    slug: "home-sale-deed-registration",
    title: "Registering a home purchase — stamp duty, sale deed, mutation",
    department: "Registration Act 1908 · State IGRS / Revenue",
    lastUpdated: "2026-06-27",
    lifeEvents: ["HOME_PURCHASE"],
    keywords: ["home", "sale deed", "stamp duty", "registration", "mutation", "khata", "encumbrance", "IGRS"],
    content: `# Registering your home purchase

## The 4-month clock
**Sec 23, Registration Act 1908:** a completed sale deed must be presented for registration within four months of execution. Miss it and you need late fees and the registrar's discretion. And an unregistered deed proves nothing: Sec 54 of the Transfer of Property Act requires a registered instrument to transfer title.

## Prerequisites (in order)
1. **Title check & encumbrance certificate** — 13-year search confirms no mortgage/lien on the property.
2. **Stamp duty on e-stamp** — ~5–8% of the circle-rate value depending on state (Karnataka ~5%).
3. **Prepare the deed** — complete names + ID numbers, survey/plot №, boundaries, sale consideration, witnesses.
4. **Sub-registrar appointment** — both spouses + 2 witnesses, biometrics where applicable. Bring PAN, Aadhaar, photo, prev. title deeds, latest tax receipts, khata/patta.

## After registration (do these)
- **Mutation/Khata transfer** — the revenue record shows the seller until you file the mutation (15–90 days). Without it, property tax stays in the seller's name.
- **Property tax** — issue your name with the municipal body.
- **Utilities** — electricity, water and gas to your name (~₹500–5,000 each).

## Watch-outs
- Payment/TDS details must match circle value; underpricing invites reassessment.
- Society NOC, POA if represented; occupancy certificate/past title chain for new builds.`,
  },
  {
    slug: "marriage-registration",
    title: "Marriage registration and post-marriage name updates",
    department: "Registrar of Marriages · State Government",
    lastUpdated: "2026-08-06",
    lifeEvents: ["MARRIAGE"],
    keywords: ["marriage", "certificate", "Special Marriage Act", "name change", "gazette", "PAN", "Aadhaar"],
    content: `# Marriage registration and what it unlocks

## Two tracks
- **Hindu Marriage Act 1955** — same-religion couples; registers on the day; 2 witnesses.
- **Special Marriage Act 1954** — inter-religion / civil; mandatory **30-day notice period**; 3 witnesses.

Your state's registrar handles it; the certificate is the legal spine for visas, joint property, and name changes.

## If a spouse opts to change surname
1. **Affidavit** — notarized declaration.
2. **Newspapers** — notice in one English + one regional daily; keep clippings.
3. **Gazette notice** — via egazette.gov.in (~2–8 weeks, ₹1,000–3,000).
4. **Aadhaar name update** — myAadhaar → Name Update, ₹50, ~10–15 working days.
5. **PAN name update** — NSDL / UTIITSL correction (name changes, PAN number stays), ~15–20 days.
6. **Passport** (if needed) — re-issue in the new name.

## Things most people forget
- Add your spouse as nominee (EPF, bank, PPF, LIC).
- Add to family health cover asap — a single uncovered hospital bill is your biggest risk.
- Update tax filing status and employer HR records.`,
  },
  {
    slug: "marriage-name-change",
    title: "Name change after marriage (Aadhaar, PAN, passport)",
    department: "UIDAI · Income Tax Dept · Passport Seva",
    lastUpdated: "2026-08-06",
    lifeEvents: ["MARRIAGE"],
    keywords: ["name change", "affidavit", "gazette", "PAN", "Aadhaar", "passport"],
    content: `# Name change after marriage

## The legal spine
1. **Notarised affidavit** (₹100–500)
2. **Two newspaper notices** (1 English + 1 regional)
3. **Gazette publication** via egazette.gov.in (2–8 weeks). The gazette is what banks, government bodies and passport offices treat as the authoritative record of the new name.

## Document updates (in order)
- **Aadhaar**: myAadhaar → Name Update → fee ₹50 → ~10–15 working days.
- **PAN**: NSDL / UTIITSL correction flow — NEW name, SAME PAN number → ~15–20 working days.
- **Passport**: re-issue at Passport Seva Kendra showing the marriage cert + gazette (Tatkaal 3–7 days, normal 3–4 weeks).
- Banks, employer HR, professional registrations follow with the new documents.

## Practical note
Start with Aadhaar and PAN — nearly everything else (bank KYC, loans, permits) keys off those two and rejects mismatches.`,
  },
];
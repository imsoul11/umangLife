import type { KbTopic } from "@/lib/types";

/**
 * Curated knowledge base — each entry mirrors what an official source states.
 * In production this would come from a RAG pipeline over govt websites.
 * For the hackathon we curate by hand; citations still work because every
 * topic carries department + lastUpdated.
 */
export const KB_TOPICS: KbTopic[] = [
  {
    slug: "epfo-pf-transfer",
    title: "Transferring PF balance when changing jobs",
    department: "Employees' Provident Fund Organisation (EPFO)",
    lastUpdated: "2026-03-10",
    lifeEvents: ["JOB_CHANGE"],
    keywords: ["pf", "provident fund", "uan", "transfer", "form 13", "kyc", "employer"],
    content: `# Transferring your PF when you change jobs

Your Provident Fund does not move automatically when you switch employers.

## Why it matters
- An old PF account with no contributions for 36 months becomes inoperative and stops earning interest.
- A transfer preserves continuous service, which matters for EPS pension and for tax-free withdrawal after 5 years of service.

## Prerequisites (in order)
1. **UAN activated** — your Universal Account Number is permanent across jobs; the mobile used at activation must be active.
2. **New employer linked** — they must file your UAN/ECR so your Member ID exists under the current establishment.
3. **KYC seeded AND employer-approved** — bank account + IFSC (Aadhaar/PAN seeding is strongly advised). Claims fail most often because KYC was pending employer approval.

## How to transfer (Form 13, online)
1. Log in to the EPFO member portal or UMANG app.
2. Online Services → One Member - One EPF Account (Transfer Request).
3. Verify personal details; select the previous Member ID to merge.
4. **Choose who attests**: either your previous OR present employer — pick whichever has an authorised signatory with a valid DSC. This protects you if the old employer is defunct or unresponsive.
5. Authenticate with OTP on your UAN-registered mobile.
6. Print Form 13, sign, submit to that employer within 10 days.

## Timeline
Citizen's Charter window is **20 days** after employer attestation. Track under Online Services → Track Claim Status.

## Common rejection reasons
- Name or DOB mismatch between UAN, Aadhaar and PAN (even a single dot)
- Aadhaar not seeded / not approved by employer
- Stale IFSC after a bank merger
- Service overlap (two employers reported the same month) — fix via Form 11 + transfer
- Note: only ONE transfer request is accepted per previous Member ID`,
  },
  {
    slug: "income-tax-new-employer",
    title: "Income tax steps after switching jobs mid-year",
    department: "Income Tax Department",
    lastUpdated: "2026-02-20",
    lifeEvents: ["JOB_CHANGE"],
    keywords: ["tax", "tds", "form 12b", "form 12bb", "form 16", "employer", "salary"],
    content: `# Income tax when you switch jobs mid financial year

## What changes
Two employers pay you in one financial year. Each applies TDS independently, usually after allowing only its own portion of the basic exemption limit and its own deductions — so combined TDS often falls short.

## Two different forms (don't confuse them)
- **Form 12B** — disclosure of salary + TDS already paid by your PREVIOUS employer, given to the new employer so they can aggregate under Sec 192(2) and deduct correct TDS.
- **Form 12BB** — your investment/deduction declaration (HRA, 80C, 80D...) for TDS purposes. Submit to each employer as usual.

## What to do
1. **Declare previous salary early** — before the next TDS cycle; this single step prevents most mid-year tax errors.
2. **Collect Form 16 from both employers** (by June 15 next year).
3. **Cross-check Form 26AS / AIS** before filing — confirm both employers' TDS credits.
4. **File ONE ITR aggregating both salaries**; never claim standard deduction, slab benefit, 80C/80D or 87A twice.
5. **Advance tax**: if total shortfall exceeds ₹10,000, pay advance/self-assessment tax — else 1% per month interest applies.

## Consequence of skipping
Mismatch between Form 16s and the ITR commonly triggers a high-tax-demand notice or delayed refund.`,
  },
  {
    slug: "uidai-address-update",
    title: "Updating your address in Aadhaar after relocation",
    department: "Unique Identification Authority of India (UIDAI)",
    lastUpdated: "2026-01-30",
    lifeEvents: ["JOB_CHANGE", "HOME_PURCHASE"],
    keywords: ["aadhaar", "address", "proof", "relocation", "uidai"],
    content: `# Changing your Aadhaar address

## When you need it
State services (ration, state schemes, local registrations) verify residency through your Aadhaar address. After moving states, update it early — several journeys depend on it.

## Accepted proof of address documents
Passport, bank statement/passbook, registered rent agreement, electricity bill (not older than 3 months), among others. Full list on the UIDAI website.

## How to update (online)
1. Visit myAadhaar portal → Update Address.
2. Upload valid Proof of Address.
3. Pay the nominal fee (~Rs 50) and note the URN to track status.

## Alternative without document proof
Address Verifier flow: a family member whose address is validated can confirm yours via an OTP process.

## Timeline
Typically updates within 5–10 working days; you can download e-Aadhaar with the new address once processed.`,
  },
  {
    slug: "karnataka-benefits",
    title: "Karnataka state welfare schemes for new residents",
    department: "Govt. of Karnataka",
    lastUpdated: "2026-06-30",
    lifeEvents: ["JOB_CHANGE", "HOME_PURCHASE"],
    keywords: ["karnataka", "scheme", "gruha", "benefits", "eligibility", "seva sindhu"],
    content: `# Karnataka schemes worth checking after you move

Residency (usually evidenced via Aadhaar address + local records) unlocks these flagship programmes:

## Gruha Jyothi
Free electricity up to 200 units/month for households. Register the connection under the Gruha Jyothi scheme via Seva Sindhu.

## Gruha Lakshmi
Rs 2,000/month to the woman head of eligible households (income-tax payers excluded).

## Yuva Nidhi
Monthly allowance for unemployed graduates/diploma holders registered with Karnataka employment exchanges.

## Shakti scheme
Zero-ticket bus travel for women in non-premium government buses statewide.

## Where to apply
Most programmes run through **Seva Sindhu**, Karnataka's service-plus portal; applications need Aadhaar, bank account and residency proof.

Note: Eligibility rules change with budgets — always confirm current criteria on the official portal before applying.`,
  },
  {
    slug: "digilocker-ekyc",
    title: "DigiLocker e-KYC and consented data reuse",
    department: "Ministry of Electronics & IT (NeGD)",
    lastUpdated: "2026-05-15",
    lifeEvents: ["JOB_CHANGE", "VEHICLE_PURCHASE", "NEW_CHILD", "HOME_PURCHASE"],
    keywords: ["digilocker", "ekyc", "consent", "documents", "autofill", "verification"],
    content: `# DigiLocker e-KYC inside UMANG

## What it gives you
DigiLocker holds digitally issued documents (Aadhaar, PAN, DL, marksheets) from original issuers. Documents fetched this way are legally equivalent to physical originals under IT Rules.

## How reuse works in a journey
1. You grant explicit consent for a service to read specific document fields.
2. The platform pulls verified fields directly from the issuer.
3. Forms prefill from those verified fields — no retyping, no uploads for covered fields.

## Consent principles
- Access is per-purpose and auditable; you can revoke access from DigiLocker settings.
- Only fields needed for the form are requested.

## Why verification matters
Because values come from issuers (UIDAI, ITD, RTO), departments accept them as verified — this is what makes instant autofill possible.`,
  },
  {
    slug: "vehicle-interstate-move",
    title: "Moving your vehicle to another state (NOC, road tax, re-registration)",
    department: "Ministry of Road Transport & Highways (MoRTH) / State RTOs",
    lastUpdated: "2026-03-01",
    lifeEvents: ["JOB_CHANGE", "VEHICLE_PURCHASE"],
    keywords: ["vehicle", "rc", "noc", "road tax", "rto", "re-registration", "bh series", "puc"],
    content: `# Taking your vehicle to another state

## The legal clock
Section 47, Motor Vehicles Act 1988: a vehicle registered in one state may be used in another for **up to 12 months**. After that, re-registration in the new state is mandatory — driving an unregistered out-of-state vehicle invites penalties.

## The three steps
1. **NOC from the old RTO (Form 28)** — clear challans first; NOC validity is limited (commonly ~6 months, varies by state), so plan the next step inside that window.
2. **New state road tax** — pay Karnataka road tax; apply for a **pro-rata refund** of unused road tax from the old state (30–90 days).
3. **Re-registration (Form 27)** at the new RTO within NOC validity: physical inspection of chassis/engine numbers, surrender old RC, receive new registration number and RC.

## Documents typically demanded
Original RC, NOC, valid insurance, valid PUC, new-state address proof (rental agreement / utility bill / Aadhaar with updated address), owner ID proof.

## Watch-outs
- Vehicle loan? Get the bank's NOC on hypothecation first.
- Insurance address should match the new state before submission.
- **BH series** registrations skip this entire process — worth requesting if you relocate often.

## Timeline
End-to-end commonly 30–90 days across both RTOs.`,
  },
  {
    slug: "dl-address-change",
    title: "Changing your driving licence address after moving states",
    department: "MoRTH / Parivahan Sewa",
    lastUpdated: "2026-05-28",
    lifeEvents: ["JOB_CHANGE"],
    keywords: ["driving licence", "dl", "parivahan", "address change", "rto"],
    content: `# Driving licence address change

The Motor Vehicles Act requires your DL to reflect your current residential address; the licence record moves under your new state's RTO jurisdiction.

## How
Apply online via **Parivahan Sewa** (sarathi.parivahan.gov.in): Apply for Change of Address; upload address proof and existing DL; pay the fee; track status online.

## Address proof accepted
Aadhaar with updated address, passport, voter ID, utility bill, registered rent agreement.

## Notes
- If the DL is expired, renew first — an expired licence cannot be transferred between states.
- No driving test is needed for a plain address change.
- Processing is typically days-to-weeks depending on the RTO.`,
  },
  {
    slug: "voter-id-shift",
    title: "Shifting your voter registration to the new constituency",
    department: "Election Commission of India (ECI)",
    lastUpdated: "2026-04-10",
    lifeEvents: ["JOB_CHANGE"],
    keywords: ["voter id", "election", "eci", "form 8", "constituency"],
    content: `# Moving your vote to the new state

Until your electoral record moves, you cannot vote in your new location.

## How
1. Visit the ECI portal (**voters.eci.gov.in**) → Shifting of Residence/Correction → **Form 8**.
2. Choose 'Self' → 'Shifting of Residence' (outside assembly constituency).
3. Enter new State/District/Constituency, Aadhaar-linked details, upload residence proof (Aadhaar with updated address, utility bill, passbook, registered rent agreement).
4. A Booth Level Officer may verify; you can track the application on the portal.

## Cost & timing
Free of charge. Processing commonly completes within about a month outside election periods — apply well before polls.

## Tip
Update Aadhaar address FIRST — it doubles as the residence proof for this application.`,
  },
];

export function findKbTopic(slug: string): KbTopic | undefined {
  return KB_TOPICS.find((t) => t.slug === slug);
}

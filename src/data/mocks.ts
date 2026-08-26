import type { CitizenProfile, DigilockerDocument } from "@/lib/types";

/** The demo citizen — crafted so ~4 schemes match and the rest visibly filter. */
export const MOCK_PROFILE: CitizenProfile & {
  hasBankAccount: boolean;
  ownsLand: boolean;
  childCount: number;
  youngestChildAge: number;
  youngestGirlChildAge: number | null;
} = {
  name: "Antas Jain",
  age: 27,
  gender: "male",
  state: "Karnataka",
  occupation: "salaried",
  annualIncomeInr: 450000,
  married: true,
  children: [{ age: 6, gender: "female" }],
  hasDisability: false,
  paysIncomeTax: true,
  hasDrivingLicence: true,
  ownsVehicle: true,
  // derived convenience fields consumed by the eligibility matcher
  hasBankAccount: true,
  ownsLand: false,
  childCount: 1,
  youngestChildAge: 6,
  youngestGirlChildAge: 6,
};

/**
 * Mock DigiLocker payload — what a real DigiLocker "issued documents" API
 * would return after user consent. Values intentionally realistic.
 * NOTE: ADDRESS_PROOF is deliberately ABSENT so the UI can demonstrate
 * the "document missing -> task needs your attention" path.
 */
export const MOCK_DIGILOCKER_DOCS: DigilockerDocument[] = [
  {
    type: "AADHAAR",
    issuer: "UIDAI",
    verified: true,
    fields: {
      name: "Antas Jain",
      dob: "1999-03-14",
      gender: "male",
      address: "12/3, Indiranagar 100ft Road, Bengaluru, Karnataka - 560038",
      aadhaarLast4: "4421",
    },
  },
  {
    type: "PAN",
    issuer: "Income Tax Department",
    verified: true,
    fields: {
      name: "ANTAS JAIN",
      panNumber: "ABCDE1234F",
      dob: "14/03/1999",
    },
  },
  {
    type: "BANK_PASSBOOK",
    issuer: "State Bank of India",
    verified: true,
    fields: {
      accountNumber: "XXXXXX8842",
      ifsc: "SBIN0003074",
      bankName: "State Bank of India",
    },
  },
  {
    type: "DL",
    issuer: "Transport Dept. Karnataka",
    verified: true,
    fields: {
      dlNumber: "KA0520190001234",
      name: "Antas Jain",
      validTill: "2039-08-11",
    },
  },
  {
    type: "VEHICLE_RC",
    issuer: "Transport Dept. Maharashtra",
    verified: true,
    fields: {
      registrationNumber: "MH12QR4567",
      ownerName: "Antas Jain",
      make: "Maruti Suzuki Baleno",
      registeredState: "Maharashtra",
    },
  },
  {
    type: "VEHICLE_INSURANCE",
    issuer: "ICICI Lombard",
    verified: true,
    fields: {
      policyNumber: "MOT/2026/88412",
      vehicleNumber: "MH12QR4567",
      validTill: "2027-03-31",
    },
  },
  // PUC deliberately absent -> vehicle-noc shows the action_required state
];

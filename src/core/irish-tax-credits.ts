/** Irish income-tax credits for 2026. Credits cut the tax bill euro for euro, not taxable pay. */

import type { TaxStatus } from "./irish-income-tax";

export const IE_PERSONAL_CREDIT_SINGLE = 2_000;
export const IE_PERSONAL_CREDIT_MARRIED = 4_000;
export const IE_EMPLOYEE_CREDIT = 2_000;
export const IE_EMPLOYEE_CREDIT_FULL_AT = 10_000;
export const IE_RENT_CREDIT_SINGLE = 2_000;
export const IE_RENT_CREDIT_JOINT = 4_000;
export const IE_AGE_CREDIT = 245;
export const IE_AGE_CREDIT_MIN_AGE = 65;
export const IE_HOME_CARER_CREDIT = 1_950;
export const IE_SPCCC_CREDIT = 1_900;
export const IE_INCAPACITATED_CHILD_CREDIT = 3_800;
export const IE_HEALTH_INSURANCE_RELIEF_PCT = 20;

export interface CreditLine {
  id: string;
  label: string;
  amount: number;
}

export interface CreditSituation {
  taxStatus: TaxStatus;
  payeIncome: number;
  age: number;
  claimRent: boolean;
  claimAgeCredit: boolean;
  claimHomeCarer: boolean;
  claimIncapacitatedChild: boolean;
  healthInsurancePremium: number;
}

export function personalCreditForStatus(status: TaxStatus): number {
  return status === "married_one" || status === "married_two"
    ? IE_PERSONAL_CREDIT_MARRIED
    : IE_PERSONAL_CREDIT_SINGLE;
}

export function employeeCreditForIncome(payeIncome: number): number {
  if (payeIncome <= 0) return 0;
  return Math.min(IE_EMPLOYEE_CREDIT, payeIncome * 0.2);
}

export function rentCreditForStatus(status: TaxStatus): number {
  return status === "married_one" || status === "married_two"
    ? IE_RENT_CREDIT_JOINT
    : IE_RENT_CREDIT_SINGLE;
}

export function deriveTaxCredits(situation: CreditSituation): CreditLine[] {
  const lines: CreditLine[] = [
    { id: "personal", label: "Personal", amount: personalCreditForStatus(situation.taxStatus) },
    { id: "employee", label: "Employee (PAYE)", amount: employeeCreditForIncome(situation.payeIncome) },
  ];
  if (situation.taxStatus === "spccc") {
    lines.push({ id: "spccc", label: "Single person child carer", amount: IE_SPCCC_CREDIT });
  }
  if (situation.claimRent) {
    lines.push({ id: "rent", label: "Rent", amount: rentCreditForStatus(situation.taxStatus) });
  }
  if (situation.claimAgeCredit && situation.age >= IE_AGE_CREDIT_MIN_AGE) {
    lines.push({ id: "age", label: "Age", amount: IE_AGE_CREDIT });
  }
  if (situation.claimHomeCarer && situation.taxStatus === "married_one") {
    lines.push({ id: "home_carer", label: "Home carer", amount: IE_HOME_CARER_CREDIT });
  }
  if (situation.claimIncapacitatedChild) {
    lines.push({
      id: "incapacitated_child",
      label: "Incapacitated child",
      amount: IE_INCAPACITATED_CHILD_CREDIT,
    });
  }
  if (situation.healthInsurancePremium > 0) {
    lines.push({
      id: "health_insurance",
      label: "Health insurance relief",
      amount: situation.healthInsurancePremium * (IE_HEALTH_INSURANCE_RELIEF_PCT / 100),
    });
  }
  return lines.filter((line) => line.amount > 0);
}

export function sumCredits(lines: CreditLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

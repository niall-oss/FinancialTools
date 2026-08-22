/** Irish My Future Fund (auto-enrolment) rules from 2026. */

export const IE_AE_EARNINGS_CAP = 80_000;
export const IE_AE_MIN_ANNUAL_EARNINGS = 20_000;
export const IE_AE_LOOKBACK_13W_EARNINGS = 5_000;
export const IE_AE_AUTO_MIN_AGE = 23;
export const IE_AE_AUTO_MAX_AGE = 60;
export const IE_AE_OPT_IN_MIN_AGE = 18;
export const IE_STATE_PENSION_AGE = 66;
export const IE_AE_ADMIN_FEE_WEEKLY = 0.55;
export const IE_AE_DEFAULT_AUM_FEE_PCT = 0.04;
export const IE_AE_WEEKS_PER_YEAR = 52;
export const IE_AE_SCHEME_START_YEAR = 2026;

export const IE_AE_EXEMPT_EMPLOYER_PCT = 1.5;
export const IE_AE_EXEMPT_EMPLOYER_CAP = 1_200;
export const IE_AE_EXEMPT_TOTAL_PCT = 3.5;
export const IE_AE_EXEMPT_TOTAL_CAP = 2_800;

export type AeEmploymentType = "paye" | "self_employed";

export type AeEligibilityKind =
  | "auto_enrolled"
  | "opt_in"
  | "exempt"
  | "ineligible_self_employed"
  | "ineligible_age";

export interface AePhase {
  label: string;
  fromYear: number;
  toYear: number | null;
  employeePct: number;
  employerPct: number;
  statePct: number;
}

export const AE_PHASES: AePhase[] = [
  { label: "2026–28", fromYear: 2026, toYear: 2028, employeePct: 1.5, employerPct: 1.5, statePct: 0.5 },
  { label: "2029–31", fromYear: 2029, toYear: 2031, employeePct: 3, employerPct: 3, statePct: 1 },
  { label: "2032–34", fromYear: 2032, toYear: 2034, employeePct: 4.5, employerPct: 4.5, statePct: 1.5 },
  { label: "2035+", fromYear: 2035, toYear: null, employeePct: 6, employerPct: 6, statePct: 2 },
];

export interface AeContributions {
  assessable: number;
  employee: number;
  employer: number;
  state: number;
  total: number;
  employeePct: number;
  employerPct: number;
  statePct: number;
  capBinds: boolean;
}

export function aeRatesForYear(year: number): AePhase {
  const calendar = Math.max(Math.floor(year), IE_AE_SCHEME_START_YEAR);
  const phase = AE_PHASES.find(
    (row) => calendar >= row.fromYear && (row.toYear === null || calendar <= row.toYear),
  );
  return phase ?? AE_PHASES[AE_PHASES.length - 1];
}

export function assessablePay(gross: number): number {
  return Math.max(0, Math.min(gross, IE_AE_EARNINGS_CAP));
}

export function aeContributions(gross: number, year: number): AeContributions {
  const rates = aeRatesForYear(year);
  const assessable = assessablePay(gross);
  const employee = assessable * (rates.employeePct / 100);
  const employer = assessable * (rates.employerPct / 100);
  const state = assessable * (rates.statePct / 100);
  return {
    assessable,
    employee,
    employer,
    state,
    total: employee + employer + state,
    employeePct: rates.employeePct,
    employerPct: rates.employerPct,
    statePct: rates.statePct,
    capBinds: gross > IE_AE_EARNINGS_CAP + 1e-9,
  };
}

export function annualAdminFee(weekly = IE_AE_ADMIN_FEE_WEEKLY, contributing = true): number {
  return contributing ? weekly * IE_AE_WEEKS_PER_YEAR : 0;
}

export function yearsUntilStatePension(age: number): number {
  return Math.max(0, IE_STATE_PENSION_AGE - Math.floor(age));
}

export function meetsEarningsThreshold(annualEarnings: number, thirteenWeekEarnings?: number): boolean {
  if (annualEarnings >= IE_AE_MIN_ANNUAL_EARNINGS) return true;
  return thirteenWeekEarnings !== undefined && thirteenWeekEarnings > IE_AE_LOOKBACK_13W_EARNINGS;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function exemptEmployerFloor(gross: number): number {
  return round2(Math.min(Math.max(0, gross) * (IE_AE_EXEMPT_EMPLOYER_PCT / 100), IE_AE_EXEMPT_EMPLOYER_CAP));
}

export function exemptTotalFloor(gross: number): number {
  return round2(Math.min(Math.max(0, gross) * (IE_AE_EXEMPT_TOTAL_PCT / 100), IE_AE_EXEMPT_TOTAL_CAP));
}

export function isExemptEmployment(
  gross: number,
  employeeAnnual: number,
  employerAnnual: number,
): boolean {
  const employer = Math.max(0, employerAnnual);
  const employee = Math.max(0, employeeAnnual);
  return employer + 1e-9 >= exemptEmployerFloor(gross) && employee + employer + 1e-9 >= exemptTotalFloor(gross);
}

export function exemptionFloorContributions(gross: number): { employee: number; employer: number } {
  const employer = exemptEmployerFloor(gross);
  const total = exemptTotalFloor(gross);
  return { employer, employee: Math.max(0, total - employer) };
}

export function matchAeRates(gross: number, year: number): {
  employee: number;
  employer: number;
  employeePct: number;
  employerPct: number;
} {
  const ae = aeContributions(gross, year);
  return {
    employeePct: ae.employeePct,
    employerPct: ae.employerPct,
    employee: Math.max(0, gross) * (ae.employeePct / 100),
    employer: Math.max(0, gross) * (ae.employerPct / 100),
  };
}

export function canOptIn(employmentType: AeEmploymentType, age: number, exempt: boolean): boolean {
  if (employmentType !== "paye" || exempt) return false;
  return age >= IE_AE_OPT_IN_MIN_AGE && age < IE_STATE_PENSION_AGE;
}

export function isAutoEnrolled(input: {
  employmentType: AeEmploymentType;
  age: number;
  earnings: number;
  exempt: boolean;
  thirteenWeekEarnings?: number;
}): boolean {
  if (input.employmentType !== "paye" || input.exempt) return false;
  if (input.age < IE_AE_AUTO_MIN_AGE || input.age > IE_AE_AUTO_MAX_AGE) return false;
  return meetsEarningsThreshold(input.earnings, input.thirteenWeekEarnings);
}

export function aeEligibility(input: {
  employmentType: AeEmploymentType;
  age: number;
  earnings: number;
  exempt: boolean;
  thirteenWeekEarnings?: number;
}): AeEligibilityKind {
  if (input.employmentType === "self_employed") return "ineligible_self_employed";
  if (input.age < IE_AE_OPT_IN_MIN_AGE || input.age >= IE_STATE_PENSION_AGE) return "ineligible_age";
  if (input.exempt) return "exempt";
  if (isAutoEnrolled(input)) return "auto_enrolled";
  if (canOptIn(input.employmentType, input.age, input.exempt)) return "opt_in";
  return "ineligible_age";
}

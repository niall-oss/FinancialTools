import {
  calculateIrishIncomeTax,
  getMarginalIrishIncomeTaxRatePct,
  standardRateBandForStatus,
  type TaxIeParams,
  type TaxStatus,
} from "../../core/irish-income-tax";
import {
  aeContributions,
  aeEligibility,
  annualAdminFee,
  exemptionFloorContributions,
  IE_AE_EARNINGS_CAP,
  IE_AE_MIN_ANNUAL_EARNINGS,
  IE_AE_SCHEME_START_YEAR,
  IE_STATE_PENSION_AGE,
  isExemptEmployment,
  matchAeRates,
  type AeEligibilityKind,
  type AeEmploymentType,
  AE_PHASES,
} from "../../core/irish-auto-enrolment";
import { calculatePrsi, calculateUsc } from "../../core/irish-payroll-tax";
import { IE_PENSION_STANDARD_FUND_THRESHOLD } from "../../core/irish-pension-rules";
import {
  runPensionPlan,
  type PayrollBreakdown,
  type SchemeType,
} from "../pension/engine";

export type Participation = "stay" | "opt_out" | "suspend";
export type ComparePreset = "custom" | "exemption_floor" | "match_ae";

export interface AutoEnrolInput {
  age: number;
  salary: number;
  employmentType: AeEmploymentType;
  taxStatus: TaxStatus;
  otherIncome: number;
  enrolmentYear: number;
  participation: Participation;
  hasPayrollPension: boolean;
  compareScheme: SchemeType;
  comparePreset: ComparePreset;
  altEmployeeAnnual: number;
  altEmployeePct: number;
  altEmployerAnnual: number;
  currentFund: number;
  yearsToContribute: number;
  annualReturnPct: number;
  aeAnnualFeePct: number;
  altAnnualFeePct: number;
  adminFeeWeekly: number;
  tax: TaxIeParams;
}

export interface AeYearCash {
  employee: number;
  employer: number;
  state: number;
  total: number;
  adminFee: number;
  activeFraction: number;
}

export interface AeTrack {
  employee: number;
  employer: number;
  state: number;
  totalIntoPot: number;
  adminFee: number;
  taxSaved: number;
  netCost: number;
  potPerNetCost: number;
  breakdown: PayrollBreakdown;
  capBinds: boolean;
  assessable: number;
  employeePct: number;
  employerPct: number;
  statePct: number;
}

export interface AltTrack {
  employee: number;
  employer: number;
  totalIntoPot: number;
  taxSaved: number;
  netCost: number;
  potPerNetCost: number;
  breakdown: PayrollBreakdown;
  unusedHeadroom: number;
  employerBikExcess: number;
  meetsExemption: boolean;
}

export interface PhaseRow {
  label: string;
  employee: number;
  employer: number;
  state: number;
  total: number;
}

export interface AeProjectionPoint {
  year: number;
  calendarYear: number;
  age: number;
  aeBalance: number;
  altBalance: number;
  aeEmployee: number;
  aeEmployer: number;
  aeState: number;
  aeAdminFee: number;
}

export interface SalarySweepPoint {
  salary: number;
  aePotPerNet: number;
  altPotPerNet: number;
}

export interface AutoEnrolResult {
  eligibility: AeEligibilityKind;
  ae: AeTrack;
  none: PayrollBreakdown;
  alt: AltTrack;
  phaseSchedule: PhaseRow[];
  projection: AeProjectionPoint[];
  salarySweep: SalarySweepPoint[];
  warnings: string[];
  aePutsMoreInPot: boolean;
  altCostsLessTakeHome: boolean;
  sftBreached: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function potPerNet(intoPot: number, netCost: number): number {
  if (netCost <= 0.5) return 0;
  return round2(intoPot / netCost);
}

function payrollBreakdown(
  gross: number,
  employeePensionCash: number,
  relievable: number,
  tax: TaxIeParams,
  status: TaxStatus,
  otherIncome: number,
  employmentType: AeEmploymentType,
): PayrollBreakdown {
  const taxableIncome = Math.max(0, gross - relievable);
  const band = standardRateBandForStatus(tax, status, otherIncome);
  const incomeTax = calculateIrishIncomeTax(taxableIncome, tax, status, otherIncome);
  const taxedAtStandard = Math.min(Math.max(0, taxableIncome), band);
  const taxedAtHigher = Math.max(0, taxableIncome - band);
  const selfEmployed = employmentType === "self_employed";
  const usc = calculateUsc(gross, selfEmployed);
  const prsi = calculatePrsi(gross, selfEmployed);
  const takeHome = gross - incomeTax - usc - prsi - employeePensionCash;
  return {
    gross,
    employeePension: employeePensionCash,
    taxableIncome,
    incomeTax: round2(incomeTax),
    incomeTaxStandard: round2(taxedAtStandard * (tax.standardRatePct / 100)),
    incomeTaxHigher: round2(taxedAtHigher * (tax.higherRatePct / 100)),
    usc: round2(usc),
    prsi: round2(prsi),
    takeHome: round2(takeHome),
  };
}

function aeYearCash(
  salary: number,
  calendarYear: number,
  participation: Participation,
  yearIndex: number,
  adminFeeWeekly: number,
): AeYearCash {
  const full = aeContributions(salary, calendarYear);
  const adminFull = annualAdminFee(adminFeeWeekly, true);

  if (participation === "opt_out" && yearIndex === 1) {
    const fraction = 7 / 12;
    return {
      employee: 0,
      employer: full.employer * fraction,
      state: full.state * fraction,
      total: (full.employer + full.state) * fraction,
      adminFee: adminFull * fraction,
      activeFraction: fraction,
    };
  }
  if (participation === "opt_out" && yearIndex === 2) {
    return { employee: 0, employer: 0, state: 0, total: 0, adminFee: 0, activeFraction: 0 };
  }
  if (participation === "suspend" && yearIndex === 1) {
    const fraction = 6 / 12;
    return {
      employee: full.employee * fraction,
      employer: full.employer * fraction,
      state: full.state * fraction,
      total: full.total * fraction,
      adminFee: adminFull * fraction,
      activeFraction: fraction,
    };
  }
  if (participation === "suspend" && yearIndex === 2) {
    return { employee: 0, employer: 0, state: 0, total: 0, adminFee: 0, activeFraction: 0 };
  }

  return {
    employee: full.employee,
    employer: full.employer,
    state: full.state,
    total: full.total,
    adminFee: adminFull,
    activeFraction: 1,
  };
}

function aeThisYearTrack(input: AutoEnrolInput): AeTrack {
  const year = Math.max(Math.floor(input.enrolmentYear), IE_AE_SCHEME_START_YEAR);
  const full = aeContributions(input.salary, year);
  const contributing = input.employmentType === "paye";
  const employee = contributing ? full.employee : 0;
  const employer = contributing ? full.employer : 0;
  const state = contributing ? full.state : 0;
  const adminFee = contributing ? annualAdminFee(input.adminFeeWeekly, true) : 0;
  const breakdown = payrollBreakdown(
    input.salary,
    employee,
    0,
    input.tax,
    input.taxStatus,
    input.otherIncome,
    input.employmentType,
  );
  const totalIntoPot = employee + employer + state;
  return {
    employee: round2(employee),
    employer: round2(employer),
    state: round2(state),
    totalIntoPot: round2(totalIntoPot),
    adminFee: round2(adminFee),
    taxSaved: 0,
    netCost: round2(employee),
    potPerNetCost: potPerNet(totalIntoPot, employee),
    breakdown,
    capBinds: contributing && full.capBinds,
    assessable: round2(full.assessable),
    employeePct: full.employeePct,
    employerPct: full.employerPct,
    statePct: full.statePct,
  };
}

function projectBalances(input: AutoEnrolInput): AeProjectionPoint[] {
  const horizon = Math.max(0, Math.floor(input.yearsToContribute));
  const startYear = Math.max(Math.floor(input.enrolmentYear), IE_AE_SCHEME_START_YEAR);
  const aeNet = (input.annualReturnPct - input.aeAnnualFeePct) / 100;
  const altNet = (input.annualReturnPct - input.altAnnualFeePct) / 100;
  const altAnnual = Math.max(0, input.altEmployeeAnnual) + Math.max(0, input.altEmployerAnnual);
  let aeFund = Math.max(0, input.currentFund);
  let altFund = Math.max(0, input.currentFund);
  const points: AeProjectionPoint[] = [];
  const aeAllowed = input.employmentType === "paye";

  for (let year = 1; year <= horizon; year++) {
    const calendarYear = startYear + year - 1;
    const age = input.age + year - 1;
    const cash = aeAllowed
      ? aeYearCash(input.salary, calendarYear, input.participation, year, input.adminFeeWeekly)
      : { employee: 0, employer: 0, state: 0, total: 0, adminFee: 0, activeFraction: 0 };
    aeFund = Math.max(0, aeFund * (1 + aeNet) + cash.total - cash.adminFee);
    altFund = Math.max(0, altFund * (1 + altNet) + altAnnual);
    points.push({
      year,
      calendarYear,
      age,
      aeBalance: round2(aeFund),
      altBalance: round2(altFund),
      aeEmployee: round2(cash.employee),
      aeEmployer: round2(cash.employer),
      aeState: round2(cash.state),
      aeAdminFee: round2(cash.adminFee),
    });
  }
  return points;
}

function altAtSalary(input: AutoEnrolInput, salary: number, year: number): {
  employee: number;
  employer: number;
} {
  if (input.comparePreset === "exemption_floor") {
    return exemptionFloorContributions(salary);
  }
  if (input.comparePreset === "match_ae") {
    const match = matchAeRates(salary, year);
    return { employee: match.employee, employer: match.employer };
  }
  const employeePct = Math.max(0, input.altEmployeePct) / 100;
  const employerPct = input.salary > 0 ? Math.max(0, input.altEmployerAnnual) / input.salary : 0;
  return { employee: salary * employeePct, employer: salary * employerPct };
}

function salarySweep(input: AutoEnrolInput): SalarySweepPoint[] {
  const points: SalarySweepPoint[] = [];
  const year = Math.max(Math.floor(input.enrolmentYear), IE_AE_SCHEME_START_YEAR);
  for (let salary = 20_000; salary <= 120_000 + 1e-9; salary += 5_000) {
    const ae = aeContributions(salary, year);
    const aeInto = ae.total;
    const aeNet = ae.employee;
    const alt = altAtSalary(input, salary, year);
    const altEmployee = alt.employee;
    const altEmployer = alt.employer;
    const pension = runPensionPlan({
      age: input.age,
      relevantEarnings: salary,
      employmentType: input.employmentType,
      taxStatus: input.taxStatus,
      otherIncome: input.otherIncome,
      sportsperson: false,
      schemeType: input.compareScheme,
      employeeAnnual: altEmployee,
      employeePctOfEarnings: Math.max(0, input.altEmployeePct),
      employerAnnual: altEmployer,
      avcAnnual: 0,
      broughtForwardUnrelieved: 0,
      extraEmployeePct: 0,
      currentFund: 0,
      yearsToContribute: 0,
      annualReturnPct: input.annualReturnPct,
      annualFeePct: input.altAnnualFeePct,
      tax: input.tax,
    });
    points.push({
      salary,
      aePotPerNet: potPerNet(aeInto, aeNet),
      altPotPerNet: potPerNet(altEmployee + altEmployer, pension.plan.netCost),
    });
  }
  return points;
}

export function runAutoEnrolPlan(input: AutoEnrolInput): AutoEnrolResult {
  const salary = Math.max(0, input.salary);
  const altEmployee = Math.max(0, input.altEmployeeAnnual);
  const altEmployer = input.employmentType === "self_employed" ? 0 : Math.max(0, input.altEmployerAnnual);
  const meetsExemption = isExemptEmployment(salary, altEmployee, altEmployer);
  const exemptNow = input.hasPayrollPension && meetsExemption;
  const eligibility = aeEligibility({
    employmentType: input.employmentType,
    age: input.age,
    earnings: salary,
    exempt: exemptNow,
  });

  const none = payrollBreakdown(salary, 0, 0, input.tax, input.taxStatus, input.otherIncome, input.employmentType);
  const ae = aeThisYearTrack({ ...input, salary });

  const pension = runPensionPlan({
    age: input.age,
    relevantEarnings: salary,
    employmentType: input.employmentType,
    taxStatus: input.taxStatus,
    otherIncome: input.otherIncome,
    sportsperson: false,
    schemeType: input.compareScheme,
    employeeAnnual: altEmployee,
    employeePctOfEarnings: salary > 0 ? (altEmployee / salary) * 100 : 0,
    employerAnnual: altEmployer,
    avcAnnual: 0,
    broughtForwardUnrelieved: 0,
    extraEmployeePct: 0,
    currentFund: input.currentFund,
    yearsToContribute: input.yearsToContribute,
    annualReturnPct: input.annualReturnPct,
    annualFeePct: input.altAnnualFeePct,
    tax: input.tax,
  });

  const altInto = altEmployee + altEmployer;
  const alt: AltTrack = {
    employee: round2(altEmployee),
    employer: round2(altEmployer),
    totalIntoPot: round2(altInto),
    taxSaved: pension.plan.taxSaved,
    netCost: pension.plan.netCost,
    potPerNetCost: potPerNet(altInto, pension.plan.netCost),
    breakdown: pension.plan.breakdown,
    unusedHeadroom: pension.unusedHeadroom,
    employerBikExcess: pension.employerBikExcess,
    meetsExemption,
  };

  const phaseSchedule: PhaseRow[] = AE_PHASES.map((phase) => {
    const row = aeContributions(salary, phase.fromYear);
    return {
      label: phase.label,
      employee: round2(row.employee),
      employer: round2(row.employer),
      state: round2(row.state),
      total: round2(row.total),
    };
  });

  const projection = projectBalances({ ...input, salary, altEmployeeAnnual: altEmployee, altEmployerAnnual: altEmployer });
  const sweepInput = { ...input, salary, altEmployeeAnnual: altEmployee, altEmployerAnnual: altEmployer };
  const sweep = salarySweep(sweepInput);

  const warnings: string[] = [];
  if (eligibility === "ineligible_self_employed") {
    warnings.push(
      "My Future Fund is for employees on payroll. Self-employed people use a PRSA or RAC instead.",
    );
  }
  if (eligibility === "ineligible_age") {
    warnings.push(
      input.age < 18
        ? "You must be at least 18 to opt in, and 23 to be auto-enrolled."
        : `Access is at State Pension age ${IE_STATE_PENSION_AGE}. You cannot join or keep contributing from that age.`,
    );
  }
  if (eligibility === "opt_in") {
    if (input.age < 23 || input.age > 60) {
      warnings.push(
        `Age ${Math.floor(input.age)} is outside 23 to 60, so you would not be auto-enrolled. You can still opt in as an employee under ${IE_STATE_PENSION_AGE}.`,
      );
    } else if (salary < IE_AE_MIN_ANNUAL_EARNINGS) {
      warnings.push(
        `Earnings are below the €${IE_AE_MIN_ANNUAL_EARNINGS.toLocaleString("en-IE")} auto-enrol threshold. You can still opt in.`,
      );
    }
  }
  if (eligibility === "exempt") {
    warnings.push(
      "This employment looks exempt: the workplace scheme meets the 1.5% employer / 3.5% total floors. You would not be enrolled in My Future Fund.",
    );
  }
  if (input.hasPayrollPension && !meetsExemption && input.employmentType === "paye") {
    warnings.push(
      "The workplace rates sit below the exemption floors, so you can be in My Future Fund and that scheme at the same time until the scheme is topped up.",
    );
  }
  if (ae.capBinds) {
    warnings.push(
      `AE contributions stop once gross pay in this employment hits €${IE_AE_EARNINGS_CAP.toLocaleString("en-IE")}. Occupational/PRSA relief can use earnings up to €115,000. A payslip that crosses the cap can still be charged in full with no refund; this calculator uses the annual cap only.`,
    );
  }
  const band = standardRateBandForStatus(input.tax, input.taxStatus, input.otherIncome);
  const marginal = getMarginalIrishIncomeTaxRatePct(salary, input.tax, input.taxStatus, input.otherIncome);
  if (marginal >= input.tax.higherRatePct && salary > band) {
    warnings.push(
      `You pay ${input.tax.higherRatePct}% income tax on the top slice. Occupational/PRSA relief at that rate beats the 25% State top-up equivalent. Compare net cost and money into the pot.`,
    );
  }
  if (pension.employerBikExcess > 0) {
    warnings.push(
      `Employer PRSA contributions exceed 100% of earnings. The excess (€${Math.round(pension.employerBikExcess).toLocaleString("en-IE")}) is a taxable benefit in kind.`,
    );
  }

  const sftBreached = projection.some(
    (point) =>
      point.aeBalance > IE_PENSION_STANDARD_FUND_THRESHOLD
      || point.altBalance > IE_PENSION_STANDARD_FUND_THRESHOLD,
  );
  if (sftBreached) {
    warnings.push(
      `A projection crosses the €${IE_PENSION_STANDARD_FUND_THRESHOLD.toLocaleString("en-IE")} Standard Fund Threshold. Chargeable excess tax is not modelled here.`,
    );
  }

  return {
    eligibility,
    ae,
    none,
    alt,
    phaseSchedule,
    projection,
    salarySweep: sweep,
    warnings,
    aePutsMoreInPot: ae.totalIntoPot > alt.totalIntoPot + 0.5,
    altCostsLessTakeHome: alt.netCost + 0.5 < ae.netCost,
    sftBreached,
  };
}

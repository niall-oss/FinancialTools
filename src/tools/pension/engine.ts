import {
  calculateIrishIncomeTax,
  standardRateBandForStatus,
  type TaxIeParams,
  type TaxStatus,
} from "../../core/irish-income-tax";
import {
  calculatePrsi,
  calculateUsc,
} from "../../core/irish-payroll-tax";
import {
  IE_PENSION_EARNINGS_CAP,
  IE_PENSION_STANDARD_FUND_THRESHOLD,
  IE_PRSA_EMPLOYER_LIMIT_PCT,
  maxRelievableContribution,
  nextPensionAgeBand,
  PENSION_AGE_BANDS,
  pensionAgeBandForAge,
  pensionReliefPct,
  type PensionAgeBand,
} from "../../core/irish-pension-rules";

export type EmploymentType = "paye" | "self_employed";
export type SchemeType = "occupational" | "prsa";

export interface PensionInput {
  age: number;
  relevantEarnings: number;
  employmentType: EmploymentType;
  taxStatus: TaxStatus;
  otherIncome: number;
  sportsperson: boolean;
  schemeType: SchemeType;
  employeeAnnual: number;
  employeePctOfEarnings: number;
  employerAnnual: number;
  avcAnnual: number;
  broughtForwardUnrelieved: number;
  extraEmployeePct: number;
  currentFund: number;
  yearsToContribute: number;
  annualReturnPct: number;
  annualFeePct: number;
  tax: TaxIeParams;
  compareTax?: TaxIeParams;
}

export interface AgeBandRow extends PensionAgeBand {
  maxContribution: number;
  isCurrent: boolean;
}

export interface PayrollBreakdown {
  gross: number;
  employeePension: number;
  taxableIncome: number;
  incomeTax: number;
  incomeTaxStandard: number;
  incomeTaxHigher: number;
  usc: number;
  prsi: number;
  takeHome: number;
}

export interface AnnualRelief {
  breakdown: PayrollBreakdown;
  taxSaved: number;
  taxSavedStandard: number;
  taxSavedHigher: number;
  effectiveReliefPct: number;
  netCost: number;
  relievable: number;
}

export interface IncreasePoint {
  contribPct: number;
  taxSaved: number;
  netCost: number;
  takeHome: number;
  taxSavedProposed?: number;
  netCostProposed?: number;
  takeHomeProposed?: number;
}

export interface ProjectionPoint {
  year: number;
  age: number;
  holdEuro: number;
  holdPct: number;
  alwaysMax: number;
}

export interface PensionResult {
  agePct: number;
  cappedEarnings: number;
  maxRelievable: number;
  employeeCash: number;
  relievable: number;
  excess: number;
  unusedHeadroom: number;
  allowanceUsedPct: number;
  currentBand: AgeBandRow;
  nextBand: AgeBandRow | null;
  yearsUntilNextBand: number | null;
  ageBandRows: AgeBandRow[];
  monthlyEmployee: number;
  monthlyEmployer: number;
  employerBikHeadroom: number;
  employerBikExcess: number;
  warnings: string[];
  none: AnnualRelief;
  plan: AnnualRelief;
  maxed: AnnualRelief;
  extra: AnnualRelief;
  compare?: {
    none: AnnualRelief;
    plan: AnnualRelief;
    maxed: AnnualRelief;
    extra: AnnualRelief;
    deltaTaxSaved: number;
    deltaTakeHome: number;
    deltaEffectiveReliefPct: number;
  };
  increaseSeries: IncreasePoint[];
  projection: ProjectionPoint[];
  sftBreached: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function payrollBreakdown(
  gross: number,
  employeePensionCash: number,
  relievable: number,
  tax: TaxIeParams,
  status: TaxStatus,
  otherIncome: number,
  employmentType: EmploymentType,
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

function relievableForCash(
  employeeCash: number,
  broughtForward: number,
  maxRelievable: number,
): { relievable: number; excess: number } {
  const towardsLimit = Math.max(0, employeeCash) + Math.max(0, broughtForward);
  const relievable = Math.min(towardsLimit, Math.max(0, maxRelievable));
  return { relievable, excess: Math.max(0, towardsLimit - relievable) };
}

function annualRelief(
  input: PensionInput,
  tax: TaxIeParams,
  employeeCash: number,
  maxRelievable: number,
  broughtForward = input.broughtForwardUnrelieved,
): AnnualRelief {
  const { relievable } = relievableForCash(employeeCash, broughtForward, maxRelievable);
  const withPension = payrollBreakdown(
    input.relevantEarnings,
    employeeCash,
    relievable,
    tax,
    input.taxStatus,
    input.otherIncome,
    input.employmentType,
  );
  const none = payrollBreakdown(
    input.relevantEarnings,
    0,
    0,
    tax,
    input.taxStatus,
    input.otherIncome,
    input.employmentType,
  );
  const taxSaved = round2(none.incomeTax - withPension.incomeTax);
  const taxSavedStandard = round2(none.incomeTaxStandard - withPension.incomeTaxStandard);
  const taxSavedHigher = round2(none.incomeTaxHigher - withPension.incomeTaxHigher);
  return {
    breakdown: withPension,
    taxSaved,
    taxSavedStandard,
    taxSavedHigher,
    effectiveReliefPct: relievable > 0 ? round2((taxSaved / relievable) * 100) : 0,
    netCost: round2(employeeCash - taxSaved),
    relievable,
  };
}

function ageBandRows(earnings: number, age: number, sportsperson: boolean): AgeBandRow[] {
  const capped = Math.max(0, Math.min(earnings, IE_PENSION_EARNINGS_CAP));
  return PENSION_AGE_BANDS.map((band) => {
    const pct =
      sportsperson && band.maxAge !== null && band.maxAge < 50
        ? Math.max(band.pct, 30)
        : band.pct;
    const current = pensionAgeBandForAge(age);
    return {
      ...band,
      pct,
      maxContribution: round2(capped * (pct / 100)),
      isCurrent: band.minAge === current.minAge,
    };
  });
}

function buildIncreaseSeries(input: PensionInput, maxRelievable: number, agePct: number): IncreasePoint[] {
  const earnings = Math.max(0, input.relevantEarnings);
  const points: IncreasePoint[] = [];
  const maxPct = agePct;
  for (let pct = 0; pct <= maxPct + 1e-9; pct += 1) {
    const cash = earnings * (pct / 100);
    const current = annualRelief(input, input.tax, cash, maxRelievable);
    const point: IncreasePoint = {
      contribPct: pct,
      taxSaved: current.taxSaved,
      netCost: current.netCost,
      takeHome: current.breakdown.takeHome,
    };
    if (input.compareTax) {
      const proposed = annualRelief(input, input.compareTax, cash, maxRelievable);
      point.taxSavedProposed = proposed.taxSaved;
      point.netCostProposed = proposed.netCost;
      point.takeHomeProposed = proposed.breakdown.takeHome;
    }
    points.push(point);
  }
  return points;
}

function projectFund(
  startFund: number,
  years: number,
  startAge: number,
  annualReturnPct: number,
  annualFeePct: number,
  contributionForAge: (age: number) => number,
): { year: number; age: number; balance: number }[] {
  const netReturn = (annualReturnPct - annualFeePct) / 100;
  let fund = Math.max(0, startFund);
  const points: { year: number; age: number; balance: number }[] = [];
  const horizon = Math.max(0, Math.floor(years));
  for (let year = 1; year <= horizon; year++) {
    const age = startAge + year - 1;
    fund = fund * (1 + netReturn) + contributionForAge(age);
    points.push({ year, age, balance: round2(fund) });
  }
  return points;
}

export function runPensionPlan(input: PensionInput): PensionResult {
  const earnings = Math.max(0, input.relevantEarnings);
  const cappedEarnings = Math.max(0, Math.min(earnings, IE_PENSION_EARNINGS_CAP));
  const agePct = pensionReliefPct(input.age, input.sportsperson);
  const maxRelievable = maxRelievableContribution(earnings, input.age, input.sportsperson);
  const employeeCash = Math.max(0, input.employeeAnnual + input.avcAnnual);
  const { relievable, excess } = relievableForCash(
    employeeCash,
    input.broughtForwardUnrelieved,
    maxRelievable,
  );
  const unusedHeadroom = Math.max(0, maxRelievable - relievable);
  const rows = ageBandRows(earnings, input.age, input.sportsperson);
  const currentBand = rows.find((row) => row.isCurrent) ?? rows[0];
  const next = nextPensionAgeBand(input.age);
  const nextRow = next ? rows.find((row) => row.minAge === next.minAge) ?? null : null;

  const none = annualRelief(input, input.tax, 0, maxRelievable, 0);
  const plan = annualRelief(input, input.tax, employeeCash, maxRelievable);
  const maxedCash = Math.max(employeeCash, maxRelievable - Math.max(0, input.broughtForwardUnrelieved));
  const maxed = annualRelief(input, input.tax, maxedCash, maxRelievable);
  const extraCash = employeeCash + earnings * (Math.max(0, input.extraEmployeePct) / 100);
  const extra = annualRelief(input, input.tax, extraCash, maxRelievable);

  const employerBikLimit =
    input.employmentType === "paye" && input.schemeType === "prsa"
      ? earnings * (IE_PRSA_EMPLOYER_LIMIT_PCT / 100)
      : Infinity;
  const employerBikExcess =
    Number.isFinite(employerBikLimit) ? Math.max(0, input.employerAnnual - employerBikLimit) : 0;
  const employerBikHeadroom = Number.isFinite(employerBikLimit)
    ? Math.max(0, employerBikLimit - input.employerAnnual)
    : Infinity;

  const warnings: string[] = [];
  if (excess > 0) {
    warnings.push(
      `€${Math.round(excess).toLocaleString("en-IE")} of employee contributions is over this year's relief cap and gets no income-tax relief now. Unused capacity does not carry forward; only paid-but-unrelieved amounts do.`,
    );
  }
  if (unusedHeadroom > 0.5) {
    warnings.push(
      `€${Math.round(unusedHeadroom).toLocaleString("en-IE")} of this year's age-related allowance is unused. That capacity is lost at year end.`,
    );
  }
  const band = standardRateBandForStatus(input.tax, input.taxStatus, input.otherIncome);
  if (plan.breakdown.taxableIncome > band && unusedHeadroom > 0.5) {
    warnings.push(
      `Salary sits above the €${Math.round(band).toLocaleString("en-IE")} standard-rate cut-off. Extra contributions up to that slice get ${input.tax.higherRatePct}% relief first.`,
    );
  }
  if (employerBikExcess > 0) {
    warnings.push(
      `Employer PRSA contributions exceed 100% of earnings. The excess (€${Math.round(employerBikExcess).toLocaleString("en-IE")}) is a taxable benefit in kind.`,
    );
  }

  const holdEuroAnnual = employeeCash + Math.max(0, input.employerAnnual);
  const holdPctAnnual = earnings * (Math.max(0, input.employeePctOfEarnings) / 100)
    + Math.max(0, input.avcAnnual)
    + Math.max(0, input.employerAnnual);
  const holdEuro = projectFund(
    input.currentFund,
    input.yearsToContribute,
    input.age,
    input.annualReturnPct,
    input.annualFeePct,
    () => holdEuroAnnual,
  );
  const holdPct = projectFund(
    input.currentFund,
    input.yearsToContribute,
    input.age,
    input.annualReturnPct,
    input.annualFeePct,
    () => holdPctAnnual,
  );
  const alwaysMax = projectFund(
    input.currentFund,
    input.yearsToContribute,
    input.age,
    input.annualReturnPct,
    input.annualFeePct,
    (age) =>
      maxRelievableContribution(earnings, age, input.sportsperson) + Math.max(0, input.employerAnnual),
  );
  const projection: ProjectionPoint[] = alwaysMax.map((point, index) => ({
    year: point.year,
    age: point.age,
    holdEuro: holdEuro[index]?.balance ?? 0,
    holdPct: holdPct[index]?.balance ?? 0,
    alwaysMax: point.balance,
  }));
  const sftBreached = projection.some(
    (point) =>
      point.holdEuro > IE_PENSION_STANDARD_FUND_THRESHOLD
      || point.holdPct > IE_PENSION_STANDARD_FUND_THRESHOLD
      || point.alwaysMax > IE_PENSION_STANDARD_FUND_THRESHOLD,
  );
  if (sftBreached) {
    warnings.push(
      `A projection crosses the €${IE_PENSION_STANDARD_FUND_THRESHOLD.toLocaleString("en-IE")} Standard Fund Threshold. Chargeable excess tax is not modelled here.`,
    );
  }

  let compare: PensionResult["compare"];
  if (input.compareTax) {
    const compareNone = annualRelief(input, input.compareTax, 0, maxRelievable, 0);
    const comparePlan = annualRelief(input, input.compareTax, employeeCash, maxRelievable);
    const compareMaxed = annualRelief(input, input.compareTax, maxedCash, maxRelievable);
    const compareExtra = annualRelief(input, input.compareTax, extraCash, maxRelievable);
    compare = {
      none: compareNone,
      plan: comparePlan,
      maxed: compareMaxed,
      extra: compareExtra,
      deltaTaxSaved: round2(comparePlan.taxSaved - plan.taxSaved),
      deltaTakeHome: round2(comparePlan.breakdown.takeHome - plan.breakdown.takeHome),
      deltaEffectiveReliefPct: round2(comparePlan.effectiveReliefPct - plan.effectiveReliefPct),
    };
  }

  return {
    agePct,
    cappedEarnings,
    maxRelievable: round2(maxRelievable),
    employeeCash: round2(employeeCash),
    relievable: round2(relievable),
    excess: round2(excess),
    unusedHeadroom: round2(unusedHeadroom),
    allowanceUsedPct: maxRelievable > 0 ? round2((relievable / maxRelievable) * 100) : 0,
    currentBand,
    nextBand: nextRow,
    yearsUntilNextBand: next ? Math.max(0, next.minAge - input.age) : null,
    ageBandRows: rows,
    monthlyEmployee: round2(employeeCash / 12),
    monthlyEmployer: round2(Math.max(0, input.employerAnnual) / 12),
    employerBikHeadroom: Number.isFinite(employerBikHeadroom) ? round2(employerBikHeadroom) : Infinity,
    employerBikExcess: round2(employerBikExcess),
    warnings,
    none,
    plan,
    maxed,
    extra,
    compare,
    increaseSeries: buildIncreaseSeries(input, maxRelievable, agePct),
    projection,
    sftBreached,
  };
}

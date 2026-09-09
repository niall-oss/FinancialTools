import {
  calculateIrishIncomeTax,
  getMarginalIrishIncomeTaxRatePct,
  standardRateBandForStatus,
  type TaxIeParams,
  type TaxStatus,
} from "../../core/irish-income-tax";
import {
  deriveTaxCredits,
  sumCredits,
  type CreditLine,
} from "../../core/irish-tax-credits";
import {
  IE_PRSI_CREDIT_MAX,
  IE_PRSI_CREDIT_TAPER_END,
  IE_PRSI_EXEMPT_AGE,
  IE_PRSI_RATE_FROM_OCT_2026_PCT,
  IE_PRSI_RATE_PCT,
  IE_PRSI_WEEKLY_EXEMPT,
  IE_PRSI_WEEKS_AT_BASE_2026,
  IE_PRSI_WEEKS_AT_OCT_2026,
  IE_USC_REDUCED_INCOME_CAP,
  uscSlices,
  type UscSlice,
} from "../../core/irish-payroll-tax";
import { maxRelievableContribution, pensionEarningsCapWarning, pensionReliefPct } from "../../core/irish-pension-rules";

export interface PayeInput {
  age: number;
  salary: number;
  taxStatus: TaxStatus;
  otherIncome: number;
  employeePension: number;
  flatRateExpenses: number;
  bikHealth: number;
  bikOther: number;
  medicalCard: boolean;
  claimRent: boolean;
  claimAgeCredit: boolean;
  claimHomeCarer: boolean;
  claimIncapacitatedChild: boolean;
  useCreditOverride: boolean;
  creditCertTotal: number;
  tax: TaxIeParams;
}

export interface BandSlice {
  from: number;
  to: number;
  ratePct: number;
  tax: number;
}

export interface PayeBreakdown {
  salary: number;
  age: number;
  bik: number;
  bikHealth: number;
  bikOther: number;
  employeePension: number;
  pensionRelieved: number;
  pensionExcess: number;
  pensionReliefCap: number;
  pensionReliefPct: number;
  flatRateExpenses: number;
  payeIncome: number;
  taxableIncome: number;
  standardBand: number;
  incomeTaxGross: number;
  incomeTaxStandard: number;
  incomeTaxHigher: number;
  incomeTaxSlices: BandSlice[];
  creditLines: CreditLine[];
  creditsDerived: number;
  creditsApplied: number;
  creditsUsed: number;
  unusedCredits: number;
  incomeTax: number;
  uscSlices: UscSlice[];
  usc: number;
  uscReduced: boolean;
  prsi: number;
  prsiWeekly: number;
  takeHome: number;
  monthlyTakeHome: number;
  weeklyTakeHome: number;
  effectiveRatePct: number;
  marginalRatePct: number;
  incomeTaxMarginalPct: number;
}

export interface PayeDelta {
  takeHome: number;
  incomeTax: number;
  usc: number;
  prsi: number;
  employeePension: number;
}

export interface PayeResult {
  current: PayeBreakdown;
  compare: PayeBreakdown | null;
  delta: PayeDelta | null;
  warnings: string[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function weeklyPrsiCredit(weekly: number): number {
  if (weekly <= IE_PRSI_WEEKLY_EXEMPT || weekly > IE_PRSI_CREDIT_TAPER_END) return 0;
  return Math.max(0, IE_PRSI_CREDIT_MAX - (weekly - (IE_PRSI_WEEKLY_EXEMPT + 0.01)) / 6);
}

export function calculateClassAPrsi(income: number, age: number): number {
  if (income <= 0 || age >= IE_PRSI_EXEMPT_AGE) return 0;
  const weekly = income / 52;
  if (weekly <= IE_PRSI_WEEKLY_EXEMPT) return 0;
  const credit = weeklyPrsiCredit(weekly);
  const janSep = Math.max(0, weekly * (IE_PRSI_RATE_PCT / 100) - credit);
  const octDec = Math.max(0, weekly * (IE_PRSI_RATE_FROM_OCT_2026_PCT / 100) - credit);
  return janSep * IE_PRSI_WEEKS_AT_BASE_2026 + octDec * IE_PRSI_WEEKS_AT_OCT_2026;
}

function incomeTaxSlices(
  taxableIncome: number,
  tax: TaxIeParams,
  status: TaxStatus,
  otherIncome: number,
): BandSlice[] {
  const band = standardRateBandForStatus(tax, status, otherIncome);
  const standardPay = Math.min(Math.max(0, taxableIncome), band);
  const higherPay = Math.max(0, taxableIncome - band);
  const slices: BandSlice[] = [];
  if (standardPay > 0) {
    slices.push({
      from: 0,
      to: standardPay,
      ratePct: tax.standardRatePct,
      tax: standardPay * (tax.standardRatePct / 100),
    });
  }
  if (higherPay > 0) {
    slices.push({
      from: band,
      to: taxableIncome,
      ratePct: tax.higherRatePct,
      tax: higherPay * (tax.higherRatePct / 100),
    });
  }
  return slices;
}

function pensionRelief(salary: number, age: number, employeePension: number) {
  const cap = maxRelievableContribution(Math.max(0, salary), age);
  const paid = Math.max(0, employeePension);
  const relieved = Math.min(paid, cap);
  return {
    cap,
    relieved,
    excess: Math.max(0, paid - relieved),
    pct: pensionReliefPct(age),
  };
}

function creditLinesFor(input: PayeInput, payeIncome: number, bikHealth: number, age: number): CreditLine[] {
  if (input.useCreditOverride) {
    const amount = Math.max(0, input.creditCertTotal);
    return amount > 0 ? [{ id: "cert", label: "Tax credit cert", amount }] : [];
  }
  return deriveTaxCredits({
    taxStatus: input.taxStatus,
    payeIncome,
    age,
    claimRent: input.claimRent,
    claimAgeCredit: input.claimAgeCredit,
    claimHomeCarer: input.claimHomeCarer,
    claimIncapacitatedChild: input.claimIncapacitatedChild,
    healthInsurancePremium: Math.max(0, bikHealth),
  });
}

export function runPayeScenario(input: PayeInput): PayeBreakdown {
  return computePayslip(input, input.salary, input.bikHealth, input.bikOther, input.employeePension, input.age);
}

function computePayslip(
  input: PayeInput,
  salary: number,
  bikHealth: number,
  bikOther: number,
  employeePension: number,
  age: number,
): PayeBreakdown {
  const pay = Math.max(0, salary);
  const health = Math.max(0, bikHealth);
  const otherBik = Math.max(0, bikOther);
  const bik = health + otherBik;
  const payeIncome = pay + bik;
  const pension = Math.max(0, employeePension);
  const relief = pensionRelief(pay, age, pension);
  const expenses = Math.max(0, input.flatRateExpenses);
  const taxableIncome = Math.max(0, payeIncome - relief.relieved - expenses);
  const band = standardRateBandForStatus(input.tax, input.taxStatus, input.otherIncome);
  const slices = incomeTaxSlices(taxableIncome, input.tax, input.taxStatus, input.otherIncome);
  const incomeTaxGross = calculateIrishIncomeTax(
    taxableIncome,
    input.tax,
    input.taxStatus,
    input.otherIncome,
  );
  const derivedLines = deriveTaxCredits({
    taxStatus: input.taxStatus,
    payeIncome,
    age,
    claimRent: input.claimRent,
    claimAgeCredit: input.claimAgeCredit,
    claimHomeCarer: input.claimHomeCarer,
    claimIncapacitatedChild: input.claimIncapacitatedChild,
    healthInsurancePremium: health,
  });
  const creditLines = creditLinesFor(input, payeIncome, health, age);
  const creditsDerived = sumCredits(derivedLines);
  const creditsApplied = sumCredits(creditLines);
  const creditsUsed = Math.min(creditsApplied, incomeTaxGross);
  const unusedCredits = Math.max(0, creditsApplied - incomeTaxGross);
  const incomeTax = Math.max(0, incomeTaxGross - creditsApplied);
  const uscReduced = (input.medicalCard || age >= IE_PRSI_EXEMPT_AGE) && payeIncome <= IE_USC_REDUCED_INCOME_CAP;
  const uscBandSlices = uscSlices(payeIncome, { reducedRate: uscReduced });
  const usc = uscBandSlices.reduce((sum, slice) => sum + slice.amount, 0);
  const prsi = calculateClassAPrsi(payeIncome, age);
  const takeHome = pay - incomeTax - usc - prsi - pension;
  const effectiveRatePct = payeIncome > 0 ? ((incomeTax + usc + prsi) / payeIncome) * 100 : 0;
  const bumped = computePayslipBare(input, pay + 1, health, otherBik, pension, age);
  const marginalRatePct = (bumped.incomeTax + bumped.usc + bumped.prsi - incomeTax - usc - prsi) * 100;
  const incomeTaxMarginalPct = getMarginalIrishIncomeTaxRatePct(
    taxableIncome,
    input.tax,
    input.taxStatus,
    input.otherIncome,
  );

  return {
    salary: round2(pay),
    age,
    bik: round2(bik),
    bikHealth: round2(health),
    bikOther: round2(otherBik),
    employeePension: round2(pension),
    pensionRelieved: round2(relief.relieved),
    pensionExcess: round2(relief.excess),
    pensionReliefCap: round2(relief.cap),
    pensionReliefPct: relief.pct,
    flatRateExpenses: round2(expenses),
    payeIncome: round2(payeIncome),
    taxableIncome: round2(taxableIncome),
    standardBand: band,
    incomeTaxGross: round2(incomeTaxGross),
    incomeTaxStandard: round2(slices.find((slice) => slice.ratePct === input.tax.standardRatePct)?.tax ?? 0),
    incomeTaxHigher: round2(slices.find((slice) => slice.ratePct === input.tax.higherRatePct)?.tax ?? 0),
    incomeTaxSlices: slices.map((slice) => ({
      ...slice,
      from: round2(slice.from),
      to: round2(slice.to),
      tax: round2(slice.tax),
    })),
    creditLines: creditLines.map((line) => ({ ...line, amount: round2(line.amount) })),
    creditsDerived: round2(creditsDerived),
    creditsApplied: round2(creditsApplied),
    creditsUsed: round2(creditsUsed),
    unusedCredits: round2(unusedCredits),
    incomeTax: round2(incomeTax),
    uscSlices: uscBandSlices.map((slice) => ({
      ...slice,
      from: round2(slice.from),
      to: round2(slice.to),
      amount: round2(slice.amount),
    })),
    usc: round2(usc),
    uscReduced,
    prsi: round2(prsi),
    prsiWeekly: round2(payeIncome / 52),
    takeHome: round2(takeHome),
    monthlyTakeHome: round2(takeHome / 12),
    weeklyTakeHome: round2(takeHome / 52),
    effectiveRatePct: round2(effectiveRatePct),
    marginalRatePct: round2(marginalRatePct),
    incomeTaxMarginalPct,
  };
}

/** Next-euro helper without rounding, so the marginal rate is not noise from round2. */
function computePayslipBare(
  input: PayeInput,
  salary: number,
  bikHealth: number,
  bikOther: number,
  employeePension: number,
  age: number,
): { incomeTax: number; usc: number; prsi: number } {
  const pay = Math.max(0, salary);
  const health = Math.max(0, bikHealth);
  const otherBik = Math.max(0, bikOther);
  const payeIncome = pay + health + otherBik;
  const relief = pensionRelief(pay, age, employeePension);
  const taxableIncome = Math.max(0, payeIncome - relief.relieved - Math.max(0, input.flatRateExpenses));
  const incomeTaxGross = calculateIrishIncomeTax(
    taxableIncome,
    input.tax,
    input.taxStatus,
    input.otherIncome,
  );
  const creditsApplied = sumCredits(creditLinesFor(input, payeIncome, health, age));
  const incomeTax = Math.max(0, incomeTaxGross - creditsApplied);
  const uscReduced = (input.medicalCard || age >= IE_PRSI_EXEMPT_AGE) && payeIncome <= IE_USC_REDUCED_INCOME_CAP;
  const usc = uscSlices(payeIncome, { reducedRate: uscReduced }).reduce((sum, slice) => sum + slice.amount, 0);
  const prsi = calculateClassAPrsi(payeIncome, age);
  return { incomeTax, usc, prsi };
}

function euro0(value: number): string {
  return value.toLocaleString("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function pensionOverCapWarning(breakdown: PayeBreakdown, prefix = ""): string {
  return `${prefix}${euro0(breakdown.pensionExcess)} of the employee pension is over the ${breakdown.pensionReliefPct}% relief cap at age ${breakdown.age} (${euro0(breakdown.pensionReliefCap)} this year). That slice still comes out of take-home, with no income-tax relief.`;
}

function warningsFor(input: PayeInput, current: PayeBreakdown, compare: PayeBreakdown | null): string[] {
  const warnings: string[] = [];
  const currentCap = pensionEarningsCapWarning(current.salary, current.employeePension, current.age);
  if (currentCap) warnings.push(currentCap);
  if (compare) {
    const compareCap = pensionEarningsCapWarning(
      compare.salary,
      compare.employeePension,
      compare.age,
      false,
      "In the what-if, ",
    );
    if (
      compareCap &&
      (compare.salary !== current.salary ||
        compare.employeePension !== current.employeePension ||
        compare.age !== current.age) &&
      !currentCap
    ) {
      warnings.push(compareCap);
    }
  }
  if (current.pensionExcess > 0.5) {
    warnings.push(pensionOverCapWarning(current));
  }
  if (
    compare &&
    compare.pensionExcess > 0.5 &&
    (compare.age !== current.age ||
      compare.salary !== current.salary ||
      compare.employeePension !== current.employeePension)
  ) {
    warnings.push(pensionOverCapWarning(compare, "In the what-if, "));
  }
  if (current.unusedCredits > 0.5) {
    warnings.push(
      `${euro0(current.unusedCredits)} of tax credits is unused. Credits cannot take income tax below €0, and they do not cut USC or PRSI.`,
    );
  }
  if (current.bik > 0) {
    warnings.push(
      "Benefit in kind is not cash in your account. It raises income tax, USC, and PRSI. Take-home is salary after those charges and pension, not salary plus the benefit.",
    );
  }
  if (current.uscReduced) {
    warnings.push(
      "Reduced USC (2% above €12,012) applies because of a medical card or age 70+, and income is at or under €60,000.",
    );
  }
  if (input.claimHomeCarer && input.taxStatus !== "married_one") {
    warnings.push("Home carer credit only applies when you are jointly assessed with one income. It is not in this bill.");
  }
  if (input.claimAgeCredit && input.age < 65) {
    warnings.push("Age credit starts at 65. It is not in this bill.");
  }
  if (input.useCreditOverride) {
    warnings.push("Credits come from the tax-credit cert figure, not the situation checkboxes.");
  }
  if (compare && compare.takeHome < current.takeHome) {
    const drop = current.takeHome - compare.takeHome;
    warnings.push(`The change cuts annual take-home by ${euro0(drop)}.`);
  }
  return warnings;
}

export function runPaye(
  input: PayeInput,
  compare?: { salary: number; bikHealth: number; bikOther: number; employeePension?: number; age?: number },
): PayeResult {
  const current = runPayeScenario(input);
  const proposed = compare
    ? computePayslip(
        input,
        compare.salary,
        compare.bikHealth,
        compare.bikOther,
        compare.employeePension ?? input.employeePension,
        compare.age ?? input.age,
      )
    : null;
  const delta = proposed
    ? {
        takeHome: round2(proposed.takeHome - current.takeHome),
        incomeTax: round2(proposed.incomeTax - current.incomeTax),
        usc: round2(proposed.usc - current.usc),
        prsi: round2(proposed.prsi - current.prsi),
        employeePension: round2(proposed.employeePension - current.employeePension),
      }
    : null;
  return {
    current,
    compare: proposed,
    delta,
    warnings: warningsFor(input, current, proposed),
  };
}

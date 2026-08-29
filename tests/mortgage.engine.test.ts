import { describe, expect, it } from "vitest";
import { resolveGreenMortgage } from "../src/core/irish-green-mortgage";
import { calculateLpt } from "../src/core/irish-lpt";
import {
  calculateBorrowingCapacity,
  calculateFirstHomeScheme,
  calculateHelpToBuy,
} from "../src/core/irish-mortgage-rules";
import { calculateResidentialStampDuty } from "../src/core/irish-stamp-duty";
import { calculateMonthlyPayment, aggregateAnnualTotals, runAmortizationSchedule } from "../src/tools/mortgage/amortization";
import { getMinDepositPct } from "../src/core/irish-mortgage-rules";
import { runMortgagePlan } from "../src/tools/mortgage/engine";
import {
  addRatePeriod,
  canAddRatePeriod,
  normalizeRateSchedule,
  parseRateSchedule,
  serializeRateSchedule,
  shockVariableRates,
} from "../src/tools/mortgage/rate-schedule";
import {
  depositAmountFromPct,
  depositPctFromAmount,
  getInvalidMortgageFields,
  getMortgageFieldErrorMessage,
  getMortgageFieldErrors,
} from "../src/tools/mortgage/validation";

const baseMortgageInput = {
  buyerType: "ftb" as const,
  propertyType: "new_build" as const,
  propertyPrice: 450_000,
  depositPct: 10,
  interestRatePct: 3.8,
  termYears: 30,
  useGreenMortgage: false,
  berRating: "B" as const,
  greenDiscountOverridePct: null,
  grossIncome: 85_000,
  monthlyCommitments: 0,
  assumeMpe: false,
  stressTestEnabled: true,
  isBridgingLoan: false,
  useHelpToBuy: false,
  htbRefundEstimate: 0,
  useFirstHomeScheme: false,
  fhsEquityPct: 10,
  solicitorFee: 2000,
  valuationFee: 200,
  includeSurvey: true,
  surveyFee: 400,
  mortgageProtectionMonthly: 35,
  homeInsuranceAnnual: 450,
  lptLocalAdjustmentPct: 0,
  overpaymentMonthly: 0,
  overpaymentMonthlyStartYear: 1,
  overpaymentLumpSum: 0,
  overpaymentLumpSumStartYear: 1,
};

describe("calculateResidentialStampDuty", () => {
  it("charges 1% on €400k second-hand", () => {
    expect(calculateResidentialStampDuty(400_000, false).total).toBe(4000);
  });

  it("applies tiered rates above €1m", () => {
    const result = calculateResidentialStampDuty(1_200_000, false);
    expect(result.total).toBe(10_000 + 4_000);
  });

  it("excludes VAT on new builds", () => {
    const secondHand = calculateResidentialStampDuty(450_000, false).total;
    const newBuild = calculateResidentialStampDuty(450_000, true).total;
    expect(newBuild).toBeLessThan(secondHand);
  });
});

describe("calculateBorrowingCapacity", () => {
  it("binds FTB at LTI for €85k salary on €450k property", () => {
    const result = calculateBorrowingCapacity({
      buyerType: "ftb",
      grossIncome: 85_000,
      propertyPrice: 450_000,
      depositPct: 10,
    });
    expect(result.maxLoanByLti).toBe(340_000);
    expect(result.maxLoanByLtv).toBe(405_000);
    expect(result.maxLoanAllowed).toBe(340_000);
    expect(result.bindingConstraint).toBe("lti");
    expect(result.loanAmount).toBe(405_000);
    expect(result.passesCentralBankRules).toBe(false);
  });
});

describe("calculateHelpToBuy", () => {
  it("caps HTB at €30k for €450k new build", () => {
    const result = calculateHelpToBuy({
      useHelpToBuy: true,
      propertyType: "new_build",
      propertyPrice: 450_000,
      htbRefundEstimate: 50_000,
      mortgageLtvPct: 90,
    });
    expect(result.eligible).toBe(true);
    expect(result.appliedAmount).toBe(30_000);
  });

  it("caps HTB at 10% for €200k property", () => {
    const result = calculateHelpToBuy({
      useHelpToBuy: true,
      propertyType: "new_build",
      propertyPrice: 200_000,
      htbRefundEstimate: 25_000,
      mortgageLtvPct: 90,
    });
    expect(result.appliedAmount).toBe(20_000);
  });
});

describe("calculateFirstHomeScheme", () => {
  it("allows up to 30% equity without HTB", () => {
    const result = calculateFirstHomeScheme({
      useFirstHomeScheme: true,
      propertyType: "new_build",
      propertyPrice: 400_000,
      fhsEquityPct: 25,
      useHelpToBuy: false,
      assumeMpe: false,
    });
    expect(result.eligible).toBe(true);
    expect(result.equityAmount).toBe(100_000);
    expect(result.maxEquityPct).toBe(30);
  });

  it("limits to 20% with HTB", () => {
    const result = calculateFirstHomeScheme({
      useFirstHomeScheme: true,
      propertyType: "new_build",
      propertyPrice: 400_000,
      fhsEquityPct: 25,
      useHelpToBuy: true,
      assumeMpe: false,
    });
    expect(result.maxEquityPct).toBe(20);
    expect(result.equityAmount).toBe(80_000);
  });
});

describe("calculateLpt", () => {
  it("returns band 4 for €450k (2026 bands)", () => {
    const result = calculateLpt(450_000);
    expect(result.band?.band).toBe(4);
    expect(result.basicRate).toBe(428);
  });
});

describe("resolveGreenMortgage", () => {
  it("applies discount for BER A", () => {
    const result = resolveGreenMortgage({
      useGreenMortgage: true,
      berRating: "A",
      baseInterestRatePct: 3.8,
      greenDiscountOverridePct: null,
    });
    expect(result.greenEligible).toBe(true);
    expect(result.effectiveInterestRatePct).toBe(3.8 - 0.3);
  });

  it("warns for BER F without override", () => {
    const result = resolveGreenMortgage({
      useGreenMortgage: true,
      berRating: "F",
      baseInterestRatePct: 3.8,
      greenDiscountOverridePct: null,
    });
    expect(result.greenDiscountPct).toBe(0);
    expect(result.effectiveInterestRatePct).toBe(3.8);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("respects discount override", () => {
    const result = resolveGreenMortgage({
      useGreenMortgage: true,
      berRating: "E",
      baseInterestRatePct: 3.8,
      greenDiscountOverridePct: 0.2,
    });
    expect(result.greenDiscountPct).toBe(0.2);
    expect(result.effectiveInterestRatePct).toBeCloseTo(3.6, 5);
  });
});

describe("calculateMonthlyPayment", () => {
  it("matches standard amortization formula", () => {
    const payment = calculateMonthlyPayment(300_000, 4, 30);
    expect(payment).toBeCloseTo(1432.25, 0);
  });
});

describe("runMortgagePlan", () => {
  it("produces repayment and borrowing results", () => {
    const result = runMortgagePlan(baseMortgageInput);
    expect(result.amortization.monthlyPayment).toBeGreaterThan(0);
    expect(result.borrowing.maxLoanAllowed).toBe(340_000);
    expect(result.upfrontCosts.totalCashRequired).toBeGreaterThan(0);
  });

  it("saves interest with green mortgage", () => {
    const standard = runMortgagePlan(baseMortgageInput);
    const green = runMortgagePlan({
      ...baseMortgageInput,
      useGreenMortgage: true,
      berRating: "A",
    });
    expect(green.interestSavedVsStandardRate).toBeGreaterThan(0);
    expect(green.amortization.totalInterest).toBeLessThan(standard.amortization.totalInterest);
  });

  it("reduces term with overpayments", () => {
    const result = runMortgagePlan({
      ...baseMortgageInput,
      overpaymentMonthly: 200,
    });
    expect(result.overpayment).not.toBeNull();
    expect(result.overpayment!.interestSaved).toBeGreaterThan(0);
    expect(result.overpayment!.monthsSaved).toBeGreaterThan(0);
  });

  it("delays monthly overpayment until the chosen start year", () => {
    const immediate = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 4,
      termYears: 30,
      overpaymentMonthly: 200,
      overpaymentMonthlyStartYear: 1,
    });
    const delayed = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 4,
      termYears: 30,
      overpaymentMonthly: 200,
      overpaymentMonthlyStartYear: 4,
    });
    const immediateY3 = aggregateAnnualTotals(immediate.monthlySnapshots, 300_000)[2]!;
    const delayedY3 = aggregateAnnualTotals(delayed.monthlySnapshots, 300_000)[2]!;
    expect(delayedY3.principalPaid).toBeLessThan(immediateY3.principalPaid);
    expect(delayed.totalInterest).toBeGreaterThan(immediate.totalInterest);
  });

  it("applies lump sum at the chosen start year", () => {
    const atStart = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 4,
      termYears: 30,
      overpaymentLumpSum: 20_000,
      overpaymentLumpSumStartYear: 1,
    });
    const year4 = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 4,
      termYears: 30,
      overpaymentLumpSum: 20_000,
      overpaymentLumpSumStartYear: 4,
    });
    expect(atStart.monthlySnapshots[0]!.balance).toBeLessThan(300_000 - 19_000);
    expect(year4.monthlySnapshots[35]!.balance).toBeGreaterThan(atStart.monthlySnapshots[35]!.balance);
    expect(year4.monthlySnapshots[36]!.balance).toBeLessThan(year4.monthlySnapshots[35]!.balance - 19_000);
  });
});

describe("aggregateAnnualTotals", () => {
  it("shows paydown rate accelerating over the term", () => {
    const schedule = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 4,
      termYears: 30,
    });
    const annual = aggregateAnnualTotals(schedule.monthlySnapshots, 300_000);
    expect(annual.length).toBeGreaterThan(1);
    expect(annual[annual.length - 1]!.paydownRatePct).toBeGreaterThan(annual[0]!.paydownRatePct);
    expect(annual[annual.length - 1]!.principalPaid).toBeGreaterThan(annual[0]!.principalPaid);
  });
});

describe("deposit conversion", () => {
  it("converts between amount and percentage", () => {
    expect(depositPctFromAmount(450_000, 45_000)).toBe(10);
    expect(depositAmountFromPct(450_000, 10)).toBe(45_000);
  });
});

describe("rate schedule", () => {
  it("parses and serializes periods", () => {
    const raw = "fixed|5|3.8;variable|2|4.2;variable|23|3.5";
    const periods = parseRateSchedule(raw);
    expect(periods).toEqual([
      { kind: "fixed", years: 5, ratePct: 3.8 },
      { kind: "variable", years: 2, ratePct: 4.2 },
      { kind: "variable", years: 23, ratePct: 3.5 },
    ]);
    expect(serializeRateSchedule(periods)).toBe(raw);
  });

  it("fills an empty schedule from the opening rate and term", () => {
    expect(normalizeRateSchedule([], 30, 3.8)).toEqual([{ kind: "fixed", years: 30, ratePct: 3.8 }]);
  });

  it("cannot add a second period in the same year", () => {
    const oneYear = [{ kind: "fixed" as const, years: 1, ratePct: 3.8 }];
    expect(canAddRatePeriod(oneYear, 1)).toBe(false);
    expect(addRatePeriod(oneYear, 1)).toEqual(oneYear);

    const full = Array.from({ length: 5 }, () => ({
      kind: "variable" as const,
      years: 1,
      ratePct: 4,
    }));
    expect(canAddRatePeriod(full, 5)).toBe(false);
    expect(addRatePeriod(full, 5)).toHaveLength(5);
  });

  it("takes one year from the last period when adding", () => {
    const added = addRatePeriod([{ kind: "fixed", years: 30, ratePct: 3.8 }], 30);
    expect(added).toEqual([
      { kind: "fixed", years: 29, ratePct: 3.8 },
      { kind: "variable", years: 1, ratePct: 3.8 },
    ]);
  });

  it("shocks variable periods only", () => {
    const periods = [
      { kind: "fixed" as const, years: 5, ratePct: 3.8 },
      { kind: "variable" as const, years: 25, ratePct: 4.2 },
    ];
    expect(shockVariableRates(periods, 1)).toEqual([
      { kind: "fixed", years: 5, ratePct: 3.8 },
      { kind: "variable", years: 25, ratePct: 5.2 },
    ]);
    expect(shockVariableRates(periods, -1)[1]!.ratePct).toBeCloseTo(3.2, 5);
  });
});

describe("stepped amortization", () => {
  const flat = [
    { kind: "fixed" as const, years: 30, ratePct: 3.8 },
  ];
  const stepped = [
    { kind: "fixed" as const, years: 5, ratePct: 3.8 },
    { kind: "variable" as const, years: 25, ratePct: 4.8 },
  ];

  it("matches a flat rate when the schedule is one fixed period", () => {
    const without = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 3.8,
      termYears: 30,
    });
    const withSchedule = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 3.8,
      termYears: 30,
      ratePeriods: flat,
    });
    expect(withSchedule.totalInterest).toBeCloseTo(without.totalInterest, 5);
    expect(withSchedule.monthlyPayment).toBeCloseTo(without.monthlyPayment, 5);
  });

  it("pays more interest and steps the payment up after a higher variable period", () => {
    const allFixed = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 3.8,
      termYears: 30,
      ratePeriods: flat,
    });
    const mixed = runAmortizationSchedule({
      loanAmount: 300_000,
      annualRatePct: 3.8,
      termYears: 30,
      ratePeriods: stepped,
    });
    expect(mixed.totalInterest).toBeGreaterThan(allFixed.totalInterest);
    expect(mixed.monthlyPayment).toBeCloseTo(allFixed.monthlyPayment, 5);
    const lastFixedMonth = mixed.monthlySnapshots[59]!;
    const firstVariableMonth = mixed.monthlySnapshots[60]!;
    const fixedPayment = lastFixedMonth.interestPaid + lastFixedMonth.principalPaid;
    const variablePayment = firstVariableMonth.interestPaid + firstVariableMonth.principalPaid;
    expect(variablePayment).toBeGreaterThan(fixedPayment);
  });

  it("leaves fixed-year interest unchanged in the ±1% shock", () => {
    const result = runMortgagePlan({
      ...baseMortgageInput,
      ratePeriods: stepped,
    });
    const baseline = aggregateAnnualTotals(
      result.rateRisk.baseline.monthlySnapshots,
      result.loanAmountAfterFhs,
    );
    const plus = aggregateAnnualTotals(
      result.rateRisk.plusOne.monthlySnapshots,
      result.loanAmountAfterFhs,
    );
    const minus = aggregateAnnualTotals(
      result.rateRisk.minusOne.monthlySnapshots,
      result.loanAmountAfterFhs,
    );
    expect(plus[0]!.interestPaid).toBeCloseTo(baseline[0]!.interestPaid, 5);
    expect(minus[0]!.interestPaid).toBeCloseTo(baseline[0]!.interestPaid, 5);
    expect(plus[5]!.interestPaid).toBeGreaterThan(baseline[5]!.interestPaid);
    expect(minus[5]!.interestPaid).toBeLessThan(baseline[5]!.interestPaid);
  });

  it("still shortens the term when overpaying a stepped schedule", () => {
    const result = runMortgagePlan({
      ...baseMortgageInput,
      ratePeriods: stepped,
      overpaymentMonthly: 200,
    });
    expect(result.overpayment).not.toBeNull();
    expect(result.overpayment!.interestSaved).toBeGreaterThan(0);
    expect(result.overpayment!.monthsSaved).toBeGreaterThan(0);
  });
});

describe("getInvalidMortgageFields", () => {
  it("flags deposit below Central Bank minimum", () => {
    const invalid = getInvalidMortgageFields({ ...baseMortgageInput, depositPct: 1 });
    expect(invalid.has("deposit")).toBe(true);
  });

  it("explains why deposit is invalid", () => {
    const errors = getMortgageFieldErrors({ ...baseMortgageInput, depositPct: 1 });
    expect(getMortgageFieldErrorMessage(errors, "deposit")).toContain("Minimum deposit is 10%");
  });

  it("does not flag valid deposit", () => {
    const invalid = getInvalidMortgageFields(baseMortgageInput);
    expect(invalid.has("deposit")).toBe(false);
  });

  it("flags a rate period shorter than one year", () => {
    const invalid = getInvalidMortgageFields({
      ...baseMortgageInput,
      ratePeriods: [{ kind: "fixed", years: 0, ratePct: 3.8 }],
    });
    expect(invalid.has("rate_schedule")).toBe(true);
  });

  it("requires 30% minimum for buy-to-let", () => {
    expect(getMinDepositPct("btl")).toBe(30);
    const invalid = getInvalidMortgageFields({
      ...baseMortgageInput,
      buyerType: "btl",
      depositPct: 10,
    });
    expect(invalid.has("deposit")).toBe(true);
  });
});

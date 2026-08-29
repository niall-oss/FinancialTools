import type { BerRating } from "../../core/irish-green-mortgage";
import { resolveGreenMortgage } from "../../core/irish-green-mortgage";
import { calculateLpt } from "../../core/irish-lpt";
import type { BuyerType } from "../../core/irish-mortgage-rules";
import {
  calculateBorrowingCapacity,
  calculateFirstHomeScheme,
  calculateHelpToBuy,
  calculateLandRegistryFee,
  calculateStressRatePct,
  getMinDepositPct,
} from "../../core/irish-mortgage-rules";
import { calculateResidentialStampDuty } from "../../core/irish-stamp-duty";
import {
  calculateMonthlyPayment,
  compareOverpayment,
  runAmortizationSchedule,
  type AmortizationResult,
} from "./amortization";
import {
  applyOpeningRate,
  normalizeRateSchedule,
  shockVariableRates,
  type RatePeriod,
} from "./rate-schedule";

export type PropertyType = "new_build" | "second_hand";

export interface MortgageInput {
  buyerType: BuyerType;
  propertyType: PropertyType;
  propertyPrice: number;
  depositPct: number;
  interestRatePct: number;
  termYears: number;
  useGreenMortgage: boolean;
  berRating: BerRating;
  greenDiscountOverridePct: number | null;
  grossIncome: number;
  monthlyCommitments: number;
  assumeMpe: boolean;
  stressTestEnabled: boolean;
  isBridgingLoan: boolean;
  useHelpToBuy: boolean;
  htbRefundEstimate: number;
  useFirstHomeScheme: boolean;
  fhsEquityPct: number;
  solicitorFee: number;
  valuationFee: number;
  includeSurvey: boolean;
  surveyFee: number;
  mortgageProtectionMonthly: number;
  homeInsuranceAnnual: number;
  lptLocalAdjustmentPct: number;
  overpaymentMonthly: number;
  overpaymentMonthlyStartYear: number;
  overpaymentLumpSum: number;
  overpaymentLumpSumStartYear: number;
  ratePeriods?: RatePeriod[];
}

export interface MortgagePlanResult {
  borrowing: ReturnType<typeof calculateBorrowingCapacity>;
  green: ReturnType<typeof resolveGreenMortgage>;
  effectiveInterestRatePct: number;
  loanAmountAfterFhs: number;
  htb: ReturnType<typeof calculateHelpToBuy>;
  fhs: ReturnType<typeof calculateFirstHomeScheme>;
  amortization: AmortizationResult;
  amortizationStandardRate: AmortizationResult | null;
  stressRatePct: number;
  stressedMonthlyPayment: number;
  stampDuty: ReturnType<typeof calculateResidentialStampDuty>;
  landRegistryFee: number;
  upfrontCosts: {
    deposit: number;
    stampDuty: number;
    solicitorFee: number;
    valuationFee: number;
    surveyFee: number;
    landRegistryFee: number;
    totalFees: number;
    htbApplied: number;
    totalCashRequired: number;
    totalCashWithoutSchemes: number;
  };
  lpt: ReturnType<typeof calculateLpt>;
  ongoing: {
    mortgagePayment: number;
    mortgageProtection: number;
    homeInsuranceMonthly: number;
    lptMonthly: number;
    totalMonthlyHousingCost: number;
  };
  overpayment: ReturnType<typeof compareOverpayment> | null;
  interestSavedVsStandardRate: number;
  ratePeriods: RatePeriod[];
  rateRisk: {
    baseline: AmortizationResult;
    plusOne: AmortizationResult;
    minusOne: AmortizationResult;
  };
  paymentAfterFirstPeriod: {
    afterYear: number;
    monthlyPayment: number;
    ratePct: number;
  } | null;
  warnings: string[];
}

export function runMortgagePlan(input: MortgageInput): MortgagePlanResult {
  const warnings: string[] = [];

  const green = resolveGreenMortgage({
    useGreenMortgage: input.useGreenMortgage,
    berRating: input.berRating,
    baseInterestRatePct: input.interestRatePct,
    greenDiscountOverridePct: input.greenDiscountOverridePct,
  });
  warnings.push(...green.warnings);

  const effectiveInterestRatePct = green.effectiveInterestRatePct;
  const ratePeriods = applyOpeningRate(
    normalizeRateSchedule(input.ratePeriods ?? [], input.termYears, input.interestRatePct),
    effectiveInterestRatePct,
  );

  const borrowing = calculateBorrowingCapacity({
    buyerType: input.buyerType,
    grossIncome: input.grossIncome,
    propertyPrice: input.propertyPrice,
    depositPct: input.depositPct,
    assumeMpe: input.assumeMpe,
    isBridgingLoan: input.isBridgingLoan,
  });

  const htb = calculateHelpToBuy({
    useHelpToBuy: input.useHelpToBuy,
    propertyType: input.propertyType,
    propertyPrice: input.propertyPrice,
    htbRefundEstimate: input.htbRefundEstimate,
    mortgageLtvPct: borrowing.ltvPct,
  });
  warnings.push(...htb.warnings);

  const fhs = calculateFirstHomeScheme({
    useFirstHomeScheme: input.useFirstHomeScheme,
    propertyType: input.propertyType,
    propertyPrice: input.propertyPrice,
    fhsEquityPct: input.fhsEquityPct,
    useHelpToBuy: input.useHelpToBuy,
    assumeMpe: input.assumeMpe,
  });
  warnings.push(...fhs.warnings);

  const loanAmountAfterFhs = Math.max(0, borrowing.loanAmount - fhs.equityAmount);

  if (!borrowing.passesCentralBankRules) {
    warnings.push(
      `Loan (€${Math.round(borrowing.loanAmount).toLocaleString("en-IE")}) exceeds Central Bank limit (€${Math.round(borrowing.maxLoanAllowed).toLocaleString("en-IE")}).`,
    );
  }

  const minDepositPct = getMinDepositPct(input.buyerType);
  if (input.depositPct < minDepositPct) {
    warnings.push(`Minimum deposit for your buyer type is ${minDepositPct}%.`);
  }

  const amortization = runAmortizationSchedule({
    loanAmount: loanAmountAfterFhs,
    annualRatePct: effectiveInterestRatePct,
    termYears: input.termYears,
    ratePeriods,
  });
  const plusOne = runAmortizationSchedule({
    loanAmount: loanAmountAfterFhs,
    annualRatePct: effectiveInterestRatePct,
    termYears: input.termYears,
    ratePeriods: shockVariableRates(ratePeriods, 1),
  });
  const minusOne = runAmortizationSchedule({
    loanAmount: loanAmountAfterFhs,
    annualRatePct: effectiveInterestRatePct,
    termYears: input.termYears,
    ratePeriods: shockVariableRates(ratePeriods, -1),
  });

  let amortizationStandardRate: AmortizationResult | null = null;
  let interestSavedVsStandardRate = 0;
  if (input.useGreenMortgage && green.greenDiscountPct > 0) {
    amortizationStandardRate = runAmortizationSchedule({
      loanAmount: loanAmountAfterFhs,
      annualRatePct: input.interestRatePct,
      termYears: input.termYears,
      ratePeriods: applyOpeningRate(ratePeriods, input.interestRatePct),
    });
    interestSavedVsStandardRate =
      amortizationStandardRate.totalInterest - amortization.totalInterest;
  }

  const stressRatePct = calculateStressRatePct(effectiveInterestRatePct);
  const stressedMonthlyPayment = input.stressTestEnabled
    ? calculateMonthlyPayment(loanAmountAfterFhs, stressRatePct, input.termYears)
    : 0;

  if (
    input.stressTestEnabled &&
    input.grossIncome > 0 &&
    stressedMonthlyPayment + input.monthlyCommitments > (input.grossIncome / 12) * 0.5
  ) {
    warnings.push(
      "Stressed repayment plus commitments exceeds ~50% of gross monthly income, so lenders may decline.",
    );
  }

  const stampDuty = calculateResidentialStampDuty(
    input.propertyPrice,
    input.propertyType === "new_build",
  );
  const landRegistryFee = calculateLandRegistryFee(input.propertyPrice);
  const surveyFee = input.includeSurvey ? input.surveyFee : 0;
  const totalFees =
    stampDuty.total +
    input.solicitorFee +
    input.valuationFee +
    surveyFee +
    landRegistryFee;

  const cashDeposit = borrowing.depositAmount - htb.appliedAmount;
  const totalCashWithoutSchemes = borrowing.depositAmount + totalFees;
  const totalCashRequired = Math.max(0, cashDeposit + totalFees);

  const lpt = calculateLpt(input.propertyPrice, input.lptLocalAdjustmentPct);

  const ongoing = {
    mortgagePayment: amortization.monthlyPayment,
    mortgageProtection: input.mortgageProtectionMonthly,
    homeInsuranceMonthly: input.homeInsuranceAnnual / 12,
    lptMonthly: lpt.annualCharge / 12,
    totalMonthlyHousingCost:
      amortization.monthlyPayment +
      input.mortgageProtectionMonthly +
      input.homeInsuranceAnnual / 12 +
      lpt.annualCharge / 12,
  };

  const overpayment =
    input.overpaymentMonthly > 0 || input.overpaymentLumpSum > 0
      ? compareOverpayment(
          loanAmountAfterFhs,
          effectiveInterestRatePct,
          input.termYears,
          input.overpaymentMonthly,
          input.overpaymentLumpSum,
          input.overpaymentMonthlyStartYear,
          input.overpaymentLumpSumStartYear,
          ratePeriods,
        )
      : null;

  const paymentAfterFirstPeriod = nextPeriodPayment(amortization, ratePeriods);

  return {
    borrowing,
    green,
    effectiveInterestRatePct,
    loanAmountAfterFhs,
    htb,
    fhs,
    amortization,
    amortizationStandardRate,
    stressRatePct,
    stressedMonthlyPayment,
    stampDuty,
    landRegistryFee,
    upfrontCosts: {
      deposit: borrowing.depositAmount,
      stampDuty: stampDuty.total,
      solicitorFee: input.solicitorFee,
      valuationFee: input.valuationFee,
      surveyFee,
      landRegistryFee,
      totalFees,
      htbApplied: htb.appliedAmount,
      totalCashRequired,
      totalCashWithoutSchemes,
    },
    lpt,
    ongoing,
    overpayment,
    interestSavedVsStandardRate,
    ratePeriods,
    rateRisk: {
      baseline: amortization,
      plusOne,
      minusOne,
    },
    paymentAfterFirstPeriod,
    warnings,
  };
}

function nextPeriodPayment(
  amortization: AmortizationResult,
  ratePeriods: RatePeriod[],
): { afterYear: number; monthlyPayment: number; ratePct: number } | null {
  if (ratePeriods.length < 2) return null;
  const first = ratePeriods[0]!;
  const second = ratePeriods[1]!;
  const snap = amortization.monthlySnapshots[first.years * 12];
  if (!snap) return null;
  const monthlyPayment = snap.interestPaid + snap.principalPaid;
  if (Math.abs(monthlyPayment - amortization.monthlyPayment) < 0.005) return null;
  return {
    afterYear: first.years,
    monthlyPayment,
    ratePct: second.ratePct,
  };
}

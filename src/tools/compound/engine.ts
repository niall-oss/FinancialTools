import type { TaxMode } from "../../core/config/schema";
import type { TaxIeParams } from "../../core/irish-income-tax";
import { applyTaxForMode } from "./irish-tax";

export interface CompoundInput {
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
  annualReturnPct: number;
  annualFeePct: number;
  taxMode: TaxMode;
  deemedDisposalRatePct: number;
  deemedDisposalIntervalYears: number;
  cgtRatePct: number;
  incomeTaxFromProfile: boolean;
  incomeTaxManualRatePct: number;
  annualSalary: number;
  inflationAdjustment: boolean;
  inflationRatePct: number;
  taxIe?: TaxIeParams;
}

export interface YearSnapshot {
  year: number;
  balance: number;
  grossBalance: number;
  contributions: number;
  feesPaid: number;
  taxPaid: number;
  growth: number;
}

export interface TaxEvent {
  year: number;
  amount: number;
}

export interface CompoundResult {
  years: YearSnapshot[];
  finalBalance: number;
  totalContributions: number;
  totalFees: number;
  totalTax: number;
  taxEvents: TaxEvent[];
}

function effectiveAnnualReturn(input: CompoundInput): number {
  if (!input.inflationAdjustment) return input.annualReturnPct;
  return input.annualReturnPct - input.inflationRatePct;
}

export function runCompoundSimulation(input: CompoundInput): CompoundResult {
  const months = input.years * 12;
  const monthlyReturn = effectiveAnnualReturn(input) / 100 / 12;
  const monthlyFee = input.annualFeePct / 100 / 12;

  let balance = input.initialInvestment;
  let costBasis = input.initialInvestment;
  let totalContributions = input.initialInvestment;
  let totalFees = 0;
  let totalTax = 0;
  const taxEvents: TaxEvent[] = [];

  const yearSnapshots: YearSnapshot[] = [];
  let yearStartBalance = balance;
  let yearContributions = 0;
  let cumulativeFees = 0;
  let cumulativeTax = 0;

  for (let month = 1; month <= months; month++) {
    balance += input.monthlyContribution;
    totalContributions += input.monthlyContribution;
    costBasis += input.monthlyContribution;
    yearContributions += input.monthlyContribution;

    balance *= 1 + monthlyReturn;

    const fee = balance * monthlyFee;
    balance -= fee;
    totalFees += fee;
    cumulativeFees += fee;

    const year = Math.ceil(month / 12);
    const isYearEnd = month % 12 === 0;

    if (isYearEnd) {
      const taxResult = applyTaxForMode(
        input.taxMode,
        {
          balance,
          costBasis,
          year,
          yearStartBalance,
          yearContributions,
          totalContributions,
        },
        {
          deemedDisposalRatePct: input.deemedDisposalRatePct,
          deemedDisposalIntervalYears: input.deemedDisposalIntervalYears,
          cgtRatePct: input.cgtRatePct,
          incomeTaxFromProfile: input.incomeTaxFromProfile,
          incomeTaxManualRatePct: input.incomeTaxManualRatePct,
          annualSalary: input.annualSalary,
          isFinalYear: year === input.years,
          taxIe: input.taxIe,
        },
      );

      if (taxResult.taxPaid > 0) {
        totalTax += taxResult.taxPaid;
        cumulativeTax += taxResult.taxPaid;
        taxEvents.push({ year, amount: taxResult.taxPaid });
      }

      balance = taxResult.newBalance;
      costBasis = taxResult.newCostBasis;

      const growth = balance - totalContributions + totalTax + totalFees;

      yearSnapshots.push({
        year,
        balance,
        grossBalance: balance + cumulativeTax + cumulativeFees,
        contributions: totalContributions,
        feesPaid: cumulativeFees,
        taxPaid: cumulativeTax,
        growth: Math.max(0, growth),
      });

      yearStartBalance = balance;
      yearContributions = 0;
    }
  }

  return {
    years: yearSnapshots,
    finalBalance: balance,
    totalContributions,
    totalFees,
    totalTax,
    taxEvents,
  };
}

export function runSensitivityAnalysis(
  input: CompoundInput,
  returnRates: number[],
): { returnPct: number; finalBalance: number }[] {
  return returnRates.map((rate) => {
    const result = runCompoundSimulation({ ...input, annualReturnPct: rate });
    return { returnPct: rate, finalBalance: result.finalBalance };
  });
}

import type { TaxMode } from "../../core/config/schema";

import {
  calculateIrishIncomeTaxOnGain,
  IE_HIGHER_RATE_PCT,
  IE_STANDARD_RATE_PCT,
  type TaxIeParams,
} from "../../core/irish-income-tax";

export interface TaxContext {
  balance: number;
  costBasis: number;
  year: number;
  yearStartBalance: number;
  yearContributions: number;
  totalContributions: number;
}

export interface TaxResult {
  taxPaid: number;
  newBalance: number;
  newCostBasis: number;
}

export function applyDeemedDisposal(
  ctx: TaxContext,
  ratePct: number,
): TaxResult {
  const gain = Math.max(0, ctx.balance - ctx.costBasis);
  const taxPaid = gain * (ratePct / 100);
  const newBalance = ctx.balance - taxPaid;
  return { taxPaid, newBalance, newCostBasis: newBalance };
}

export function applyCgtOnExit(
  ctx: TaxContext,
  ratePct: number,
  isFinalYear: boolean,
): TaxResult {
  if (!isFinalYear) {
    return { taxPaid: 0, newBalance: ctx.balance, newCostBasis: ctx.costBasis };
  }
  const gain = Math.max(0, ctx.balance - ctx.totalContributions);
  const taxPaid = gain * (ratePct / 100);
  const newBalance = ctx.balance - taxPaid;
  return { taxPaid, newBalance, newCostBasis: ctx.costBasis };
}

export function applyIncomeAnnual(
  ctx: TaxContext,
  options: {
    annualSalary: number;
    fromProfile: boolean;
    manualRatePct: number;
    taxIe?: TaxIeParams;
  },
): TaxResult {
  const yearGrowth = ctx.balance - ctx.yearStartBalance - ctx.yearContributions;
  const taxableGain = Math.max(0, yearGrowth);

  const taxPaid = options.fromProfile
    ? calculateIrishIncomeTaxOnGain(options.annualSalary, taxableGain, options.taxIe)
    : taxableGain * (normalizeManualRate(options.manualRatePct) / 100);

  const newBalance = ctx.balance - taxPaid;
  return { taxPaid, newBalance, newCostBasis: ctx.costBasis };
}

function normalizeManualRate(ratePct: number): number {
  return ratePct >= IE_HIGHER_RATE_PCT ? IE_HIGHER_RATE_PCT : IE_STANDARD_RATE_PCT;
}

export function applyTaxForMode(
  mode: TaxMode,
  ctx: TaxContext,
  options: {
    deemedDisposalRatePct: number;
    deemedDisposalIntervalYears: number;
    cgtRatePct: number;
    incomeTaxFromProfile: boolean;
    incomeTaxManualRatePct: number;
    annualSalary: number;
    isFinalYear: boolean;
    taxIe?: TaxIeParams;
  },
): TaxResult {
  switch (mode) {
    case "deemed_disposal": {
      if (
        ctx.year > 0 &&
        ctx.year % options.deemedDisposalIntervalYears === 0
      ) {
        return applyDeemedDisposal(ctx, options.deemedDisposalRatePct);
      }
      return { taxPaid: 0, newBalance: ctx.balance, newCostBasis: ctx.costBasis };
    }
    case "cgt_on_exit":
      return applyCgtOnExit(ctx, options.cgtRatePct, options.isFinalYear);
    case "income_annual":
      return applyIncomeAnnual(ctx, {
        annualSalary: options.annualSalary,
        fromProfile: options.incomeTaxFromProfile,
        manualRatePct: options.incomeTaxManualRatePct,
        taxIe: options.taxIe,
      });
    case "none":
    default:
      return { taxPaid: 0, newBalance: ctx.balance, newCostBasis: ctx.costBasis };
  }
}

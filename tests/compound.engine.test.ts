import { describe, expect, it } from "vitest";
import {
  calculateIrishIncomeTaxOnGain,
  getMarginalIrishIncomeTaxRatePct,
} from "../src/core/irish-income-tax";
import { runCompoundSimulation } from "../src/tools/compound/engine";

const baseInput = {
  initialInvestment: 10000,
  monthlyContribution: 500,
  years: 30,
  annualReturnPct: 7,
  annualFeePct: 0.5,
  taxMode: "none" as const,
  deemedDisposalRatePct: 38,
  deemedDisposalIntervalYears: 8,
  cgtRatePct: 33,
  incomeTaxFromProfile: true,
  incomeTaxManualRatePct: 40,
  annualSalary: 85000,
  inflationRatePct: 2.5,
};

describe("Irish income tax on gains", () => {
  it("uses 40% marginal rate when salary exceeds standard band", () => {
    expect(getMarginalIrishIncomeTaxRatePct(85000)).toBe(40);
    expect(calculateIrishIncomeTaxOnGain(85000, 1000)).toBe(400);
  });

  it("splits gain across 20% and 40% when salary is below band", () => {
    expect(calculateIrishIncomeTaxOnGain(30000, 20000)).toBe(0.2 * 14000 + 0.4 * 6000);
  });
});

describe("runCompoundSimulation", () => {
  it("grows balance with no tax", () => {
    const result = runCompoundSimulation(baseInput);
    expect(result.finalBalance).toBeGreaterThan(result.totalContributions);
    expect(result.totalTax).toBe(0);
    expect(result.years).toHaveLength(30);
  });

  it("applies fees reducing final balance", () => {
    const noFees = runCompoundSimulation({ ...baseInput, annualFeePct: 0 });
    const withFees = runCompoundSimulation({ ...baseInput, annualFeePct: 1 });
    expect(withFees.finalBalance).toBeLessThan(noFees.finalBalance);
    expect(withFees.totalFees).toBeGreaterThan(0);
  });

  it("applies deemed disposal tax at year 8", () => {
    const result = runCompoundSimulation({
      ...baseInput,
      years: 16,
      taxMode: "deemed_disposal",
      deemedDisposalRatePct: 38,
      deemedDisposalIntervalYears: 8,
    });
    expect(result.taxEvents.length).toBeGreaterThanOrEqual(2);
    expect(result.taxEvents[0].year).toBe(8);
    expect(result.totalTax).toBeGreaterThan(0);
  });

  it("applies CGT only at exit", () => {
    const result = runCompoundSimulation({
      ...baseInput,
      years: 10,
      taxMode: "cgt_on_exit",
      cgtRatePct: 33,
    });
    expect(result.taxEvents).toHaveLength(1);
    expect(result.taxEvents[0].year).toBe(10);
  });

  it("applies annual income tax on gains using profile salary", () => {
    const highEarner = runCompoundSimulation({
      ...baseInput,
      years: 5,
      taxMode: "income_annual",
      annualSalary: 85000,
      incomeTaxFromProfile: true,
    });
    const manual20 = runCompoundSimulation({
      ...baseInput,
      years: 5,
      taxMode: "income_annual",
      incomeTaxFromProfile: false,
      incomeTaxManualRatePct: 20,
    });
    expect(highEarner.taxEvents.length).toBe(5);
    expect(highEarner.totalTax).toBeGreaterThan(manual20.totalTax);
  });

  it("keeps real equal to nominal at 0% inflation", () => {
    const result = runCompoundSimulation({ ...baseInput, inflationRatePct: 0 });
    expect(result.finalRealBalance).toBe(result.finalBalance);
    for (const year of result.years) {
      expect(year.realBalance).toBe(year.balance);
    }
  });

  it("deflates a lump sum by cumulative inflation", () => {
    const result = runCompoundSimulation({
      ...baseInput,
      initialInvestment: 10000,
      monthlyContribution: 0,
      years: 1,
      annualReturnPct: 0,
      annualFeePct: 0,
      taxMode: "none",
      inflationRatePct: 10,
    });
    expect(result.finalBalance).toBeCloseTo(10000);
    expect(result.finalRealBalance).toBeCloseTo(10000 / 1.1);
  });

  it("still taxes the nominal path when inflation is set", () => {
    const inflated = runCompoundSimulation({
      ...baseInput,
      years: 16,
      taxMode: "deemed_disposal",
      deemedDisposalRatePct: 38,
      deemedDisposalIntervalYears: 8,
      inflationRatePct: 2.5,
    });
    const zeroInflation = runCompoundSimulation({
      ...baseInput,
      years: 16,
      taxMode: "deemed_disposal",
      deemedDisposalRatePct: 38,
      deemedDisposalIntervalYears: 8,
      inflationRatePct: 0,
    });
    expect(inflated.taxEvents.length).toBeGreaterThanOrEqual(2);
    expect(inflated.taxEvents[0].year).toBe(8);
    expect(inflated.totalTax).toBe(zeroInflation.totalTax);
    expect(inflated.finalBalance).toBe(zeroInflation.finalBalance);
    expect(inflated.finalRealBalance).toBeLessThan(inflated.finalBalance);
  });
});

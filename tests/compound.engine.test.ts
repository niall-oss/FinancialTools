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
  inflationAdjustment: false,
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

  it("reduces returns when inflation adjustment enabled", () => {
    const nominal = runCompoundSimulation(baseInput);
    const real = runCompoundSimulation({
      ...baseInput,
      inflationAdjustment: true,
      inflationRatePct: 2.5,
    });
    expect(real.finalBalance).toBeLessThan(nominal.finalBalance);
  });
});

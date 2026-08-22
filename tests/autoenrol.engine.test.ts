import { describe, expect, it } from "vitest";
import { TAX_IE_2026 } from "../src/core/irish-income-tax";
import {
  aeContributions,
  aeRatesForYear,
  annualAdminFee,
  exemptionFloorContributions,
  IE_AE_ADMIN_FEE_WEEKLY,
  isExemptEmployment,
} from "../src/core/irish-auto-enrolment";
import { runAutoEnrolPlan, type AutoEnrolInput } from "../src/tools/autoenrol/engine";

function input(overrides: Partial<AutoEnrolInput> = {}): AutoEnrolInput {
  return {
    age: 34,
    salary: 85_000,
    employmentType: "paye",
    taxStatus: "single",
    otherIncome: 0,
    enrolmentYear: 2026,
    participation: "stay",
    hasPayrollPension: false,
    compareScheme: "occupational",
    comparePreset: "match_ae",
    altEmployeeAnnual: 1_275,
    altEmployeePct: 1.5,
    altEmployerAnnual: 1_275,
    currentFund: 0,
    yearsToContribute: 10,
    annualReturnPct: 6,
    aeAnnualFeePct: 0.04,
    altAnnualFeePct: 0.5,
    adminFeeWeekly: IE_AE_ADMIN_FEE_WEEKLY,
    tax: TAX_IE_2026,
    ...overrides,
  };
}

describe("AE phase table and 3:3:1", () => {
  it("uses 1.5 / 1.5 / 0.5 in 2026–28", () => {
    const rates = aeRatesForYear(2026);
    expect(rates.employeePct).toBe(1.5);
    expect(rates.employerPct).toBe(1.5);
    expect(rates.statePct).toBe(0.5);
    expect(aeRatesForYear(2028).employeePct).toBe(1.5);
  });

  it("steps to 3% in 2029 and 6% from 2035", () => {
    expect(aeRatesForYear(2029).employeePct).toBe(3);
    expect(aeRatesForYear(2032).employeePct).toBe(4.5);
    expect(aeRatesForYear(2035).employeePct).toBe(6);
    expect(aeRatesForYear(2040).statePct).toBe(2);
  });

  it("matches the DSP €20,000 year-1 example", () => {
    const row = aeContributions(20_000, 2026);
    expect(row.employee).toBe(300);
    expect(row.employer).toBe(300);
    expect(row.state).toBe(100);
    expect(row.total).toBe(700);
  });

  it("caps all three parties at €80,000 of gross", () => {
    const row = aeContributions(100_000, 2026);
    expect(row.assessable).toBe(80_000);
    expect(row.employee).toBe(1_200);
    expect(row.employer).toBe(1_200);
    expect(row.state).toBe(400);
    expect(row.capBinds).toBe(true);
    const result = runAutoEnrolPlan(input({ salary: 100_000 }));
    expect(result.ae.employee).toBe(1_200);
    expect(result.ae.capBinds).toBe(true);
  });
});

describe("AE payroll", () => {
  it("does not reduce income tax (net-pay deduction)", () => {
    const result = runAutoEnrolPlan(input());
    expect(result.ae.taxSaved).toBe(0);
    expect(result.ae.breakdown.incomeTax).toBe(result.none.incomeTax);
    expect(result.ae.netCost).toBe(result.ae.employee);
    expect(result.ae.breakdown.takeHome).toBe(result.none.takeHome - result.ae.employee);
  });
});

describe("occupational / PRSA alternative", () => {
  it("saves more tax at 40% than at 20% for the same employee cash", () => {
    const standard = runAutoEnrolPlan(
      input({
        salary: 30_000,
        altEmployeeAnnual: 5_000,
        altEmployeePct: (5_000 / 30_000) * 100,
        altEmployerAnnual: 0,
      }),
    );
    const higher = runAutoEnrolPlan(
      input({
        salary: 85_000,
        altEmployeeAnnual: 5_000,
        altEmployeePct: (5_000 / 85_000) * 100,
        altEmployerAnnual: 0,
      }),
    );
    expect(standard.alt.taxSaved).toBe(1_000);
    expect(standard.alt.netCost).toBe(4_000);
    expect(higher.alt.taxSaved).toBe(2_000);
    expect(higher.alt.netCost).toBe(3_000);
  });

  it("treats the SI exemption floor as exempt employment", () => {
    const floor = exemptionFloorContributions(50_000);
    expect(floor.employer).toBe(750);
    expect(floor.employee).toBe(1_000);
    expect(isExemptEmployment(50_000, 1_000, 750)).toBe(true);
    expect(isExemptEmployment(50_000, 500, 500)).toBe(false);

    const result = runAutoEnrolPlan(
      input({
        salary: 50_000,
        hasPayrollPension: true,
        altEmployeeAnnual: floor.employee,
        altEmployerAnnual: floor.employer,
        altEmployeePct: 2,
      }),
    );
    expect(result.eligibility).toBe("exempt");
    expect(result.alt.meetsExemption).toBe(true);
  });
});

describe("opt-out and fees", () => {
  it("refunds employee contributions only in the first opt-out year", () => {
    const result = runAutoEnrolPlan(input({ participation: "opt_out", yearsToContribute: 4 }));
    const year1 = result.projection[0];
    const stay = aeContributions(85_000, 2026);
    expect(year1.aeEmployee).toBe(0);
    expect(year1.aeEmployer).toBeCloseTo((stay.employer * 7) / 12, 2);
    expect(year1.aeState).toBeCloseTo((stay.state * 7) / 12, 2);
    expect(year1.aeAdminFee).toBeGreaterThan(0);

    const year2 = result.projection[1];
    expect(year2.aeEmployee).toBe(0);
    expect(year2.aeEmployer).toBe(0);
    expect(year2.aeState).toBe(0);
    expect(year2.aeAdminFee).toBe(0);

    const year3 = result.projection[2];
    expect(year3.aeEmployee).toBeGreaterThan(0);
    expect(year3.aeEmployer).toBeGreaterThan(0);
    expect(year3.aeAdminFee).toBe(annualAdminFee());
  });

  it("charges the weekly admin fee only while contributing", () => {
    const result = runAutoEnrolPlan(input({ participation: "suspend", yearsToContribute: 3 }));
    expect(result.projection[0].aeAdminFee).toBeCloseTo(annualAdminFee() * 0.5, 2);
    expect(result.projection[1].aeAdminFee).toBe(0);
    expect(result.projection[1].aeEmployee).toBe(0);
    expect(result.projection[2].aeAdminFee).toBe(annualAdminFee());
  });
});

import { calculateIrishIncomeTax, TAX_IE_2026, type TaxIeParams } from "../src/core/irish-income-tax";
import { calculateUsc } from "../src/core/irish-payroll-tax";
import { maxRelievableContribution } from "../src/core/irish-pension-rules";
import { runPensionPlan, type PensionInput } from "../src/tools/pension/engine";

function input(overrides: Partial<PensionInput> = {}): PensionInput {
  return {
    age: 34,
    relevantEarnings: 85_000,
    employmentType: "paye",
    taxStatus: "single",
    otherIncome: 0,
    sportsperson: false,
    schemeType: "occupational",
    employeeAnnual: 5_950,
    employeePctOfEarnings: 7,
    employerAnnual: 5_950,
    avcAnnual: 0,
    broughtForwardUnrelieved: 0,
    extraEmployeePct: 5,
    currentFund: 0,
    yearsToContribute: 10,
    annualReturnPct: 6,
    annualFeePct: 0.5,
    tax: TAX_IE_2026,
    ...overrides,
  };
}

describe("pension allowance", () => {
  it("matches the Revenue age 42 / €40,000 example", () => {
    expect(maxRelievableContribution(40_000, 42)).toBe(10_000);
    const result = runPensionPlan(input({ age: 42, relevantEarnings: 40_000, employeeAnnual: 0, employerAnnual: 0 }));
    expect(result.maxRelievable).toBe(10_000);
    expect(result.agePct).toBe(25);
  });

  it("caps earnings at €115,000 for age 60", () => {
    expect(maxRelievableContribution(200_000, 60)).toBe(46_000);
    const result = runPensionPlan(input({ age: 60, relevantEarnings: 200_000, employeeAnnual: 0 }));
    expect(result.maxRelievable).toBe(46_000);
  });

  it("warns when earnings exceed €115,000 and the employee is contributing", () => {
    const contributing = runPensionPlan(
      input({ age: 60, relevantEarnings: 200_000, employeeAnnual: 10_000 }),
    );
    expect(contributing.warnings.some((warning) => warning.includes("115,000"))).toBe(true);
    const none = runPensionPlan(input({ age: 60, relevantEarnings: 200_000, employeeAnnual: 0, avcAnnual: 0 }));
    expect(none.warnings.some((warning) => warning.includes("earnings cap"))).toBe(false);
  });

  it("uses 20% at age 34 on €85,000", () => {
    expect(maxRelievableContribution(85_000, 34)).toBe(17_000);
    const result = runPensionPlan(input());
    expect(result.maxRelievable).toBe(17_000);
    expect(result.unusedHeadroom).toBe(11_050);
  });

  it("does not let employer contributions reduce the employee cap", () => {
    const none = runPensionPlan(input({ employerAnnual: 0, employeeAnnual: 0 }));
    const withEmployer = runPensionPlan(input({ employerAnnual: 20_000, employeeAnnual: 0 }));
    expect(withEmployer.maxRelievable).toBe(none.maxRelievable);
  });

  it("gives no relief this year on excess over the cap", () => {
    const result = runPensionPlan(input({ employeeAnnual: 20_000 }));
    expect(result.relievable).toBe(17_000);
    expect(result.excess).toBe(3_000);
    expect(result.plan.taxSaved).toBe(result.maxed.taxSaved);
  });
});

describe("income tax relief split", () => {
  it("splits a €10k contribution across 40% and 20% at €50k single", () => {
    const result = runPensionPlan(
      input({
        relevantEarnings: 50_000,
        employeeAnnual: 10_000,
        employerAnnual: 0,
        age: 34,
      }),
    );
    expect(result.plan.taxSavedHigher).toBe(2_400);
    expect(result.plan.taxSavedStandard).toBe(800);
    expect(result.plan.taxSaved).toBe(3_200);
  });

  it("drops to 20% only when the proposed single band covers the salary", () => {
    const proposed: TaxIeParams = { ...TAX_IE_2026, bandSingle: 50_000 };
    const result = runPensionPlan(
      input({
        relevantEarnings: 50_000,
        employeeAnnual: 10_000,
        employerAnnual: 0,
        compareTax: proposed,
      }),
    );
    expect(result.plan.taxSaved).toBe(3_200);
    expect(result.compare?.plan.taxSaved).toBe(2_000);
    expect(result.compare?.deltaTaxSaved).toBe(-1_200);
  });

  it("still charges USC on employee contributions", () => {
    const result = runPensionPlan(input({ employeeAnnual: 10_000 }));
    expect(result.plan.breakdown.usc).toBe(result.none.breakdown.usc);
    expect(result.plan.breakdown.usc).toBe(calculateUsc(85_000));
  });
});

describe("Irish income tax 2026 band", () => {
  it("uses €44,000 as the single standard rate band", () => {
    expect(calculateIrishIncomeTax(44_000)).toBe(8_800);
    expect(calculateIrishIncomeTax(45_000)).toBe(8_800 + 400);
  });
});

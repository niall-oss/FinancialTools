import { TAX_IE_2026 } from "../src/core/irish-income-tax";
import { calculateUsc, uscSlices } from "../src/core/irish-payroll-tax";
import { calculateClassAPrsi, runPaye, runPayeScenario, type PayeInput } from "../src/tools/paye/engine";

function input(overrides: Partial<PayeInput> = {}): PayeInput {
  return {
    age: 30,
    salary: 50_000,
    taxStatus: "single",
    otherIncome: 0,
    employeePension: 0,
    flatRateExpenses: 0,
    bikHealth: 0,
    bikOther: 0,
    medicalCard: false,
    claimRent: false,
    claimAgeCredit: false,
    claimHomeCarer: false,
    claimIncapacitatedChild: false,
    useCreditOverride: false,
    creditCertTotal: 0,
    tax: TAX_IE_2026,
    ...overrides,
  };
}

describe("USC slices", () => {
  it("sum to calculateUsc on ordinary income", () => {
    const income = 85_000;
    const slices = uscSlices(income);
    expect(slices.reduce((sum, slice) => sum + slice.amount, 0)).toBe(calculateUsc(income));
    expect(slices.map((slice) => slice.ratePct)).toEqual([0.5, 2, 3, 8]);
  });

  it("are empty at or under the exemption", () => {
    expect(uscSlices(13_000)).toEqual([]);
    expect(calculateUsc(13_000)).toBe(0);
  });
});

describe("PAYE take-home", () => {
  it("matches a €50,000 single employee with personal and PAYE credits", () => {
    const result = runPayeScenario(input());
    expect(result.incomeTaxGross).toBe(11_200);
    expect(result.creditsApplied).toBe(4_000);
    expect(result.incomeTax).toBe(7_200);
    expect(result.incomeTaxStandard).toBe(8_800);
    expect(result.incomeTaxHigher).toBe(2_400);
    expect(result.usc).toBe(1_032.82);
    expect(result.prsi).toBe(2_118.75);
    expect(result.takeHome).toBe(39_648.43);
    expect(result.monthlyTakeHome).toBe(3_304.04);
  });

  it("cannot take income tax below zero", () => {
    const result = runPayeScenario(input({ salary: 15_000 }));
    expect(result.incomeTaxGross).toBe(3_000);
    expect(result.creditsApplied).toBe(4_000);
    expect(result.incomeTax).toBe(0);
    expect(result.unusedCredits).toBe(1_000);
  });

  it("adds health-insurance BIK to USC and PRSI and grants 20% relief", () => {
    const none = runPayeScenario(input());
    const withBik = runPayeScenario(input({ bikHealth: 2_000 }));
    expect(withBik.payeIncome).toBe(52_000);
    expect(withBik.salary).toBe(50_000);
    expect(withBik.usc).toBeGreaterThan(none.usc);
    expect(withBik.prsi).toBeGreaterThan(none.prsi);
    expect(withBik.incomeTax).toBe(7_600);
    expect(withBik.creditLines.some((line) => line.id === "health_insurance" && line.amount === 400)).toBe(true);
    expect(withBik.takeHome).toBeLessThan(none.takeHome);
  });

  it("uses reduced USC for a medical card at or under €60,000", () => {
    const ordinary = runPayeScenario(input());
    const reduced = runPayeScenario(input({ medicalCard: true }));
    expect(reduced.uscReduced).toBe(true);
    expect(reduced.usc).toBe(819.82);
    expect(reduced.usc).toBeLessThan(ordinary.usc);
    expect(reduced.uscSlices.map((slice) => slice.ratePct)).toEqual([0.5, 2]);
  });

  it("does not use reduced USC above €60,000 even with a medical card", () => {
    const result = runPayeScenario(input({ salary: 61_000, medicalCard: true }));
    expect(result.uscReduced).toBe(false);
    expect(result.uscSlices.some((slice) => slice.ratePct === 3)).toBe(true);
  });

  it("shows the extra tax when salary or BIK changes", () => {
    const result = runPaye(input(), { salary: 60_000, bikHealth: 0, bikOther: 0 });
    expect(result.compare).not.toBeNull();
    expect(result.delta?.takeHome).toBeGreaterThan(0);
    expect(result.delta?.incomeTax).toBeGreaterThan(0);
    expect(result.delta?.usc).toBeGreaterThan(0);
    expect(result.delta?.prsi).toBeGreaterThan(0);
    expect(result.current.takeHome + (result.delta?.takeHome ?? 0)).toBe(result.compare?.takeHome);
  });

  it("applies a what-if employee pension", () => {
    const result = runPaye(input(), {
      salary: 50_000,
      bikHealth: 0,
      bikOther: 0,
      employeePension: 5_000,
    });
    expect(result.compare?.employeePension).toBe(5_000);
    expect(result.compare?.usc).toBe(result.current.usc);
    expect(result.compare?.prsi).toBe(result.current.prsi);
    expect(result.compare?.incomeTax).toBeLessThan(result.current.incomeTax);
    expect(result.delta?.employeePension).toBe(5_000);
  });

  it("lets a tax-credit cert override replace derived credits", () => {
    const result = runPayeScenario(
      input({
        useCreditOverride: true,
        creditCertTotal: 5_000,
        claimRent: true,
      }),
    );
    expect(result.creditsApplied).toBe(5_000);
    expect(result.creditLines).toEqual([{ id: "cert", label: "Tax credit cert", amount: 5_000 }]);
    expect(result.incomeTax).toBe(6_200);
  });

  it("cuts income tax, not USC or PRSI, for an employee pension", () => {
    const none = runPayeScenario(input());
    const withPension = runPayeScenario(input({ employeePension: 5_000 }));
    expect(withPension.usc).toBe(none.usc);
    expect(withPension.prsi).toBe(none.prsi);
    expect(withPension.incomeTax).toBeLessThan(none.incomeTax);
    expect(withPension.takeHome).toBe(round2ish(none.takeHome - 5_000 + (none.incomeTax - withPension.incomeTax)));
  });

  it("gives no income-tax relief above the age-band cap", () => {
    const over = runPaye(input({ age: 29, employeePension: 10_000 }));
    const capped = runPayeScenario(input({ age: 29, employeePension: 7_500 }));
    expect(over.current.pensionReliefPct).toBe(15);
    expect(over.current.pensionReliefCap).toBe(7_500);
    expect(over.current.pensionRelieved).toBe(7_500);
    expect(over.current.pensionExcess).toBe(2_500);
    expect(over.current.incomeTax).toBe(capped.incomeTax);
    expect(over.current.taxableIncome).toBe(capped.taxableIncome);
    expect(over.current.takeHome).toBe(round2ish(capped.takeHome - 2_500));
    expect(over.warnings.some((warning) => warning.includes("no income-tax relief"))).toBe(true);
  });

  it("unlocks the 20% band in a what-if at age 30", () => {
    const result = runPaye(input({ age: 29, employeePension: 10_000 }), {
      salary: 50_000,
      bikHealth: 0,
      bikOther: 0,
      employeePension: 10_000,
      age: 30,
    });
    expect(result.compare?.pensionReliefPct).toBe(20);
    expect(result.compare?.pensionExcess).toBe(0);
    expect(result.compare?.incomeTax).toBeLessThan(result.current.incomeTax);
    expect(result.compare?.prsi).toBe(result.current.prsi);
  });

  it("caps relief at 15% of €115,000 on a larger salary", () => {
    const result = runPayeScenario(input({ age: 29, salary: 200_000, employeePension: 30_000 }));
    expect(result.pensionReliefCap).toBe(17_250);
    expect(result.pensionRelieved).toBe(17_250);
    expect(result.pensionExcess).toBe(12_750);
  });

  it("warns when salary is above the €115,000 earnings cap and there is a pension", () => {
    const withPension = runPaye(input({ age: 30, salary: 200_000, employeePension: 5_000 }));
    expect(withPension.warnings.some((warning) => warning.includes("115,000"))).toBe(true);
    const none = runPaye(input({ age: 30, salary: 200_000, employeePension: 0 }));
    expect(none.warnings.some((warning) => warning.includes("115,000"))).toBe(false);
  });
});

describe("Class A PRSI 2026", () => {
  it("blends 39 weeks at 4.2% and 13 weeks at 4.35%", () => {
    expect(calculateClassAPrsi(50_000, 30)).toBe(2_118.75);
  });

  it("is zero at or under the weekly exemption", () => {
    expect(calculateClassAPrsi(352 * 52, 30)).toBe(0);
  });

  it("is zero from age 70", () => {
    expect(calculateClassAPrsi(50_000, 70)).toBe(0);
  });
});

function round2ish(value: number): number {
  return Math.round(value * 100) / 100;
}

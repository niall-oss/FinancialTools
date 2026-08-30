import { DEFAULTS } from "../src/core/config/schema";
import { isOfficialSourceUrl } from "../src/learn/official";
import { runwayLearn } from "../src/tools/runway/learn";
import {
  IE_JPRB_MIN_WEEKLY,
  jaPersonalRate,
  jprbHitsCap,
  jprbRateAtWeek,
  jprbSchedule,
  weeklyFromAnnualSalary,
} from "../src/core/irish-jobseeker-rules";
import {
  addExpense,
  addGroup,
  addIncome,
  decodeExpenses,
  decodeIncomes,
  encodeExpenses,
  encodeIncomes,
  jaIncomeFromAge,
  jprbIncomeFromSalary,
  parseRunwaySection,
  removeGroup,
  runRunway,
  serializeRunwayState,
  toWeekly,
  updateExpense,
  WEEKS_PER_MONTH,
  type RunwayState,
} from "../src/tools/runway/engine";

function baseState(overrides: Partial<RunwayState> = {}): RunwayState {
  return {
    cash: 0,
    useNetworthCash: false,
    prsiBand: "5plus",
    afterJprbJa: false,
    targetMonths: 6,
    horizonMonths: 36,
    expenseGroups: ["Housing", "Food", "Other"],
    expenses: [],
    incomes: [],
    ...overrides,
  };
}

describe("irish jobseeker rules", () => {
  it("caps JPRB at the published weekly maxima and floors at €125", () => {
    const high = jprbSchedule(2000, "5plus");
    expect(high.map((row) => row.weeklyRate)).toEqual([450, 375, 300]);
    expect(high[0].weekEnd).toBe(13);
    expect(high[2].weekEnd).toBe(39);

    const low = jprbSchedule(100, "5plus");
    expect(low.every((row) => row.weeklyRate === IE_JPRB_MIN_WEEKLY)).toBe(true);

    const short = jprbSchedule(2000, "2to5");
    expect(short).toHaveLength(1);
    expect(short[0]).toMatchObject({ weeklyRate: 300, weekEnd: 26 });
  });

  it("flags weekly gross that would exceed a JPRB payment cap", () => {
    expect(jprbHitsCap(600, "5plus")).toBe(false);
    expect(jprbHitsCap(601, "5plus")).toBe(true);
    expect(jprbHitsCap(400, "5plus")).toBe(false);
    expect(jprbHitsCap(2000, "5plus")).toBe(true);
    expect(jprbHitsCap(600, "2to5")).toBe(false);
    expect(jprbHitsCap(601, "2to5")).toBe(true);
  });

  it("pays nothing after the JPRB schedule ends", () => {
    expect(jprbRateAtWeek(2000, "5plus", 38)).toBe(300);
    expect(jprbRateAtWeek(2000, "5plus", 39)).toBe(0);
    expect(jprbRateAtWeek(2000, "2to5", 26)).toBe(0);
  });

  it("uses the under-25 JA personal rate below age 25", () => {
    expect(jaPersonalRate(24)).toBe(163.7);
    expect(jaPersonalRate(25)).toBe(254);
    expect(jaPersonalRate(40)).toBe(254);
  });
});

describe("encode and decode", () => {
  it("round-trips expenses including non-essential zeros", () => {
    const encoded = encodeExpenses([
      { group: "Housing", name: "Rent", amount: 1400, freq: "monthly", essential: true },
      { group: "Food", name: "Eating out", amount: 0, freq: "monthly", essential: false },
    ]);
    expect(encoded).toBe("Housing|Rent|1400|monthly|1;Food|Eating out|0|monthly|0");
    expect(decodeExpenses(encoded)).toEqual([
      {
        id: "expense-0",
        group: "Housing",
        name: "Rent",
        amount: 1400,
        freq: "monthly",
        essential: true,
      },
      {
        id: "expense-1",
        group: "Food",
        name: "Eating out",
        amount: 0,
        freq: "monthly",
        essential: false,
      },
    ]);
  });

  it("strips delimiters from names", () => {
    const encoded = encodeExpenses([
      { group: "Food", name: "A|B;C", amount: 10, freq: "weekly", essential: true },
    ]);
    expect(encoded).toBe("Food|A B C|10|weekly|1");
  });

  it("round-trips incomes", () => {
    const encoded = encodeIncomes([
      { kind: "ja", name: "Jobseeker's Allowance", amount: 254, freq: "weekly", startWeek: 0, durationWeeks: 0 },
    ]);
    expect(encoded).toBe("ja|Jobseeker's Allowance|254|weekly|0|0");
    expect(decodeIncomes(encoded)[0].kind).toBe("ja");
  });

  it("round-trips a full section", () => {
    const state = baseState({
      cash: 8000,
      expenses: [
        { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
      ],
    });
    expect(parseRunwaySection(serializeRunwayState(state))).toEqual(state);
  });
});

describe("runRunway", () => {
  it("converts monthly spend to a weekly burn", () => {
    expect(toWeekly(1300, "monthly")).toBeCloseTo((1300 * 12) / 52);
  });

  it("lasts cash / monthly spend months with no income", () => {
    const result = runRunway(
      baseState({
        cash: 6000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.monthsRemaining).toBeCloseTo(6, 5);
    expect(result.emptyWeek).toBeCloseTo(6 * WEEKS_PER_MONTH, 5);
    expect(result.survivesHorizon).toBe(false);
  });

  it("extends runway when income covers part of the burn", () => {
    const none = runRunway(
      baseState({
        cash: 6000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    const withIncome = runRunway(
      baseState({
        cash: 6000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
        ],
        incomes: [
          { id: "income-0", kind: "other", name: "Side", amount: 400, freq: "monthly", startWeek: 0, durationWeeks: 0 },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(withIncome.monthsRemaining).toBeGreaterThan(none.monthsRemaining);
    expect(withIncome.monthsRemaining).toBeCloseTo(10, 5);
  });

  it("treats essentials-only as a longer runway", () => {
    const result = runRunway(
      baseState({
        cash: 3000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
          { id: "expense-1", group: "Food", name: "Takeaway", amount: 500, freq: "monthly", essential: false },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.monthsRemaining).toBeCloseTo(2, 5);
    expect(result.leanMonthsRemaining).toBeCloseTo(3, 5);
  });

  it("uses net worth cash when the toggle is on", () => {
    const result = runRunway(
      baseState({
        cash: 1000,
        useNetworthCash: true,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
        ],
      }),
      { age: 30, networthCash: 6000 },
    );
    expect(result.startingCash).toBe(6000);
    expect(result.monthsRemaining).toBeCloseTo(6, 5);
  });

  it("reports surviving the horizon when cash never hits zero", () => {
    const result = runRunway(
      baseState({
        cash: 50_000,
        horizonMonths: 12,
        targetMonths: 6,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 100, freq: "monthly", essential: true },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.survivesHorizon).toBe(true);
    expect(result.emptyWeek).toBeNull();
    expect(result.monthsRemaining).toBe(12);
  });

  it("needs expenses minus income times 6 for a flat 6-month pot", () => {
    const result = runRunway(
      baseState({
        cash: 1000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
        ],
        incomes: [
          { id: "income-0", kind: "other", name: "Side", amount: 200, freq: "monthly", startWeek: 0, durationWeeks: 0 },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.cashNeeded).toBeCloseTo(4800, 6);
    expect(result.cashGap).toBeCloseTo(3800, 6);
    expect(result.monthlyExpenses).toBeCloseTo(1000, 6);
    expect(result.monthlyIncomeNow).toBeCloseTo(200, 6);
    expect(result.netBurnNow).toBeCloseTo(800, 6);
  });

  it("needs more than month-1 burn times 6 when JPRB steps down", () => {
    const salary = 70_000;
    const state = baseState({
      cash: 0,
      prsiBand: "5plus",
      expenses: [
        { id: "expense-0", group: "Housing", name: "Rent", amount: 2500, freq: "monthly", essential: true },
      ],
      incomes: [{ id: "income-0", ...jprbIncomeFromSalary(salary, "5plus") }],
    });
    const result = runRunway(state, { age: 30, networthCash: 0 });
    const flat = result.netBurnNow * 6;
    expect(result.cashNeeded).toBeGreaterThan(flat + 1);
    expect(weeklyFromAnnualSalary(salary)).toBeCloseTo(salary / 52);
  });

  it("needs €0 when income covers spend", () => {
    const result = runRunway(
      baseState({
        cash: 2000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 400, freq: "monthly", essential: true },
        ],
        incomes: [
          { id: "income-0", kind: "other", name: "Side", amount: 500, freq: "monthly", startWeek: 0, durationWeeks: 0 },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.cashNeeded).toBe(0);
    expect(result.cashGap).toBe(-2000);
    expect(result.survivesHorizon).toBe(true);
  });

  it("continues JA after JPRB when the toggle is on", () => {
    const withJa = runRunway(
      baseState({
        cash: 20_000,
        afterJprbJa: true,
        prsiBand: "5plus",
        horizonMonths: 18,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 2000, freq: "monthly", essential: true },
        ],
        incomes: [{ id: "income-0", ...jprbIncomeFromSalary(70_000, "5plus") }],
      }),
      { age: 30, networthCash: 0 },
    );
    const withoutJa = runRunway(
      baseState({
        cash: 20_000,
        afterJprbJa: false,
        prsiBand: "5plus",
        horizonMonths: 18,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 2000, freq: "monthly", essential: true },
        ],
        incomes: [{ id: "income-0", ...jprbIncomeFromSalary(70_000, "5plus") }],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(withJa.monthsRemaining).toBeGreaterThan(withoutJa.monthsRemaining);
    expect(jaIncomeFromAge(30).amount).toBe(254);
  });

  it("warns when JA sits on a pot over €20,000", () => {
    const result = runRunway(
      baseState({
        cash: 25_000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 100, freq: "monthly", essential: true },
        ],
        incomes: [{ id: "income-0", ...jaIncomeFromAge(30) }],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.warnings.some((row) => row.id === "ja-capital")).toBe(true);
  });

  it("ranks cutting the largest burn first", () => {
    const result = runRunway(
      baseState({
        cash: 3000,
        expenses: [
          { id: "expense-0", group: "Housing", name: "Rent", amount: 1000, freq: "monthly", essential: true },
          { id: "expense-1", group: "Food", name: "Snacks", amount: 100, freq: "monthly", essential: false },
        ],
      }),
      { age: 30, networthCash: 0 },
    );
    expect(result.cutRank[0].name).toBe("Rent");
    expect(result.cutRank[0].monthsGained).toBeGreaterThan(result.cutRank[1].monthsGained);
  });
});

describe("mutations", () => {
  it("moves items to Other when a group is removed", () => {
    let state = baseState({
      expenses: [
        { id: "expense-0", group: "Housing", name: "Rent", amount: 10, freq: "monthly", essential: true },
      ],
    });
    state = addGroup(state, "Pets");
    const added = addExpense(state, { group: "Pets", name: "Food", amount: 20 });
    state = updateExpense(added.state, added.id, { amount: 25 });
    state = removeGroup(state, "Pets");
    expect(state.expenses.find((row) => row.name === "Food")?.group).toBe("Other");
  });

  it("adds income rows with sequential ids", () => {
    const first = addIncome(baseState(), jaIncomeFromAge(30));
    const second = addIncome(first.state, { kind: "other", name: "Dividends", amount: 50, freq: "monthly", startWeek: 0, durationWeeks: 0 });
    expect(second.state.incomes.map((row) => row.id)).toEqual(["income-0", "income-1"]);
  });
});

describe("schema defaults", () => {
  it("parses the bundled runway section", () => {
    const parsed = parseRunwaySection(DEFAULTS.runway ?? {});
    expect(parsed.cash).toBe(15000);
    expect(parsed.targetMonths).toBe(6);
    expect(parsed.expenses.length).toBeGreaterThan(0);
  });
});

describe("learn sources", () => {
  it("uses official https hosts", () => {
    for (const source of runwayLearn.sources) {
      expect(isOfficialSourceUrl(source.url), source.url).toBe(true);
    }
  });

  it("points topics at sources that exist", () => {
    const ids = new Set(runwayLearn.sources.map((source) => source.id));
    for (const topic of runwayLearn.topics) {
      for (const sourceId of topic.sourceIds) {
        expect(ids.has(sourceId), `${topic.id} -> ${sourceId}`).toBe(true);
      }
    }
  });
});

import type { ConfigSection } from "@/core/config/schema";
import {
  IE_CHILD_BENEFIT_MONTHLY,
  IE_JA_CAPITAL_DISREGARD,
  IE_JB_PERSONAL_MAX,
  jaPersonalRate,
  jbDurationWeeks,
  jprbDurationWeeks,
  jprbRateAtWeek,
  weeklyFromAnnualSalary,
  type PrsiBand,
} from "@/core/irish-jobseeker-rules";

export type ExpenseFreq = "monthly" | "weekly" | "annual";
export type IncomeFreq = "weekly" | "monthly" | "annual";
export type IncomeKind =
  | "jprb"
  | "ja"
  | "jb"
  | "child_benefit"
  | "investment"
  | "rental"
  | "partner"
  | "work"
  | "other";

export interface ExpenseItem {
  id: string;
  group: string;
  name: string;
  amount: number;
  freq: ExpenseFreq;
  essential: boolean;
}

export interface IncomeItem {
  id: string;
  kind: IncomeKind;
  name: string;
  amount: number;
  freq: IncomeFreq;
  startWeek: number;
  durationWeeks: number;
}

export interface RunwayState {
  cash: number;
  useNetworthCash: boolean;
  prsiBand: PrsiBand;
  afterJprbJa: boolean;
  targetMonths: number;
  horizonMonths: number;
  expenseGroups: string[];
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
}

export interface MonthSnap {
  label: string;
  cash: number;
  leanCash: number;
  sizedCash: number;
  expenses: number;
  income: number;
  burn: number;
  expenseByGroup: Record<string, number>;
}

export interface CutRankRow {
  id: string;
  group: string;
  name: string;
  amount: number;
  monthsGained: number;
}

export type RunwayWarningTone = "fail" | "warning";

export interface RunwayWarning {
  id: string;
  message: string;
  tone: RunwayWarningTone;
}

export interface RunwayResult {
  startingCash: number;
  monthsRemaining: number;
  leanMonthsRemaining: number;
  emptyWeek: number | null;
  survivesHorizon: boolean;
  leanSurvivesHorizon: boolean;
  monthlyExpenses: number;
  monthlyIncomeNow: number;
  netBurnNow: number;
  cashNeeded: number;
  cashGap: number;
  leanCashNeeded: number;
  targetMonths: number;
  byMonth: MonthSnap[];
  cutRank: CutRankRow[];
  warnings: RunwayWarning[];
}

export const OTHER_GROUP = "Other";

export const DEFAULT_EXPENSE_GROUPS = [
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Insurance",
  "Debt",
  "Childcare",
  "Other",
] as const;

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
export const WEEKS_PER_MONTH = WEEKS_PER_YEAR / MONTHS_PER_YEAR;

const EXPENSE_FREQS = new Set<ExpenseFreq>(["monthly", "weekly", "annual"]);
const INCOME_FREQS = new Set<IncomeFreq>(["weekly", "monthly", "annual"]);
const INCOME_KINDS = new Set<IncomeKind>([
  "jprb",
  "ja",
  "jb",
  "child_benefit",
  "investment",
  "rental",
  "partner",
  "work",
  "other",
]);

export function sanitizeLabel(value: string): string {
  return value.replace(/[|;,#]/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

export function clampMonths(value: number, fallback: number, max = 120): number {
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(max, Math.round(value));
}

function sectionString(section: ConfigSection, key: string): string | undefined {
  const value = section[key];
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  return String(value);
}

function sectionNumber(section: ConfigSection, key: string, fallback: number): number {
  const value = section[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function sectionBoolean(section: ConfigSection, key: string, fallback: boolean): boolean {
  const value = section[key];
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parsePrsiBand(raw: string | undefined): PrsiBand {
  return raw === "2to5" ? "2to5" : "5plus";
}

function parseExpenseFreq(raw: string | undefined): ExpenseFreq {
  if (raw && EXPENSE_FREQS.has(raw as ExpenseFreq)) return raw as ExpenseFreq;
  return "monthly";
}

function parseIncomeFreq(raw: string | undefined): IncomeFreq {
  if (raw && INCOME_FREQS.has(raw as IncomeFreq)) return raw as IncomeFreq;
  return "weekly";
}

function parseIncomeKind(raw: string | undefined): IncomeKind {
  if (raw && INCOME_KINDS.has(raw as IncomeKind)) return raw as IncomeKind;
  return "other";
}

export function encodeGroups(groups: string[]): string {
  return groups.map(sanitizeLabel).filter(Boolean).join(",");
}

export function decodeGroups(raw: string | undefined, fallback: readonly string[]): string[] {
  if (raw === undefined) return [...fallback];
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const part of raw.split(",")) {
    const name = sanitizeLabel(part);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    groups.push(name);
  }
  return groups;
}

export function toWeekly(amount: number, freq: ExpenseFreq | IncomeFreq): number {
  const value = normalizeAmount(amount);
  if (freq === "weekly") return value;
  if (freq === "annual") return value / WEEKS_PER_YEAR;
  return (value * MONTHS_PER_YEAR) / WEEKS_PER_YEAR;
}

export function toMonthly(amount: number, freq: ExpenseFreq | IncomeFreq): number {
  return toWeekly(amount, freq) * WEEKS_PER_MONTH;
}

export function weeksForMonths(months: number): number {
  return Math.max(1, Math.round(clampMonths(months, 1) * WEEKS_PER_MONTH));
}

export function encodeExpenses(items: Omit<ExpenseItem, "id">[]): string {
  return items
    .map((item) => {
      const group = sanitizeLabel(item.group) || OTHER_GROUP;
      const name = sanitizeLabel(item.name) || "Item";
      const essential = item.essential ? "1" : "0";
      return `${group}|${name}|${normalizeAmount(item.amount)}|${item.freq}|${essential}`;
    })
    .join(";");
}

export function decodeExpenses(raw: string | undefined): ExpenseItem[] {
  if (!raw?.trim()) return [];
  const items: ExpenseItem[] = [];
  for (const chunk of raw.split(";")) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("|");
    if (parts.length < 3) continue;
    const amount = normalizeAmount(Number(parts[2]));
    items.push({
      id: `expense-${items.length}`,
      group: sanitizeLabel(parts[0]) || OTHER_GROUP,
      name: sanitizeLabel(parts[1]) || "Item",
      amount,
      freq: parseExpenseFreq(parts[3]),
      essential: parts[4] !== "0",
    });
  }
  return items;
}

export function encodeIncomes(items: Omit<IncomeItem, "id">[]): string {
  return items
    .map((item) => {
      const name = sanitizeLabel(item.name) || "Income";
      const start = Math.max(0, Math.round(item.startWeek) || 0);
      const duration = Math.max(0, Math.round(item.durationWeeks) || 0);
      return `${item.kind}|${name}|${normalizeAmount(item.amount)}|${item.freq}|${start}|${duration}`;
    })
    .join(";");
}

export function decodeIncomes(raw: string | undefined): IncomeItem[] {
  if (!raw?.trim()) return [];
  const items: IncomeItem[] = [];
  for (const chunk of raw.split(";")) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("|");
    if (parts.length < 3) continue;
    items.push({
      id: `income-${items.length}`,
      kind: parseIncomeKind(parts[0]),
      name: sanitizeLabel(parts[1]) || "Income",
      amount: normalizeAmount(Number(parts[2])),
      freq: parseIncomeFreq(parts[3]),
      startWeek: Math.max(0, Math.round(Number(parts[4])) || 0),
      durationWeeks: Math.max(0, Math.round(Number(parts[5])) || 0),
    });
  }
  return items;
}

export function serializeRunwayState(state: RunwayState): Record<string, string | number | boolean> {
  return {
    cash: normalizeAmount(state.cash),
    use_networth_cash: state.useNetworthCash,
    prsi_band: state.prsiBand,
    after_jprb_ja: state.afterJprbJa,
    target_months: clampMonths(state.targetMonths, 6, 60),
    horizon_months: clampMonths(state.horizonMonths, 36, 120),
    expense_groups: encodeGroups(state.expenseGroups),
    expenses: encodeExpenses(state.expenses),
    incomes: encodeIncomes(state.incomes),
  };
}

export function parseRunwaySection(section: ConfigSection): RunwayState {
  return {
    cash: normalizeAmount(sectionNumber(section, "cash", 0)),
    useNetworthCash: sectionBoolean(section, "use_networth_cash", false),
    prsiBand: parsePrsiBand(sectionString(section, "prsi_band")),
    afterJprbJa: sectionBoolean(section, "after_jprb_ja", false),
    targetMonths: clampMonths(sectionNumber(section, "target_months", 6), 6, 60),
    horizonMonths: clampMonths(sectionNumber(section, "horizon_months", 36), 36, 120),
    expenseGroups: decodeGroups(sectionString(section, "expense_groups"), DEFAULT_EXPENSE_GROUPS),
    expenses: decodeExpenses(sectionString(section, "expenses")),
    incomes: decodeIncomes(sectionString(section, "incomes")),
  };
}

function ensureGroup(state: RunwayState, group: string): RunwayState {
  const name = sanitizeLabel(group) || OTHER_GROUP;
  if (state.expenseGroups.includes(name)) return state;
  return { ...state, expenseGroups: [...state.expenseGroups, name] };
}

export function addExpense(
  state: RunwayState,
  input: { group: string; name: string; amount?: number; freq?: ExpenseFreq; essential?: boolean },
): { state: RunwayState; id: string } {
  const withGroup = ensureGroup(state, input.group);
  const item: ExpenseItem = {
    id: `expense-${withGroup.expenses.length}`,
    group: sanitizeLabel(input.group) || OTHER_GROUP,
    name: sanitizeLabel(input.name) || "Item",
    amount: normalizeAmount(input.amount ?? 0),
    freq: input.freq ?? "monthly",
    essential: input.essential ?? true,
  };
  return { state: { ...withGroup, expenses: [...withGroup.expenses, item] }, id: item.id };
}

export function updateExpense(
  state: RunwayState,
  id: string,
  patch: Partial<Pick<ExpenseItem, "name" | "amount" | "freq" | "essential">>,
): RunwayState {
  return {
    ...state,
    expenses: state.expenses.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        name: patch.name === undefined ? item.name : sanitizeLabel(patch.name) || item.name,
        amount: patch.amount === undefined ? item.amount : normalizeAmount(patch.amount),
        freq: patch.freq ?? item.freq,
        essential: patch.essential ?? item.essential,
      };
    }),
  };
}

export function removeExpense(state: RunwayState, id: string): RunwayState {
  return { ...state, expenses: state.expenses.filter((item) => item.id !== id) };
}

export function addIncome(
  state: RunwayState,
  input: Omit<IncomeItem, "id">,
): { state: RunwayState; id: string } {
  const item: IncomeItem = {
    ...input,
    id: `income-${state.incomes.length}`,
    name: sanitizeLabel(input.name) || "Income",
    amount: normalizeAmount(input.amount),
    startWeek: Math.max(0, Math.round(input.startWeek) || 0),
    durationWeeks: Math.max(0, Math.round(input.durationWeeks) || 0),
  };
  return { state: { ...state, incomes: [...state.incomes, item] }, id: item.id };
}

export function updateIncome(
  state: RunwayState,
  id: string,
  patch: Partial<Pick<IncomeItem, "name" | "amount" | "freq" | "startWeek" | "durationWeeks" | "kind">>,
): RunwayState {
  return {
    ...state,
    incomes: state.incomes.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        kind: patch.kind ?? item.kind,
        name: patch.name === undefined ? item.name : sanitizeLabel(patch.name) || item.name,
        amount: patch.amount === undefined ? item.amount : normalizeAmount(patch.amount),
        freq: patch.freq ?? item.freq,
        startWeek: patch.startWeek === undefined ? item.startWeek : Math.max(0, Math.round(patch.startWeek) || 0),
        durationWeeks:
          patch.durationWeeks === undefined ? item.durationWeeks : Math.max(0, Math.round(patch.durationWeeks) || 0),
      };
    }),
  };
}

export function removeIncome(state: RunwayState, id: string): RunwayState {
  return { ...state, incomes: state.incomes.filter((item) => item.id !== id) };
}

export function addGroup(state: RunwayState, rawName: string): RunwayState {
  const name = sanitizeLabel(rawName);
  if (!name) return state;
  return ensureGroup(state, name);
}

export function removeGroup(state: RunwayState, group: string): RunwayState {
  if (!state.expenseGroups.includes(group)) return state;
  const moved = state.expenses.filter((item) => item.group === group);
  if (group === OTHER_GROUP && moved.length > 0) return state;

  let nextGroups = state.expenseGroups.filter((name) => name !== group);
  let expenses = state.expenses;
  if (moved.length > 0) {
    if (!nextGroups.includes(OTHER_GROUP)) nextGroups = [...nextGroups, OTHER_GROUP];
    expenses = state.expenses.map((item) => (item.group === group ? { ...item, group: OTHER_GROUP } : item));
  }
  return { ...state, expenseGroups: nextGroups, expenses };
}

export function startingCash(state: RunwayState, networthCash: number): number {
  if (state.useNetworthCash) return normalizeAmount(networthCash);
  return normalizeAmount(state.cash);
}

function incomeActiveAt(item: IncomeItem, week: number): boolean {
  if (week < item.startWeek) return false;
  if (item.durationWeeks <= 0) return true;
  return week < item.startWeek + item.durationWeeks;
}

function jprbEndWeek(state: RunwayState): number | null {
  const rows = state.incomes.filter((item) => item.kind === "jprb" && item.amount > 0);
  if (rows.length === 0) return null;
  const duration = jprbDurationWeeks(state.prsiBand);
  return Math.max(...rows.map((item) => item.startWeek + duration));
}

function weeklyIncomeAt(state: RunwayState, week: number, age: number): number {
  let total = 0;
  for (const item of state.incomes) {
    if (item.kind === "jprb") {
      const local = week - item.startWeek;
      total += jprbRateAtWeek(item.amount, state.prsiBand, local);
      continue;
    }
    if (!incomeActiveAt(item, week)) continue;
    total += toWeekly(item.amount, item.freq);
  }
  if (state.afterJprbJa) {
    const end = jprbEndWeek(state);
    if (end !== null && week >= end) total += jaPersonalRate(age);
  }
  return total;
}

function listedExpenses(state: RunwayState, essentialOnly: boolean): ExpenseItem[] {
  return state.expenses.filter((item) => item.amount > 0 && (!essentialOnly || item.essential));
}

function weeklyExpenseTotal(expenses: ExpenseItem[]): number {
  return expenses.reduce((sum, item) => sum + toWeekly(item.amount, item.freq), 0);
}

function weeklyExpenseByGroup(expenses: ExpenseItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of expenses) {
    map.set(item.group, (map.get(item.group) ?? 0) + toWeekly(item.amount, item.freq));
  }
  return map;
}

interface PathResult {
  monthsRemaining: number;
  emptyWeek: number | null;
  survivesHorizon: boolean;
  cashPath: number[];
  monthCash: number[];
  monthIncome: number[];
  monthExpenses: number[];
  monthExpenseByGroup: Record<string, number>[];
  prefixMin: number;
}

function simulatePath(
  state: RunwayState,
  options: { startCash: number; essentialOnly: boolean; age: number; weeks: number; monthCount: number },
): PathResult {
  const expenses = listedExpenses(state, options.essentialOnly);
  const weeklyExp = weeklyExpenseTotal(expenses);
  const byGroup = weeklyExpenseByGroup(expenses);
  const cashPath: number[] = [];
  const monthCash = Array.from({ length: options.monthCount }, () => 0);
  const monthIncome = Array.from({ length: options.monthCount }, () => 0);
  const monthExpenses = Array.from({ length: options.monthCount }, () => 0);
  const monthExpenseByGroup: Record<string, number>[] = Array.from({ length: options.monthCount }, () => ({}));

  let cash = options.startCash;
  let prefix = 0;
  let prefixMin = 0;
  let emptyWeek: number | null = null;

  for (let week = 0; week < options.weeks; week += 1) {
    const income = weeklyIncomeAt(state, week, options.age);
    const net = income - weeklyExp;
    const cashBefore = cash;
    cash += net;
    prefix += net;
    if (prefix < prefixMin) prefixMin = prefix;

    if (emptyWeek === null && cash <= 0 && net < 0) {
      if (cashBefore <= 0) {
        emptyWeek = week;
      } else {
        const drop = cashBefore - cash;
        emptyWeek = drop > 0 ? week + cashBefore / drop : week;
      }
    }

    const monthIndex = Math.min(options.monthCount - 1, Math.floor(week / WEEKS_PER_MONTH));
    monthIncome[monthIndex] += income;
    monthExpenses[monthIndex] += weeklyExp;
    for (const [group, amount] of byGroup) {
      monthExpenseByGroup[monthIndex][group] = (monthExpenseByGroup[monthIndex][group] ?? 0) + amount;
    }
    monthCash[monthIndex] = Math.max(0, cash);
    cashPath.push(cash);
  }

  const survivesHorizon = emptyWeek === null;
  const monthsRemaining = emptyWeek === null ? options.monthCount : emptyWeek / WEEKS_PER_MONTH;

  return {
    monthsRemaining,
    emptyWeek,
    survivesHorizon,
    cashPath,
    monthCash,
    monthIncome,
    monthExpenses,
    monthExpenseByGroup,
    prefixMin,
  };
}

function cashNeededFromPrefix(prefixMin: number): number {
  return Math.max(0, -prefixMin);
}

export function runRunway(
  state: RunwayState,
  options: { age: number; networthCash: number },
): RunwayResult {
  const targetMonths = clampMonths(state.targetMonths, 6, 60);
  const horizonMonths = Math.max(targetMonths, clampMonths(state.horizonMonths, 36, 120));
  const weeks = weeksForMonths(horizonMonths);
  const targetWeeks = weeksForMonths(targetMonths);
  const cash = startingCash(state, options.networthCash);
  const age = options.age;

  const full = simulatePath(state, {
    startCash: cash,
    essentialOnly: false,
    age,
    weeks,
    monthCount: horizonMonths,
  });
  const lean = simulatePath(state, {
    startCash: cash,
    essentialOnly: true,
    age,
    weeks,
    monthCount: horizonMonths,
  });

  const needFull = simulatePath(state, {
    startCash: 0,
    essentialOnly: false,
    age,
    weeks: targetWeeks,
    monthCount: targetMonths,
  });
  const needLean = simulatePath(state, {
    startCash: 0,
    essentialOnly: true,
    age,
    weeks: targetWeeks,
    monthCount: targetMonths,
  });
  const cashNeeded = cashNeededFromPrefix(needFull.prefixMin);
  const leanCashNeeded = cashNeededFromPrefix(needLean.prefixMin);

  const sized = simulatePath(state, {
    startCash: cashNeeded,
    essentialOnly: false,
    age,
    weeks,
    monthCount: horizonMonths,
  });

  const listed = listedExpenses(state, false);
  const monthlyExpenses = listed.reduce((sum, item) => sum + toMonthly(item.amount, item.freq), 0);
  const monthlyIncomeNow = weeklyIncomeAt(state, 0, age) * WEEKS_PER_MONTH;

  const byMonth: MonthSnap[] = [];
  for (let i = 0; i < horizonMonths; i += 1) {
    const expenses = full.monthExpenses[i] ?? 0;
    const income = full.monthIncome[i] ?? 0;
    byMonth.push({
      label: `M${i + 1}`,
      cash: full.monthCash[i] ?? 0,
      leanCash: lean.monthCash[i] ?? 0,
      sizedCash: sized.monthCash[i] ?? 0,
      expenses,
      income,
      burn: expenses - income,
      expenseByGroup: full.monthExpenseByGroup[i] ?? {},
    });
  }

  const cutRank: CutRankRow[] = [];
  for (const item of listedExpenses(state, false)) {
    const next: RunwayState = {
      ...state,
      expenses: state.expenses.filter((row) => row.id !== item.id),
    };
    const without = simulatePath(next, {
      startCash: cash,
      essentialOnly: false,
      age,
      weeks,
      monthCount: horizonMonths,
    });
    cutRank.push({
      id: item.id,
      group: item.group,
      name: item.name,
      amount: toMonthly(item.amount, item.freq),
      monthsGained: without.monthsRemaining - full.monthsRemaining,
    });
  }
  cutRank.sort((a, b) => b.monthsGained - a.monthsGained || b.amount - a.amount);

  const cashGap = cashNeeded - cash;
  const hasJa =
    state.afterJprbJa || state.incomes.some((item) => item.kind === "ja" && item.amount > 0);
  const warnings: RunwayWarning[] = [];
  if (!full.survivesHorizon && full.monthsRemaining < 3) {
    warnings.push({
      id: "short-3",
      tone: "fail",
      message: "Under 3 months of runway.",
    });
  } else if (!full.survivesHorizon && full.monthsRemaining < 6) {
    warnings.push({
      id: "short-6",
      tone: "warning",
      message: "Under 6 months of runway.",
    });
  }
  if (cashGap > 0.5) {
    warnings.push({
      id: "target-short",
      tone: full.monthsRemaining < 3 ? "fail" : "warning",
      message: `Short of the cash needed for ${targetMonths} months.`,
    });
  }
  if (hasJa && cash > IE_JA_CAPITAL_DISREGARD) {
    warnings.push({
      id: "ja-capital",
      tone: "warning",
      message:
        "Savings over €20,000 can reduce Jobseeker's Allowance. Type the weekly rate from your letter. This page does not run the means test.",
    });
  }

  return {
    startingCash: cash,
    monthsRemaining: full.monthsRemaining,
    leanMonthsRemaining: lean.monthsRemaining,
    emptyWeek: full.emptyWeek,
    survivesHorizon: full.survivesHorizon,
    leanSurvivesHorizon: lean.survivesHorizon,
    monthlyExpenses,
    monthlyIncomeNow,
    netBurnNow: monthlyExpenses - monthlyIncomeNow,
    cashNeeded,
    cashGap,
    leanCashNeeded,
    targetMonths,
    byMonth,
    cutRank,
    warnings,
  };
}

export interface ExpensePreset {
  label: string;
  group: string;
  name: string;
  essential: boolean;
}

export const EXPENSE_PRESETS: ExpensePreset[] = [
  { label: "Rent", group: "Housing", name: "Rent", essential: true },
  { label: "Mortgage", group: "Housing", name: "Mortgage", essential: true },
  { label: "Groceries", group: "Food", name: "Groceries", essential: true },
  { label: "Energy", group: "Utilities", name: "Energy", essential: true },
  { label: "Broadband", group: "Utilities", name: "Broadband", essential: true },
  { label: "Car", group: "Transport", name: "Car / fuel", essential: true },
  { label: "Leap", group: "Transport", name: "Leap", essential: true },
  { label: "Car insurance", group: "Insurance", name: "Car insurance", essential: true },
  { label: "Childcare", group: "Childcare", name: "Childcare", essential: true },
];

export function jprbIncomeFromSalary(annualSalary: number, band: PrsiBand): Omit<IncomeItem, "id"> {
  return {
    kind: "jprb",
    name: "Jobseeker's Pay-Related Benefit",
    amount: Math.round(weeklyFromAnnualSalary(annualSalary) * 100) / 100,
    freq: "weekly",
    startWeek: 0,
    durationWeeks: jprbDurationWeeks(band),
  };
}

export function jaIncomeFromAge(age: number): Omit<IncomeItem, "id"> {
  return {
    kind: "ja",
    name: "Jobseeker's Allowance",
    amount: jaPersonalRate(age),
    freq: "weekly",
    startWeek: 0,
    durationWeeks: 0,
  };
}

export function jbIncomePreset(): Omit<IncomeItem, "id"> {
  return {
    kind: "jb",
    name: "Jobseeker's Benefit",
    amount: IE_JB_PERSONAL_MAX,
    freq: "weekly",
    startWeek: 0,
    durationWeeks: jbDurationWeeks(true),
  };
}

export function childBenefitIncomePreset(): Omit<IncomeItem, "id"> {
  return {
    kind: "child_benefit",
    name: "Child Benefit",
    amount: IE_CHILD_BENEFIT_MONTHLY,
    freq: "monthly",
    startWeek: 0,
    durationWeeks: 0,
  };
}

export function otherIncomePreset(): Omit<IncomeItem, "id"> {
  return {
    kind: "other",
    name: "Other income",
    amount: 0,
    freq: "monthly",
    startWeek: 0,
    durationWeeks: 0,
  };
}

export const DEFAULT_RUNWAY_STATE: RunwayState = {
  cash: 15000,
  useNetworthCash: false,
  prsiBand: "5plus",
  afterJprbJa: false,
  targetMonths: 6,
  horizonMonths: 36,
  expenseGroups: [...DEFAULT_EXPENSE_GROUPS],
  expenses: [
    { id: "expense-0", group: "Housing", name: "Rent", amount: 1400, freq: "monthly", essential: true },
    { id: "expense-1", group: "Food", name: "Groceries", amount: 400, freq: "monthly", essential: true },
    { id: "expense-2", group: "Food", name: "Eating out", amount: 80, freq: "monthly", essential: false },
    { id: "expense-3", group: "Transport", name: "Leap / fuel", amount: 120, freq: "monthly", essential: true },
    { id: "expense-4", group: "Utilities", name: "Energy", amount: 140, freq: "monthly", essential: true },
    { id: "expense-5", group: "Utilities", name: "Broadband", amount: 50, freq: "monthly", essential: true },
    { id: "expense-6", group: "Insurance", name: "Car insurance", amount: 70, freq: "monthly", essential: true },
    { id: "expense-7", group: "Debt", name: "Car loan", amount: 180, freq: "monthly", essential: true },
    { id: "expense-8", group: "Other", name: "Phone", amount: 30, freq: "monthly", essential: false },
  ],
  incomes: [],
};

export const DEFAULT_RUNWAY_SECTION = serializeRunwayState(DEFAULT_RUNWAY_STATE);

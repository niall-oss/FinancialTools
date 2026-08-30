import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chart } from "@/components/app/Chart";
import { ChartExplainer, FieldError, FieldGrid, FieldNote, HintLabel } from "@/components/app/FieldChrome";
import { CheckboxField } from "@/components/app/CheckboxField";
import { NumberField } from "@/components/app/NumberField";
import { SelectField } from "@/components/app/SelectField";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { chartTabsListClass, ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEur } from "@/core/format";
import { jprbHitsCap } from "@/core/irish-jobseeker-rules";
import { useConfigStore } from "@/hooks/use-config";
import { parseNetWorthSection, runNetWorth } from "@/tools/networth/engine";
import {
  addExpense,
  addGroup,
  addIncome,
  childBenefitIncomePreset,
  EXPENSE_PRESETS,
  jaIncomeFromAge,
  jbIncomePreset,
  jprbIncomeFromSalary,
  otherIncomePreset,
  parseRunwaySection,
  removeExpense,
  removeGroup,
  removeIncome,
  runRunway,
  sanitizeLabel,
  serializeRunwayState,
  toMonthly,
  updateExpense,
  updateIncome,
  type ExpenseFreq,
  type IncomeFreq,
  type RunwayState,
} from "@/tools/runway/engine";
import {
  AFTER_JA_HINT,
  CASH_HINT,
  CHART_FLOW_DETAIL,
  CHART_FLOW_SUMMARY,
  CHART_MIX_DETAIL,
  CHART_MIX_SUMMARY,
  CHART_RUNWAY_DETAIL,
  CHART_RUNWAY_SUMMARY,
  DISCLAIMER,
  ESSENTIAL_HINT,
  GROUP_HINT,
  INCOME_SCHEME_LINES,
  NETWORTH_CASH_HINT,
  PRSI_HINT,
  TARGET_HINT,
  jprbAmountHint,
  jprbCapError,
  jprbPayNote,
} from "@/tools/runway/hints";

const GROUP_TRIGGER_CLASS = "min-w-0 flex-1 py-2";
const TARGET_PRESETS = [3, 6, 9, 12] as const;
const FREQ_OPTIONS: { value: ExpenseFreq; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "annual", label: "Annual" },
];
const PRSI_OPTIONS = [
  { value: "5plus", label: "5+ years PRSI" },
  { value: "2to5", label: "2 to 5 years PRSI" },
];

function persist(config: ReturnType<typeof useConfigStore>, state: RunwayState): void {
  config.setSection("runway", serializeRunwayState(state));
}

function groupMonthly(state: RunwayState, group: string): number {
  return state.expenses
    .filter((item) => item.group === group)
    .reduce((sum, item) => sum + toMonthly(item.amount, item.freq), 0);
}

function networthCashTotal(config: ReturnType<typeof useConfigStore>): number {
  const result = runNetWorth(parseNetWorthSection(config.getSection("networth")));
  return result.assetByGroup.find((row) => row.group === "Cash")?.amount ?? 0;
}

function formatMonths(months: number, survives: boolean): string {
  if (survives) return `${Math.round(months)}+ mo`;
  return `${months.toFixed(1)} mo`;
}

function emptyLabel(months: number, survives: boolean): string {
  if (survives) return `After ${Math.round(months)} mo`;
  return `Month ${Math.max(1, Math.ceil(months))}`;
}

function AddGroupRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="mt-3 flex items-center gap-2">
      <Input
        value={name}
        placeholder="New group"
        aria-label="New group name"
        className="h-7 px-2.5 text-xs"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd(trimmed);
          setName("");
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => {
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd(trimmed);
          setName("");
        }}
      >
        Add group
      </Button>
    </div>
  );
}

function FreqSelect({
  value,
  onChange,
  label,
}: {
  value: ExpenseFreq | IncomeFreq;
  onChange: (value: ExpenseFreq) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ExpenseFreq)}>
      <SelectTrigger size="sm" aria-label={label} className="h-8 w-[5.75rem] shrink-0 px-2 font-mono text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {FREQ_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="font-mono text-sm">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RunwayTool() {
  const config = useConfigStore();
  const state = parseRunwaySection(config.getSection("runway"));
  const networthCash = networthCashTotal(config);
  const age = config.getNumber("profile", "age");
  const annualSalary = config.getNumber("profile", "annual_salary");
  const result = runRunway(state, { age, networthCash });
  const pendingFocusId = useRef<string | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>(["Housing", "Food"]);

  useEffect(() => {
    const id = pendingFocusId.current;
    if (!id) return;
    pendingFocusId.current = null;
    document.getElementById(id)?.focus();
  });

  const commit = (next: RunwayState): void => persist(config, next);

  const openGroup = (group: string): void => {
    setOpenGroups((current) => (current.includes(group) ? current : [...current, group]));
  };

  const onAddExpense = (group: string, name = "New item", essential = true): void => {
    const { state: next, id } = addExpense(state, { group, name, amount: 0, essential });
    pendingFocusId.current = `rw-exp-${id}`;
    openGroup(group);
    commit(next);
  };

  const onQuickExpense = (preset: (typeof EXPENSE_PRESETS)[number]): void => {
    onAddExpense(preset.group, preset.name, preset.essential);
  };

  const onAddGroup = (name: string): void => {
    const group = sanitizeLabel(name);
    if (!group) return;
    commit(addGroup(state, group));
    openGroup(group);
  };

  const onAddIncomePreset = (input: Parameters<typeof addIncome>[1], focus = true): void => {
    const { state: next, id } = addIncome(state, input);
    if (focus) pendingFocusId.current = `rw-inc-${id}`;
    commit(next);
  };

  const renderGroups = (): ReactNode => (
    <>
      {state.expenseGroups.map((group) => {
        const rows = state.expenses.filter((item) => item.group === group);
        return (
          <AccordionItem key={group} value={group}>
            <div className="flex w-full items-center gap-1">
              <AccordionTrigger className={GROUP_TRIGGER_CLASS}>
                <span className="min-w-0 flex-1 truncate text-left">{group}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatEur(groupMonthly(state, group))}
                </span>
              </AccordionTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label={`Delete ${group} group`}
                onClick={() => commit(removeGroup(state, group))}
              >
                <Trash2 />
              </Button>
            </div>
            <AccordionContent className="pt-1 pb-3">
              <div className="flex flex-col gap-2">
                {rows.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`${group} item name`}
                      value={item.name}
                      className="min-w-0 flex-1 px-2.5"
                      onChange={(event) => commit(updateExpense(state, item.id, { name: event.target.value }))}
                    />
                    <Input
                      id={`rw-exp-${item.id}`}
                      type="number"
                      step={10}
                      aria-label={`${item.name || "Item"} amount`}
                      value={Number.isFinite(item.amount) ? item.amount : ""}
                      className="min-w-0 w-20 shrink-0 px-2.5 font-mono text-sm tabular-nums sm:w-24"
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        commit(updateExpense(state, item.id, { amount: Number.isNaN(next) ? 0 : next }));
                      }}
                    />
                    <FreqSelect
                      value={item.freq}
                      label={`${item.name || "Item"} frequency`}
                      onChange={(freq) => commit(updateExpense(state, item.id, { freq }))}
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Checkbox
                        checked={item.essential}
                        aria-label={`${item.name || "Item"} essential`}
                        onCheckedChange={(value) =>
                          commit(updateExpense(state, item.id, { essential: value === true }))
                        }
                      />
                      Need
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label={`Remove ${item.name || "item"}`}
                      onClick={() => commit(removeExpense(state, item.id))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="mt-0.5 self-start"
                  onClick={() => onAddExpense(group)}
                >
                  <Plus />
                  Add item
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </>
  );

  const shortfall = result.cashGap > 0.5;
  const spare = result.cashGap < -0.5;
  const lineMonths = result.byMonth.filter((row, index) => {
    if (index < result.targetMonths) return true;
    const prev = result.byMonth[index - 1];
    return row.cash > 0 || row.leanCash > 0 || (prev !== undefined && (prev.cash > 0 || prev.leanCash > 0));
  });
  const flowLimit = Math.min(
    result.byMonth.length,
    Math.max(result.targetMonths, Math.min(18, Math.ceil(result.monthsRemaining) + 1)),
  );
  const flowMonths = result.byMonth.slice(0, flowLimit);
  const flowGroups = state.expenseGroups.filter((group) =>
    flowMonths.some((month) => (month.expenseByGroup[group] ?? 0) > 0.5),
  );
  const mixSlices = Object.entries(result.byMonth[0]?.expenseByGroup ?? {})
    .filter(([, value]) => value > 0.5)
    .map(([name, value]) => ({ name, value }));
  const cuts = result.cutRank.filter((row) => row.monthsGained > 0.05);

  return (
    <ToolLayout
      title="Emergency fund runway"
      inputs={
        <div className="flex flex-col gap-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Cash</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <FieldGrid>
                <NumberField
                  label="Starting cash (€)"
                  value={state.useNetworthCash ? result.startingCash : state.cash}
                  onChange={(value) => commit({ ...state, cash: value, useNetworthCash: false })}
                  step={100}
                  hint={CASH_HINT}
                />
                <NumberField
                  label="Target months"
                  value={state.targetMonths}
                  onChange={(value) => commit({ ...state, targetMonths: value })}
                  hint={TARGET_HINT}
                />
              </FieldGrid>
              <div className="flex flex-wrap gap-1">
                {TARGET_PRESETS.map((months) => (
                  <Button
                    key={months}
                    type="button"
                    size="xs"
                    variant={state.targetMonths === months ? "default" : "outline"}
                    onClick={() => commit({ ...state, targetMonths: months })}
                  >
                    {months} mo
                  </Button>
                ))}
              </div>
              <CheckboxField
                label="Use net worth Cash"
                checked={state.useNetworthCash}
                onChange={(value) => commit({ ...state, useNetworthCash: value })}
                hint={NETWORTH_CASH_HINT}
              />
              <FieldNote>Net worth Cash group is {formatEur(networthCash)}.</FieldNote>
            </CardContent>
          </Card>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Quick add</p>
            <div className="flex flex-wrap gap-1">
              {EXPENSE_PRESETS.map((preset) => (
                <Button key={preset.label} type="button" variant="outline" size="xs" onClick={() => onQuickExpense(preset)}>
                  {preset.label}
                </Button>
              ))}
            </div>
            <FieldNote className="mt-2">{GROUP_HINT}</FieldNote>
          </div>

          <Accordion type="multiple" defaultValue={["expenses"]} className="rounded-lg border border-border bg-card px-3">
            <AccordionItem value="expenses">
              <AccordionTrigger className={GROUP_TRIGGER_CLASS}>
                <span className="min-w-0 flex-1 truncate text-left">Expenses</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatEur(result.monthlyExpenses)}/mo
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <HintLabel hint={ESSENTIAL_HINT}>Need means you would still pay it</HintLabel>
                <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups}>
                  {renderGroups()}
                </Accordion>
                <AddGroupRow onAdd={onAddGroup} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Income</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1.5">
                {INCOME_SCHEME_LINES.map((line) => (
                  <FieldNote key={line.title}>
                    <span className="font-medium text-foreground">{line.title}</span> {line.body}
                  </FieldNote>
                ))}
              </div>
              <SelectField
                label="PRSI record for JPRB"
                value={state.prsiBand}
                options={PRSI_OPTIONS}
                onChange={(value) => commit({ ...state, prsiBand: value === "2to5" ? "2to5" : "5plus" })}
                hint={PRSI_HINT}
              />
              <CheckboxField
                label="JA after JPRB ends"
                checked={state.afterJprbJa}
                onChange={(value) => commit({ ...state, afterJprbJa: value })}
                hint={AFTER_JA_HINT}
              />
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onAddIncomePreset(jprbIncomeFromSalary(annualSalary, state.prsiBand))}
                >
                  Add JPRB from salary
                </Button>
                <Button type="button" variant="outline" size="xs" onClick={() => onAddIncomePreset(jaIncomeFromAge(age))}>
                  Add Jobseeker's Allowance
                </Button>
                <Button type="button" variant="outline" size="xs" onClick={() => onAddIncomePreset(jbIncomePreset())}>
                  Add Jobseeker's Benefit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onAddIncomePreset(childBenefitIncomePreset())}
                >
                  Add Child Benefit
                </Button>
                <Button type="button" variant="outline" size="xs" onClick={() => onAddIncomePreset(otherIncomePreset())}>
                  Add income
                </Button>
              </div>
              {state.incomes.length === 0 ? (
                <FieldNote>No income yet. Spend comes out of cash.</FieldNote>
              ) : (
                <div className="flex flex-col gap-2">
                  {state.incomes.map((item) => {
                    const jprbOverCap = item.kind === "jprb" && jprbHitsCap(item.amount, state.prsiBand);
                    const jprbError = item.kind === "jprb" ? jprbCapError(item.amount, state.prsiBand) : null;
                    return (
                    <div key={item.id} className="flex flex-col gap-1.5 rounded-md border border-border px-2 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          aria-label="Income name"
                          value={item.name}
                          className="min-w-0 flex-1 px-2.5"
                          onChange={(event) => commit(updateIncome(state, item.id, { name: event.target.value }))}
                        />
                        <Input
                          id={`rw-inc-${item.id}`}
                          type="number"
                          step={item.freq === "weekly" ? 1 : 10}
                          aria-invalid={jprbOverCap || undefined}
                          aria-label={`${item.name} amount`}
                          value={Number.isFinite(item.amount) ? item.amount : ""}
                          className="min-w-0 w-20 shrink-0 px-2.5 font-mono text-sm tabular-nums sm:w-28"
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            commit(updateIncome(state, item.id, { amount: Number.isNaN(next) ? 0 : next }));
                          }}
                        />
                        {item.kind === "jprb" ? (
                          <span className="text-xs text-muted-foreground">weekly earnings</span>
                        ) : (
                          <FreqSelect
                            value={item.freq}
                            label={`${item.name} frequency`}
                            onChange={(freq) => commit(updateIncome(state, item.id, { freq }))}
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => commit(removeIncome(state, item.id))}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      {item.kind === "jprb" ? (
                        <>
                          <FieldNote>{jprbAmountHint(state.prsiBand)}</FieldNote>
                          <FieldNote>{jprbPayNote(item.amount, state.prsiBand)}</FieldNote>
                          {jprbError ? <FieldError>{jprbError}</FieldError> : null}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            aria-label={`${item.name} duration in weeks`}
                            value={item.durationWeeks}
                            className="h-7 w-20 px-2 font-mono text-xs tabular-nums"
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              commit(
                                updateIncome(state, item.id, {
                                  durationWeeks: Number.isNaN(next) ? 0 : next,
                                }),
                              );
                            }}
                          />
                          <span className="text-xs text-muted-foreground">weeks, 0 means ongoing</span>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      }
      results={
        <ResultsPanel>
          <StatGrid>
            <StatCard
              label="Months left"
              value={formatMonths(result.monthsRemaining, result.survivesHorizon)}
              tone={!result.survivesHorizon && result.monthsRemaining < 3 ? "fail" : "default"}
            />
            <StatCard
              label={`Need for ${result.targetMonths} mo`}
              value={formatEur(result.cashNeeded)}
              hint={TARGET_HINT}
            />
            <StatCard
              label={shortfall ? "Shortfall" : spare ? "Spare" : "Enough"}
              value={formatEur(shortfall ? result.cashGap : spare ? -result.cashGap : 0)}
              tone={shortfall ? "fail" : "pass"}
            />
            <StatCard label="Net burn / mo" value={formatEur(result.netBurnNow)} />
          </StatGrid>
          <StatGrid>
            <StatCard label="Runs out" value={emptyLabel(result.monthsRemaining, result.survivesHorizon)} />
            <StatCard label="Spend / mo" value={formatEur(result.monthlyExpenses)} />
            <StatCard label="Income / mo" value={formatEur(result.monthlyIncomeNow)} />
            <StatCard
              label="Lean months"
              value={formatMonths(result.leanMonthsRemaining, result.leanSurvivesHorizon)}
              hint={ESSENTIAL_HINT}
            />
            <StatCard
              label={`Lean need for ${result.targetMonths} mo`}
              value={formatEur(result.leanCashNeeded)}
              hint={ESSENTIAL_HINT}
            />
            <StatCard label="Starting cash" value={formatEur(result.startingCash)} />
          </StatGrid>

          {result.warnings.map((warning) => {
            const fail = warning.tone === "fail";
            const text =
              warning.id === "target-short"
                ? `Need ${formatEur(result.cashNeeded)} to last ${result.targetMonths} months. You have ${formatEur(result.startingCash)}.`
                : warning.message;
            return (
              <Alert
                key={warning.id}
                variant={fail ? "destructive" : "default"}
                className={fail ? undefined : "border-warning/30 text-warning"}
              >
                <TriangleAlert />
                <AlertDescription className={fail ? undefined : "text-warning"}>{text}</AlertDescription>
              </Alert>
            );
          })}

          {cuts.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Drop this</th>
                    <th className="px-3 py-2 text-right font-medium">€ / mo</th>
                    <th className="px-3 py-2 text-right font-medium">Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {cuts.slice(0, 8).map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="px-3 py-1.5">
                        {row.name}
                        <span className="text-muted-foreground"> · {row.group}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{formatEur(row.amount)}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                        +{row.monthsGained.toFixed(1)} mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <Tabs defaultValue="runway">
            <TabsList className={chartTabsListClass}>
              <TabsTrigger value="runway">Runway</TabsTrigger>
              <TabsTrigger value="flow">Monthly flow</TabsTrigger>
              <TabsTrigger value="mix">Mix</TabsTrigger>
            </TabsList>
            <TabsContent value="runway" className="mt-2">
              <ChartExplainer summary={CHART_RUNWAY_SUMMARY} detail={CHART_RUNWAY_DETAIL} />
              {lineMonths.length > 0 ? (
                <Chart
                  type="line"
                  labels={lineMonths.map((row) => row.label)}
                  markCategory={`M${result.targetMonths}`}
                  series={[
                    { name: "Cash", data: lineMonths.map((row) => row.cash), area: true },
                    { name: "Essentials only", data: lineMonths.map((row) => row.leanCash) },
                    ...(result.cashNeeded > 0
                      ? [
                          {
                            name: "Target cash",
                            data: lineMonths.map((row) => row.sizedCash),
                            dashed: true,
                          },
                        ]
                      : []),
                  ]}
                />
              ) : (
                <FieldNote>Add a bill to draw the cash line.</FieldNote>
              )}
            </TabsContent>
            <TabsContent value="flow" className="mt-2">
              <ChartExplainer summary={CHART_FLOW_SUMMARY} detail={CHART_FLOW_DETAIL} />
              {flowGroups.length > 0 ? (
                <Chart
                  type="bar"
                  labels={flowMonths.map((row) => row.label)}
                  series={[
                    ...flowGroups.map((group) => ({
                      name: group,
                      data: flowMonths.map((row) => row.expenseByGroup[group] ?? 0),
                      stack: "expenses",
                    })),
                    { name: "Income", data: flowMonths.map((row) => row.income) },
                  ]}
                />
              ) : (
                <FieldNote>Add a bill to draw the month bars.</FieldNote>
              )}
            </TabsContent>
            <TabsContent value="mix" className="mt-2">
              <ChartExplainer summary={CHART_MIX_SUMMARY} detail={CHART_MIX_DETAIL} />
              {mixSlices.length > 0 ? (
                <Chart type="pie" slices={mixSlices} />
              ) : (
                <FieldNote>Add a bill to draw the pie.</FieldNote>
              )}
            </TabsContent>
          </Tabs>

          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}

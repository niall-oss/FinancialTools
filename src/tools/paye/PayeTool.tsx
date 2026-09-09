import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart } from "@/components/app/Chart";
import { ConfigCheckboxField } from "@/components/app/CheckboxField";
import { ChartExplainer, FieldGrid, FieldNote, HintLabel } from "@/components/app/FieldChrome";
import { ConfigNumberField } from "@/components/app/NumberField";
import { ConfigSelectField } from "@/components/app/SelectField";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { chartTabsListClass, ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import { formatEur, formatPct } from "@/core/format";
import { resolveTaxIe, type TaxStatus } from "@/core/irish-income-tax";
import { IE_PENSION_EARNINGS_CAP, maxRelievableContribution, pensionReliefPct } from "@/core/irish-pension-rules";
import { useConfigStore } from "@/hooks/use-config";
import { runPaye, type PayeBreakdown, type PayeInput } from "@/tools/paye/engine";
import {
  AGE_CREDIT_HINT,
  BIK_HEALTH_HINT,
  BIK_OTHER_HINT,
  CHART_COMPARE_DETAIL,
  CHART_COMPARE_SUMMARY,
  CHART_PAY_DETAIL,
  CHART_PAY_SUMMARY,
  COMPARE_AGE_HINT,
  COMPARE_HINT,
  COMPARE_PENSION_HINT,
  COMPARE_SALARY_HINT,
  CREDIT_OVERRIDE_HINT,
  DISCLAIMER,
  EMPLOYEE_CONTRIB_HINT,
  FLAT_RATE_HINT,
  HOME_CARER_HINT,
  INCAPACITATED_CHILD_HINT,
  MARGINAL_HINT,
  MEDICAL_CARD_HINT,
  OTHER_INCOME_HINT,
  PAYSLIP_CUMULATIVE_NOTE,
  RENT_HINT,
  TAKEHOME_HINT,
  TAX_STATUS_HINT,
  USE_PROFILE_HINT,
} from "@/tools/paye/hints";

const SECTION = "paye";

const TAX_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "spccc", label: "Single person child carer" },
  { value: "married_one", label: "Married, one income" },
  { value: "married_two", label: "Married, two incomes" },
];

const CONTRIB_MODE_OPTIONS = [
  { value: "pct", label: "Percentage (%)" },
  { value: "amount", label: "Euro amount (€)" },
];

function amountFromPct(salary: number, pct: number): number {
  return salary * (pct / 100);
}

function pctFromAmount(salary: number, amount: number): number {
  return salary > 0 ? (amount / salary) * 100 : 0;
}

type PensionKeys = { mode: string; pct: string; amount: string };

const CURRENT_PENSION_KEYS: PensionKeys = {
  mode: "employee_contrib_mode",
  pct: "employee_contrib_pct",
  amount: "employee_contrib_amount",
};

const COMPARE_PENSION_KEYS: PensionKeys = {
  mode: "compare_employee_contrib_mode",
  pct: "compare_employee_contrib_pct",
  amount: "compare_employee_pension",
};

function syncPension(
  config: ReturnType<typeof useConfigStore>,
  salary: number,
  keys: PensionKeys,
  anchor: "pct" | "amount",
): void {
  if (salary <= 0) return;
  if (anchor === "pct") {
    const pct = config.getNumber(SECTION, keys.pct);
    config.set(SECTION, keys.amount, amountFromPct(salary, pct));
  } else {
    const amount = config.getNumber(SECTION, keys.amount);
    config.set(SECTION, keys.pct, pctFromAmount(salary, amount));
  }
}

function pensionCash(
  config: ReturnType<typeof useConfigStore>,
  salary: number,
  keys: PensionKeys,
): number {
  const mode = config.getString(SECTION, keys.mode, "pct");
  if (mode === "amount") return config.getNumber(SECTION, keys.amount);
  return amountFromPct(salary, config.getNumber(SECTION, keys.pct));
}

function comparePensionCash(
  config: ReturnType<typeof useConfigStore>,
  salary: number,
  current: number,
): number {
  const mode = config.getString(SECTION, COMPARE_PENSION_KEYS.mode, "pct");
  if (mode === "amount") {
    const amount = config.getNumber(SECTION, COMPARE_PENSION_KEYS.amount);
    return amount > 0 ? amount : current;
  }
  const pct = config.getNumber(SECTION, COMPARE_PENSION_KEYS.pct);
  return pct > 0 ? amountFromPct(salary, pct) : current;
}

function readInput(config: ReturnType<typeof useConfigStore>): PayeInput {
  const useProfile = config.getBoolean(SECTION, "use_profile", true);
  const salary = useProfile
    ? config.getNumber("profile", "annual_salary")
    : config.getNumber(SECTION, "annual_salary");
  const age = useProfile ? config.getNumber("profile", "age") : config.getNumber(SECTION, "age");
  const employeePension = pensionCash(config, salary, CURRENT_PENSION_KEYS);

  return {
    age,
    salary,
    taxStatus: config.getString(SECTION, "tax_status", "single") as TaxStatus,
    otherIncome: config.getNumber(SECTION, "other_income"),
    employeePension,
    flatRateExpenses: config.getNumber(SECTION, "flat_rate_expenses"),
    bikHealth: config.getNumber(SECTION, "bik_health"),
    bikOther: config.getNumber(SECTION, "bik_other"),
    medicalCard: config.getBoolean(SECTION, "medical_card"),
    claimRent: config.getBoolean(SECTION, "claim_rent"),
    claimAgeCredit: config.getBoolean(SECTION, "claim_age_credit"),
    claimHomeCarer: config.getBoolean(SECTION, "claim_home_carer"),
    claimIncapacitatedChild: config.getBoolean(SECTION, "claim_incapacitated_child"),
    useCreditOverride: config.getBoolean(SECTION, "use_credit_override"),
    creditCertTotal: config.getNumber(SECTION, "credit_cert_total"),
    tax: resolveTaxIe(config),
  };
}

function PensionField({
  salary,
  age,
  hint,
  label = "Employee pension",
  keys = CURRENT_PENSION_KEYS,
  keepAmount,
}: {
  salary: number;
  age: number;
  hint: string;
  label?: string;
  keys?: PensionKeys;
  keepAmount?: number;
}) {
  const config = useConfigStore();
  const mode = config.getString(SECTION, keys.mode, "pct");
  const pct = config.getNumber(SECTION, keys.pct);
  const amount = config.getNumber(SECTION, keys.amount) || amountFromPct(salary, pct);
  const keep = keepAmount !== undefined;
  const entered = mode === "pct" ? pct : amount;
  const kept = keepAmount ?? 0;
  const paid = keep && entered <= 0 ? kept : mode === "pct" ? amountFromPct(salary, pct) : amount;
  const cap = maxRelievableContribution(salary, age);
  const bandPct = pensionReliefPct(age);
  const excess = Math.max(0, paid - cap);

  return (
    <div className="min-w-0">
      <HintLabel hint={hint}>{label}</HintLabel>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <Select
          value={mode}
          onValueChange={(value) => {
            config.set(SECTION, keys.mode, value);
            syncPension(config, salary, keys, value === "amount" ? "amount" : "pct");
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-full font-mono text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {CONTRIB_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="font-mono text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          step={mode === "pct" ? 0.1 : 100}
          className="font-mono text-sm tabular-nums"
          value={mode === "pct" ? pct : amount}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (mode === "pct") {
              config.set(SECTION, keys.pct, value);
              syncPension(config, salary, keys, "pct");
            } else {
              config.set(SECTION, keys.amount, value);
              syncPension(config, salary, keys, "amount");
            }
          }}
        />
      </div>
      <FieldNote className="mt-1">
        {keep && entered <= 0
          ? `0 keeps this payslip's pension (${formatEur(kept)}).`
          : mode === "pct"
            ? `= ${formatEur(amountFromPct(salary, pct))} / year.`
            : `= ${formatPct(pctFromAmount(salary, amount), 1)} of salary.`}
        {` Age ${age} cap is ${formatPct(bandPct, 0)} of salary, ${formatEur(cap)} this year`}
        {salary > IE_PENSION_EARNINGS_CAP ? ` on the first ${formatEur(IE_PENSION_EARNINGS_CAP)}.` : "."}
        {excess > 0.5 ? ` ${formatEur(excess)} gets no income-tax relief.` : ""}
      </FieldNote>
    </div>
  );
}

function BandTable({
  rows,
}: {
  rows: { from: number; to: number; ratePct: number; amount: number }[];
}) {
  if (rows.length === 0) {
    return <FieldNote>No charge at this income.</FieldNote>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Slice</th>
            <th className="px-3 py-2 font-medium">Rate</th>
            <th className="px-3 py-2 font-medium">Charge</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.from}-${row.ratePct}`} className="border-b border-border/60">
              <td className="px-3 py-1.5 font-mono tabular-nums">
                {formatEur(row.from)} to {formatEur(row.to)}
              </td>
              <td className="px-3 py-1.5 font-mono tabular-nums">{formatPct(row.ratePct, 1)}</td>
              <td className="px-3 py-1.5 font-mono tabular-nums">{formatEur(row.amount, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function paySlices(breakdown: PayeBreakdown): { name: string; value: number }[] {
  return [
    { name: "Take-home", value: Math.max(0, breakdown.takeHome) },
    { name: "Income tax", value: breakdown.incomeTax },
    { name: "USC", value: breakdown.usc },
    { name: "PRSI", value: breakdown.prsi },
    { name: "Pension", value: breakdown.employeePension },
  ].filter((slice) => slice.value > 0.5);
}

function pctDelta(
  before: number,
  after: number,
  higherIsBetter: boolean,
): { text: string; tone: "pass" | "fail" } | undefined {
  if (!Number.isFinite(before) || !Number.isFinite(after) || Math.abs(before) < 1e-6) return undefined;
  const pct = ((after - before) / Math.abs(before)) * 100;
  if (Math.abs(pct) < 0.05) return undefined;
  const up = pct > 0;
  return {
    text: `${up ? "+" : ""}${formatPct(pct, 1)}`,
    tone: (higherIsBetter ? up : !up) ? "pass" : "fail",
  };
}

function PayeStatGrid({
  breakdown,
  versus,
  showPensionExcess,
}: {
  breakdown: PayeBreakdown;
  versus?: PayeBreakdown;
  showPensionExcess: boolean;
}) {
  return (
    <StatGrid>
      <StatCard
        label="Take-home / month"
        value={formatEur(breakdown.monthlyTakeHome)}
        hint={TAKEHOME_HINT}
        delta={versus ? pctDelta(versus.monthlyTakeHome, breakdown.monthlyTakeHome, true) : undefined}
      />
      <StatCard
        label="Income tax / month"
        value={formatEur(breakdown.incomeTax / 12)}
        delta={versus ? pctDelta(versus.incomeTax / 12, breakdown.incomeTax / 12, false) : undefined}
      />
      <StatCard
        label="USC / month"
        value={formatEur(breakdown.usc / 12)}
        delta={versus ? pctDelta(versus.usc / 12, breakdown.usc / 12, false) : undefined}
      />
      <StatCard
        label="PRSI / month"
        value={formatEur(breakdown.prsi / 12)}
        delta={versus ? pctDelta(versus.prsi / 12, breakdown.prsi / 12, false) : undefined}
      />
      <StatCard
        label="Effective rate"
        value={formatPct(breakdown.effectiveRatePct, 1)}
        delta={versus ? pctDelta(versus.effectiveRatePct, breakdown.effectiveRatePct, false) : undefined}
      />
      <StatCard
        label="Marginal rate"
        value={formatPct(breakdown.marginalRatePct, 1)}
        hint={MARGINAL_HINT}
        delta={versus ? pctDelta(versus.marginalRatePct, breakdown.marginalRatePct, false) : undefined}
      />
      {showPensionExcess ? (
        <StatCard
          label="Pension without relief"
          value={formatEur(breakdown.pensionExcess)}
          delta={versus ? pctDelta(versus.pensionExcess, breakdown.pensionExcess, false) : undefined}
        />
      ) : null}
    </StatGrid>
  );
}

export function PayeTool() {
  const config = useConfigStore();
  const input = readInput(config);
  const taxStatus = input.taxStatus;
  const compareOn = config.getBoolean(SECTION, "compare_enabled");
  const compareSalaryRaw = config.getNumber(SECTION, "compare_salary");
  const extraHealth = config.getNumber(SECTION, "extra_bik_health");
  const extraOther = config.getNumber(SECTION, "extra_bik_other");
  const compareAgeRaw = config.getNumber(SECTION, "compare_age");
  const compareSalary = compareSalaryRaw > 0 ? compareSalaryRaw : input.salary;
  const compareAge = compareAgeRaw > 0 ? compareAgeRaw : input.age;
  const comparePension = comparePensionCash(config, compareSalary, input.employeePension);
  const result = runPaye(
    input,
    compareOn
      ? {
          salary: compareSalary,
          bikHealth: input.bikHealth + extraHealth,
          bikOther: input.bikOther + extraOther,
          employeePension: comparePension,
          age: compareAge,
        }
      : undefined,
  );
  const { current, compare } = result;
  const derivedTotal = current.creditsDerived;

  return (
    <ToolLayout
      title="PAYE take-home"
      inputs={
        <Accordion type="multiple" defaultValue={["you", "credits"]} className="rounded-lg border border-border bg-card px-3">
          <AccordionItem value="you">
            <AccordionTrigger>You</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <FieldGrid>
                  <ConfigCheckboxField
                    section={SECTION}
                    configKey="use_profile"
                    label="Use profile salary and age"
                    hint={USE_PROFILE_HINT}
                  />
                  {!config.getBoolean(SECTION, "use_profile", true) ? (
                    <>
                      <ConfigNumberField
                        section={SECTION}
                        configKey="annual_salary"
                        label="Gross salary (€)"
                        step={1000}
                      />
                      <ConfigNumberField section={SECTION} configKey="age" label="Age" />
                    </>
                  ) : (
                    <FieldNote className="col-span-full">
                      Profile: {formatEur(input.salary)} · age {input.age}
                    </FieldNote>
                  )}
                </FieldGrid>
                <FieldGrid>
                  <ConfigSelectField
                    section={SECTION}
                    configKey="tax_status"
                    label="Tax status"
                    options={TAX_STATUS_OPTIONS}
                    hint={TAX_STATUS_HINT}
                  />
                  {taxStatus === "married_two" ? (
                    <ConfigNumberField
                      section={SECTION}
                      configKey="other_income"
                      label="Other spouse income (€)"
                      step={1000}
                      hint={OTHER_INCOME_HINT}
                    />
                  ) : null}
                  <ConfigCheckboxField
                    section={SECTION}
                    configKey="medical_card"
                    label="Full medical card"
                    hint={MEDICAL_CARD_HINT}
                  />
                </FieldGrid>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="credits">
            <AccordionTrigger>Tax credits</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigCheckboxField
                  section={SECTION}
                  configKey="claim_rent"
                  label="I pay private rent"
                  hint={RENT_HINT}
                />
                <ConfigCheckboxField
                  section={SECTION}
                  configKey="claim_age_credit"
                  label="Age 65 or over"
                  hint={AGE_CREDIT_HINT}
                />
                {taxStatus === "married_one" ? (
                  <ConfigCheckboxField
                    section={SECTION}
                    configKey="claim_home_carer"
                    label="Home carer credit"
                    hint={HOME_CARER_HINT}
                  />
                ) : null}
                <ConfigCheckboxField
                  section={SECTION}
                  configKey="claim_incapacitated_child"
                  label="Incapacitated child"
                  hint={INCAPACITATED_CHILD_HINT}
                />
                <ConfigCheckboxField
                  section={SECTION}
                  configKey="use_credit_override"
                  label="Use tax-credit cert total"
                  hint={CREDIT_OVERRIDE_HINT}
                />
                {config.getBoolean(SECTION, "use_credit_override") ? (
                  <ConfigNumberField
                    section={SECTION}
                    configKey="credit_cert_total"
                    label="Cert total (€)"
                    step={50}
                    hint={CREDIT_OVERRIDE_HINT}
                  />
                ) : null}
              </FieldGrid>
              <FieldNote className="mt-2">
                Situation credits {formatEur(derivedTotal, 2)}. Personal and employee credits are
                filled from tax status. SPCCC adds €1,900 when that status is selected.
              </FieldNote>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="deductions">
            <AccordionTrigger>Payslip deductions</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <PensionField salary={input.salary} age={input.age} hint={EMPLOYEE_CONTRIB_HINT} />
                <ConfigNumberField
                  section={SECTION}
                  configKey="flat_rate_expenses"
                  label="Flat-rate expenses (€)"
                  step={50}
                  hint={FLAT_RATE_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="bik">
            <AccordionTrigger>Benefits in kind</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section={SECTION}
                  configKey="bik_health"
                  label="Employer health insurance (€)"
                  step={50}
                  hint={BIK_HEALTH_HINT}
                />
                <ConfigNumberField
                  section={SECTION}
                  configKey="bik_other"
                  label="Other BIK (€)"
                  step={50}
                  hint={BIK_OTHER_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="whatif">
            <AccordionTrigger>What if</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigCheckboxField
                  section={SECTION}
                  configKey="compare_enabled"
                  label="Compare a change"
                  hint={COMPARE_HINT}
                />
                {compareOn ? (
                  <>
                    <ConfigNumberField
                      section={SECTION}
                      configKey="compare_salary"
                      label="New salary (€)"
                      step={1000}
                      hint={COMPARE_SALARY_HINT}
                    />
                    <ConfigNumberField
                      section={SECTION}
                      configKey="extra_bik_health"
                      label="Extra health BIK (€)"
                      step={50}
                    />
                    <ConfigNumberField
                      section={SECTION}
                      configKey="extra_bik_other"
                      label="Extra other BIK (€)"
                      step={50}
                    />
                    <ConfigNumberField
                      section={SECTION}
                      configKey="compare_age"
                      label="New age"
                      step={1}
                      hint={COMPARE_AGE_HINT}
                    />
                    <PensionField
                      salary={compareSalary}
                      age={compareAge}
                      hint={COMPARE_PENSION_HINT}
                      label="New employee pension"
                      keys={COMPARE_PENSION_KEYS}
                      keepAmount={input.employeePension}
                    />
                    <FieldNote className="col-span-full">
                      This payslip is age {input.age}. 0 age keeps that.
                    </FieldNote>
                  </>
                ) : null}
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      }
      results={
        <ResultsPanel>
          {result.warnings.map((warning) => (
            <Alert key={warning} className="border-warning/30 text-warning">
              <TriangleAlert />
              <AlertDescription className="text-warning">{warning}</AlertDescription>
            </Alert>
          ))}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">This payslip</p>
            <FieldNote>{PAYSLIP_CUMULATIVE_NOTE}</FieldNote>
            <PayeStatGrid breakdown={current} showPensionExcess={current.pensionExcess > 0.5} />
          </div>

          {compare ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">What if</p>
              <PayeStatGrid
                breakdown={compare}
                versus={current}
                showPensionExcess={current.pensionExcess > 0.5 || compare.pensionExcess > 0.5}
              />
            </div>
          ) : null}

          <FieldNote>
            Annual take-home {formatEur(current.takeHome, 2)} from {formatEur(current.salary)} cash salary
            {current.bik > 0 ? ` plus ${formatEur(current.bik)} BIK.` : "."} Credits used{" "}
            {formatEur(current.creditsUsed, 2)} of {formatEur(current.creditsApplied, 2)}.
          </FieldNote>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Credit</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {current.creditLines.map((line) => (
                  <tr key={line.id} className="border-b border-border/60">
                    <td className="px-3 py-1.5">{line.label}</td>
                    <td className="px-3 py-1.5 font-mono tabular-nums">{formatEur(line.amount, 2)}</td>
                  </tr>
                ))}
                {current.creditLines.length === 0 ? (
                  <tr>
                    <td className="px-3 py-1.5" colSpan={2}>
                      No credits applied.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Tabs defaultValue="pay">
            <TabsList className={chartTabsListClass}>
              <TabsTrigger value="pay">Where it goes</TabsTrigger>
              <TabsTrigger value="income-tax">Income tax</TabsTrigger>
              <TabsTrigger value="usc">USC</TabsTrigger>
              {compare ? <TabsTrigger value="compare">What if</TabsTrigger> : null}
            </TabsList>
            <TabsContent value="pay" className="mt-2">
              <ChartExplainer summary={CHART_PAY_SUMMARY} detail={CHART_PAY_DETAIL} />
              <Chart type="pie" slices={paySlices(current)} />
            </TabsContent>
            <TabsContent value="income-tax" className="mt-2">
              <FieldNote className="mb-2">
                Gross income tax {formatEur(current.incomeTaxGross, 2)} on taxable pay{" "}
                {formatEur(current.taxableIncome)} (standard-rate cut-off {formatEur(current.standardBand)}).
                After credits, {formatEur(current.incomeTax, 2)}.
              </FieldNote>
              <BandTable
                rows={current.incomeTaxSlices.map((slice) => ({
                  from: slice.from,
                  to: slice.to,
                  ratePct: slice.ratePct,
                  amount: slice.tax,
                }))}
              />
            </TabsContent>
            <TabsContent value="usc" className="mt-2">
              <FieldNote className="mb-2">
                USC on {formatEur(current.payeIncome)}
                {current.uscReduced ? ", reduced rate." : "."} Pension does not reduce USC.
              </FieldNote>
              <BandTable
                rows={current.uscSlices.map((slice) => ({
                  from: slice.from,
                  to: slice.to,
                  ratePct: slice.ratePct,
                  amount: slice.amount,
                }))}
              />
            </TabsContent>
            {compare ? (
              <TabsContent value="compare" className="mt-2">
                <ChartExplainer summary={CHART_COMPARE_SUMMARY} detail={CHART_COMPARE_DETAIL} />
                <Chart
                  type="bar"
                  labels={["Current", "What if"]}
                  series={[
                    { name: "Take-home", data: [current.takeHome, compare.takeHome], stack: "pay" },
                    { name: "Income tax", data: [current.incomeTax, compare.incomeTax], stack: "pay" },
                    { name: "USC", data: [current.usc, compare.usc], stack: "pay" },
                    { name: "PRSI", data: [current.prsi, compare.prsi], stack: "pay" },
                    { name: "Pension", data: [current.employeePension, compare.employeePension], stack: "pay" },
                  ]}
                />
              </TabsContent>
            ) : null}
          </Tabs>

          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}

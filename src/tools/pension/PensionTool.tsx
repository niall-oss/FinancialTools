import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { FieldGrid, FieldNote, HintLabel } from "@/components/app/FieldChrome";
import { ConfigNumberField } from "@/components/app/NumberField";
import { ConfigSelectField } from "@/components/app/SelectField";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { chartTabsListClass, ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import { TAX_IE_KEYS } from "@/core/config/schema";
import { formatEur, formatPct } from "@/core/format";
import {
  resolveTaxIe,
  resolveTaxIeFromSection,
  standardRateBandForStatus,
  taxIeConfigValues,
  type TaxStatus,
} from "@/core/irish-income-tax";
import { useConfigStore } from "@/hooks/use-config";
import {
  runPensionPlan,
  type EmploymentType,
  type PensionInput,
  type SchemeType,
} from "@/tools/pension/engine";
import {
  AVC_HINT,
  BROUGHT_FORWARD_HINT,
  COMPARE_BANDS_HINT,
  CURRENT_FUND_HINT,
  DISCLAIMER,
  EMPLOYEE_CONTRIB_HINT,
  EMPLOYER_CONTRIB_HINT,
  EMPLOYMENT_HINT,
  EXTRA_PCT_HINT,
  FEE_HINT,
  OTHER_INCOME_HINT,
  PRSI_USC_NOTE,
  RETURN_HINT,
  SCHEME_HINT,
  SPORTSPERSON_HINT,
  TAX_STATUS_HINT,
  USE_PROFILE_HINT,
  YEARS_HINT,
} from "@/tools/pension/hints";

const EMPLOYMENT_OPTIONS = [
  { value: "paye", label: "PAYE employee" },
  { value: "self_employed", label: "Self-employed" },
];

const TAX_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "spccc", label: "Single person child carer" },
  { value: "married_one", label: "Married, one income" },
  { value: "married_two", label: "Married, two incomes" },
];

const SCHEME_OPTIONS = [
  { value: "occupational", label: "Occupational scheme" },
  { value: "prsa", label: "PRSA / PEPP" },
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

function syncContrib(
  config: ReturnType<typeof useConfigStore>,
  kind: "employee" | "employer",
  salary: number,
  anchor: "pct" | "amount",
): void {
  if (salary <= 0) return;
  if (anchor === "pct") {
    const pct = config.getNumber("pension", `${kind}_contrib_pct`);
    config.set("pension", `${kind}_contrib_amount`, amountFromPct(salary, pct));
  } else {
    const amount = config.getNumber("pension", `${kind}_contrib_amount`);
    config.set("pension", `${kind}_contrib_pct`, pctFromAmount(salary, amount));
  }
}

function readInput(config: ReturnType<typeof useConfigStore>): PensionInput {
  const useProfile = config.getBoolean("pension", "use_profile", true);
  const salary = useProfile
    ? config.getNumber("profile", "annual_salary")
    : config.getNumber("pension", "annual_salary");
  const age = useProfile ? config.getNumber("profile", "age") : config.getNumber("pension", "age");
  const employeeMode = config.getString("pension", "employee_contrib_mode", "pct");
  const employerMode = config.getString("pension", "employer_contrib_mode", "pct");
  const employeeAnnual =
    employeeMode === "amount"
      ? config.getNumber("pension", "employee_contrib_amount")
      : amountFromPct(salary, config.getNumber("pension", "employee_contrib_pct"));
  const employerAnnual =
    employerMode === "amount"
      ? config.getNumber("pension", "employer_contrib_amount")
      : amountFromPct(salary, config.getNumber("pension", "employer_contrib_pct"));
  const employmentType = config.getString("pension", "employment_type", "paye") as EmploymentType;
  const compareOn = config.getBoolean("pension", "compare_bands");

  return {
    age,
    relevantEarnings: salary,
    employmentType,
    taxStatus: config.getString("pension", "tax_status", "single") as TaxStatus,
    otherIncome: config.getNumber("pension", "other_income"),
    sportsperson: config.getBoolean("pension", "sportsperson"),
    schemeType: config.getString("pension", "scheme_type", "occupational") as SchemeType,
    employeeAnnual,
    employeePctOfEarnings: salary > 0 ? (employeeAnnual / salary) * 100 : 0,
    employerAnnual: employmentType === "self_employed" ? 0 : employerAnnual,
    avcAnnual: config.getNumber("pension", "existing_avc_annual"),
    broughtForwardUnrelieved: config.getNumber("pension", "brought_forward_unrelieved"),
    extraEmployeePct: config.getNumber("pension", "extra_employee_pct"),
    currentFund: config.getNumber("pension", "current_fund"),
    yearsToContribute: Math.max(0, config.getNumber("pension", "years_to_contribute", 1)),
    annualReturnPct: config.getNumber("pension", "annual_return_pct"),
    annualFeePct: config.getNumber("pension", "annual_fee_pct"),
    tax: resolveTaxIe(config),
    compareTax: compareOn ? resolveTaxIeFromSection(config, "pension", "compare_") : undefined,
  };
}

function ContribField({
  kind,
  salary,
  hint,
}: {
  kind: "employee" | "employer";
  salary: number;
  hint: string;
}) {
  const config = useConfigStore();
  const modeKey = `${kind}_contrib_mode`;
  const pctKey = `${kind}_contrib_pct`;
  const amountKey = `${kind}_contrib_amount`;
  const mode = config.getString("pension", modeKey, "pct");
  const pct = config.getNumber("pension", pctKey);
  const amount = config.getNumber("pension", amountKey) || amountFromPct(salary, pct);
  const label = kind === "employee" ? "Employee contribution" : "Employer contribution";

  return (
    <div className="min-w-0">
      <HintLabel hint={hint}>{label}</HintLabel>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <Select
          value={mode}
          onValueChange={(value) => {
            config.set("pension", modeKey, value);
            syncContrib(config, kind, salary, value === "amount" ? "amount" : "pct");
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
              config.set("pension", pctKey, value);
              syncContrib(config, kind, salary, "pct");
            } else {
              config.set("pension", amountKey, value);
              syncContrib(config, kind, salary, "amount");
            }
          }}
        />
      </div>
      <FieldNote className="mt-1">
        {mode === "pct"
          ? `= ${formatEur(amountFromPct(salary, pct))} / year`
          : `= ${formatPct(pctFromAmount(salary, amount), 1)} of earnings`}
      </FieldNote>
    </div>
  );
}

export function PensionTool() {
  const config = useConfigStore();
  const input = readInput(config);
  const result = runPensionPlan(input);
  const compareOn = config.getBoolean("pension", "compare_bands");
  const taxStatus = input.taxStatus;
  const currentCutOff = standardRateBandForStatus(input.tax, taxStatus, input.otherIncome);
  const proposedCutOff = input.compareTax
    ? standardRateBandForStatus(input.compareTax, taxStatus, input.otherIncome)
    : currentCutOff;

  const takeHomeGroups =
    compareOn && result.compare
      ? [
          { label: "None · now", breakdown: result.none.breakdown },
          { label: "None · new", breakdown: result.compare.none.breakdown },
          { label: "Plan · now", breakdown: result.plan.breakdown },
          { label: "Plan · new", breakdown: result.compare.plan.breakdown },
          { label: "Max · now", breakdown: result.maxed.breakdown },
          { label: "Max · new", breakdown: result.compare.maxed.breakdown },
        ]
      : [
          { label: "No pension", breakdown: result.none.breakdown },
          { label: "Your plan", breakdown: result.plan.breakdown },
          { label: "Max allowance", breakdown: result.maxed.breakdown },
        ];

  const projectionLabels = result.projection.map((point) => `Y${point.year}`);

  return (
    <ToolLayout
      title="Pension tax relief"
      inputs={
        <Accordion type="multiple" defaultValue={["you", "contrib", "compare"]} className="rounded-lg border border-border bg-card px-3">
          <AccordionItem value="you">
            <AccordionTrigger>You</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigCheckboxField
                  section="pension"
                  configKey="use_profile"
                  label="Use profile salary and age"
                  hint={USE_PROFILE_HINT}
                />
                {!config.getBoolean("pension", "use_profile", true) ? (
                  <>
                    <ConfigNumberField
                      section="pension"
                      configKey="annual_salary"
                      label="Relevant earnings (€)"
                      step={1000}
                    />
                    <ConfigNumberField section="pension" configKey="age" label="Age" />
                  </>
                ) : (
                  <FieldNote className="col-span-full">
                    Profile: {formatEur(input.relevantEarnings)} · age {input.age}
                  </FieldNote>
                )}
                <ConfigSelectField
                  section="pension"
                  configKey="employment_type"
                  label="Employment"
                  options={EMPLOYMENT_OPTIONS}
                  hint={EMPLOYMENT_HINT}
                />
                <ConfigSelectField
                  section="pension"
                  configKey="tax_status"
                  label="Tax status"
                  options={TAX_STATUS_OPTIONS}
                  hint={TAX_STATUS_HINT}
                />
                {taxStatus === "married_two" ? (
                  <ConfigNumberField
                    section="pension"
                    configKey="other_income"
                    label="Other spouse income (€)"
                    step={1000}
                    hint={OTHER_INCOME_HINT}
                  />
                ) : null}
                {input.employmentType === "paye" ? (
                  <ConfigSelectField
                    section="pension"
                    configKey="scheme_type"
                    label="Scheme"
                    options={SCHEME_OPTIONS}
                    hint={SCHEME_HINT}
                  />
                ) : null}
                <ConfigCheckboxField
                  section="pension"
                  configKey="sportsperson"
                  label="Sportsperson 30% rule"
                  hint={SPORTSPERSON_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contrib">
            <AccordionTrigger>Contributions</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ContribField kind="employee" salary={input.relevantEarnings} hint={EMPLOYEE_CONTRIB_HINT} />
                {input.employmentType === "paye" ? (
                  <ContribField kind="employer" salary={input.relevantEarnings} hint={EMPLOYER_CONTRIB_HINT} />
                ) : null}
                <ConfigNumberField
                  section="pension"
                  configKey="existing_avc_annual"
                  label="AVCs this year (€)"
                  step={100}
                  hint={AVC_HINT}
                />
                <ConfigNumberField
                  section="pension"
                  configKey="brought_forward_unrelieved"
                  label="Unrelieved brought forward (€)"
                  step={100}
                  hint={BROUGHT_FORWARD_HINT}
                />
                <ConfigNumberField
                  section="pension"
                  configKey="extra_employee_pct"
                  label="What-if extra employee (%)"
                  step={0.5}
                  hint={EXTRA_PCT_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compare">
            <AccordionTrigger>Compare bands</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigCheckboxField
                  section="pension"
                  configKey="compare_bands"
                  label="Compare a proposed band change"
                  hint={COMPARE_BANDS_HINT}
                />
              </FieldGrid>
              {compareOn ? (
                <>
                  <FieldNote className="mt-2">
                    Edit the what-if rates here. Irish tax bands on the home page stay as they are.
                  </FieldNote>
                  <div className="mt-2">
                    <FieldGrid>
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_standard_rate_pct"
                        label="Proposed standard rate (%)"
                      />
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_higher_rate_pct"
                        label="Proposed higher rate (%)"
                      />
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_band_single"
                        label="Proposed single band (€)"
                        step={100}
                      />
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_band_spccc"
                        label="Proposed SPCCC band (€)"
                        step={100}
                      />
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_band_married_one"
                        label="Proposed married one-income (€)"
                        step={100}
                      />
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_band_married_two_base"
                        label="Proposed married two-income base (€)"
                        step={100}
                      />
                      <ConfigNumberField
                        section="pension"
                        configKey="compare_band_married_two_max_increase"
                        label="Proposed married max extra (€)"
                        step={100}
                      />
                    </FieldGrid>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const values = taxIeConfigValues(resolveTaxIe(config));
                      for (const key of TAX_IE_KEYS) {
                        config.set("pension", `compare_${key}`, values[key]);
                      }
                    }}
                  >
                    Copy from tax bands
                  </Button>
                </>
              ) : null}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="projection">
            <AccordionTrigger>Projection</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section="pension"
                  configKey="current_fund"
                  label="Current fund (€)"
                  step={1000}
                  hint={CURRENT_FUND_HINT}
                />
                <ConfigNumberField
                  section="pension"
                  configKey="years_to_contribute"
                  label="Years to contribute"
                  hint={YEARS_HINT}
                />
                <ConfigNumberField
                  section="pension"
                  configKey="annual_return_pct"
                  label="Expected return (%)"
                  step={0.1}
                  hint={RETURN_HINT}
                />
                <ConfigNumberField
                  section="pension"
                  configKey="annual_fee_pct"
                  label="Annual fee (%)"
                  step={0.1}
                  hint={FEE_HINT}
                />
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

          {compareOn ? (
            <Alert>
              <AlertDescription>
                Proposed {taxStatus} cut-off {formatEur(proposedCutOff)} vs current {formatEur(currentCutOff)}.
                Tax saved on your plan {formatEur(result.compare?.plan.taxSaved ?? 0)} vs{" "}
                {formatEur(result.plan.taxSaved)} now.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">Limit</th>
                  <th className="px-3 py-2 font-medium">Max at your pay</th>
                </tr>
              </thead>
              <tbody>
                {result.ageBandRows.map((row) => (
                  <tr
                    key={row.label}
                    className={row.isCurrent ? "bg-primary/10" : "border-b border-border/60"}
                  >
                    <td className="px-3 py-1.5">
                      <span className="mr-2">{row.label}</span>
                      {row.isCurrent ? <Badge>You</Badge> : null}
                    </td>
                    <td className="px-3 py-1.5 font-mono tabular-nums">{formatPct(row.pct, 0)}</td>
                    <td className="px-3 py-1.5 font-mono tabular-nums">{formatEur(row.maxContribution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.nextBand && result.yearsUntilNextBand !== null ? (
            <FieldNote>
              Next band {result.nextBand.label} ({formatPct(result.nextBand.pct, 0)}) in{" "}
              {result.yearsUntilNextBand} year{result.yearsUntilNextBand === 1 ? "" : "s"} · max{" "}
              {formatEur(result.nextBand.maxContribution)} at this salary.
            </FieldNote>
          ) : null}

          <StatGrid>
            <StatCard label="Max allowance" value={formatEur(result.maxRelievable)} />
            <StatCard label="Your employee contrib" value={formatEur(result.employeeCash)} />
            <StatCard
              label="Unused headroom"
              value={formatEur(result.unusedHeadroom)}
              tone={result.excess > 0 ? "fail" : "default"}
            />
            <StatCard label="Tax saved this year" value={formatEur(result.plan.taxSaved)} />
            <StatCard label="Net cost to you" value={formatEur(result.plan.netCost)} />
            <StatCard label="Effective relief" value={formatPct(result.plan.effectiveReliefPct, 1)} />
            {compareOn && result.compare ? (
              <>
                <StatCard label="Tax saved (proposed)" value={formatEur(result.compare.plan.taxSaved)} />
                <StatCard label="Take-home (proposed)" value={formatEur(result.compare.plan.breakdown.takeHome)} />
                <StatCard
                  label="Effective relief (proposed)"
                  value={formatPct(result.compare.plan.effectiveReliefPct, 1)}
                />
              </>
            ) : null}
          </StatGrid>

          <FieldNote>{PRSI_USC_NOTE}</FieldNote>

          <Tabs defaultValue="takehome">
            <TabsList className={chartTabsListClass}>
              <TabsTrigger value="takehome">Take-home</TabsTrigger>
              <TabsTrigger value="increase">Increase</TabsTrigger>
              <TabsTrigger value="age">Age bands</TabsTrigger>
              <TabsTrigger value="projection">Projection</TabsTrigger>
              {compareOn ? <TabsTrigger value="bands">Band compare</TabsTrigger> : null}
            </TabsList>
            <TabsContent value="takehome" className="mt-2">
              <Chart
                type="bar"
                labels={takeHomeGroups.map((group) => group.label)}
                series={[
                  {
                    name: "Take-home",
                    data: takeHomeGroups.map((group) => group.breakdown.takeHome),
                    stack: "pay",
                  },
                  {
                    name: "Income tax",
                    data: takeHomeGroups.map((group) => group.breakdown.incomeTax),
                    stack: "pay",
                  },
                  {
                    name: "USC",
                    data: takeHomeGroups.map((group) => group.breakdown.usc),
                    stack: "pay",
                  },
                  {
                    name: "PRSI",
                    data: takeHomeGroups.map((group) => group.breakdown.prsi),
                    stack: "pay",
                  },
                  {
                    name: "Employee pension",
                    data: takeHomeGroups.map((group) => group.breakdown.employeePension),
                    stack: "pay",
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="increase" className="mt-2">
              <Chart
                type="line"
                labels={result.increaseSeries.map((point) => `${point.contribPct}%`)}
                series={[
                  { name: "Tax saved", data: result.increaseSeries.map((point) => point.taxSaved) },
                  { name: "Net cost", data: result.increaseSeries.map((point) => point.netCost) },
                  ...(compareOn
                    ? [
                        {
                          name: "Tax saved (proposed)",
                          data: result.increaseSeries.map((point) => point.taxSavedProposed ?? 0),
                        },
                      ]
                    : []),
                ]}
              />
              <FieldNote className="mt-2">
                Employee contribution as % of earnings, from 0% to this year&apos;s age cap (
                {formatPct(result.agePct, 0)}). The kink is where relief drops from the higher rate to the
                standard rate.
              </FieldNote>
            </TabsContent>
            <TabsContent value="age" className="mt-2">
              <Chart
                type="bar"
                labels={result.ageBandRows.map((row) => row.label)}
                series={[{ name: "Max relievable", data: result.ageBandRows.map((row) => row.maxContribution) }]}
              />
            </TabsContent>
            <TabsContent value="projection" className="mt-2">
              {result.projection.length > 0 ? (
                <Chart
                  type="line"
                  labels={projectionLabels}
                  series={[
                    { name: "Hold current €", data: result.projection.map((point) => point.holdEuro) },
                    { name: "Hold current %", data: result.projection.map((point) => point.holdPct) },
                    { name: "Always max", data: result.projection.map((point) => point.alwaysMax) },
                  ]}
                />
              ) : (
                <FieldNote>Set years to contribute to see a pot projection.</FieldNote>
              )}
              <FieldNote className="mt-2">
                Pension growth is tax-deferred (no 8-year deemed disposal). Always-max steps the employee %
                at 30, 40, 50, 55 and 60.
              </FieldNote>
            </TabsContent>
            {compareOn && result.compare ? (
              <TabsContent value="bands" className="mt-2">
                <Chart
                  type="bar"
                  labels={["Tax saved", "Income tax left", "Take-home"]}
                  series={[
                    {
                      name: "Current bands",
                      data: [
                        result.plan.taxSaved,
                        result.plan.breakdown.incomeTax,
                        result.plan.breakdown.takeHome,
                      ],
                    },
                    {
                      name: "Proposed bands",
                      data: [
                        result.compare.plan.taxSaved,
                        result.compare.plan.breakdown.incomeTax,
                        result.compare.plan.breakdown.takeHome,
                      ],
                    },
                  ]}
                />
              </TabsContent>
            ) : null}
          </Tabs>

          <FieldNote>
            {formatEur(result.monthlyEmployee)} employee / month · {formatEur(result.monthlyEmployer)} employer
            / month
            {Number.isFinite(result.employerBikHeadroom)
              ? ` · PRSA employer BIK headroom ${formatEur(result.employerBikHeadroom)}`
              : ""}
            {result.yearsUntilNextBand !== null ? ` · ${result.yearsUntilNextBand} years to next age band` : ""}
          </FieldNote>
          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}

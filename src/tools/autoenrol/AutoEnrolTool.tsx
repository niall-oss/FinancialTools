import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { FieldGrid, FieldNote, HintLabel } from "@/components/app/FieldChrome";
import { ConfigNumberField } from "@/components/app/NumberField";
import { ConfigSelectField, SelectField } from "@/components/app/SelectField";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { chartTabsListClass, ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import { formatEur, formatNumber, formatPct } from "@/core/format";
import { resolveTaxIe, type TaxStatus } from "@/core/irish-income-tax";
import {
  exemptionFloorContributions,
  IE_STATE_PENSION_AGE,
  matchAeRates,
  type AeEligibilityKind,
  type AeEmploymentType,
} from "@/core/irish-auto-enrolment";
import { useConfigStore } from "@/hooks/use-config";
import {
  runAutoEnrolPlan,
  type ComparePreset,
  type Participation,
  type AutoEnrolInput,
} from "@/tools/autoenrol/engine";
import type { SchemeType } from "@/tools/pension/engine";
import {
  ADMIN_FEE_HINT,
  AE_FEE_HINT,
  ALT_FEE_HINT,
  COMPARE_PRESET_HINT,
  COMPARE_SCHEME_HINT,
  CURRENT_FUND_HINT,
  DISCLAIMER,
  EMPLOYEE_CONTRIB_HINT,
  EMPLOYER_CONTRIB_HINT,
  EMPLOYMENT_HINT,
  ENROLMENT_YEAR_HINT,
  OTHER_INCOME_HINT,
  PARTICIPATION_HINT,
  PAYROLL_PENSION_HINT,
  RETURN_HINT,
  TAX_STATUS_HINT,
  USE_PROFILE_HINT,
  YEARS_HINT,
} from "@/tools/autoenrol/hints";

const SECTION = "autoenrol";

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

const PARTICIPATION_OPTIONS = [
  { value: "stay", label: "Stay enrolled" },
  { value: "opt_out", label: "Opt out at first window" },
  { value: "suspend", label: "Suspend for 2 years" },
];

const SCHEME_OPTIONS = [
  { value: "occupational", label: "Occupational scheme" },
  { value: "prsa", label: "PRSA / PEPP" },
];

const PRESET_OPTIONS = [
  { value: "match_ae", label: "Match AE rates" },
  { value: "exemption_floor", label: "Exemption floor" },
  { value: "custom", label: "Custom rates" },
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
    const pct = config.getNumber(SECTION, `${kind}_contrib_pct`);
    config.set(SECTION, `${kind}_contrib_amount`, amountFromPct(salary, pct));
  } else {
    const amount = config.getNumber(SECTION, `${kind}_contrib_amount`);
    config.set(SECTION, `${kind}_contrib_pct`, pctFromAmount(salary, amount));
  }
}

function resolvedAlt(
  preset: ComparePreset,
  salary: number,
  year: number,
  config: ReturnType<typeof useConfigStore>,
): { employee: number; employer: number } {
  if (preset === "exemption_floor") return exemptionFloorContributions(salary);
  if (preset === "match_ae") {
    const match = matchAeRates(salary, year);
    return { employee: match.employee, employer: match.employer };
  }
  const employeeMode = config.getString(SECTION, "employee_contrib_mode", "pct");
  const employerMode = config.getString(SECTION, "employer_contrib_mode", "pct");
  const employee =
    employeeMode === "amount"
      ? config.getNumber(SECTION, "employee_contrib_amount")
      : amountFromPct(salary, config.getNumber(SECTION, "employee_contrib_pct"));
  const employer =
    employerMode === "amount"
      ? config.getNumber(SECTION, "employer_contrib_amount")
      : amountFromPct(salary, config.getNumber(SECTION, "employer_contrib_pct"));
  return { employee, employer };
}

function readInput(config: ReturnType<typeof useConfigStore>): AutoEnrolInput {
  const useProfile = config.getBoolean(SECTION, "use_profile", true);
  const salary = useProfile
    ? config.getNumber("profile", "annual_salary")
    : config.getNumber(SECTION, "annual_salary");
  const age = useProfile ? config.getNumber("profile", "age") : config.getNumber(SECTION, "age");
  const employmentType = config.getString(SECTION, "employment_type", "paye") as AeEmploymentType;
  const enrolmentYear = Math.floor(config.getNumber(SECTION, "enrolment_year", 2026));
  const preset = config.getString(SECTION, "compare_preset", "match_ae") as ComparePreset;
  const alt = resolvedAlt(preset, salary, enrolmentYear, config);
  const employerAnnual = employmentType === "self_employed" ? 0 : alt.employer;

  return {
    age,
    salary,
    employmentType,
    taxStatus: config.getString(SECTION, "tax_status", "single") as TaxStatus,
    otherIncome: config.getNumber(SECTION, "other_income"),
    enrolmentYear,
    participation: config.getString(SECTION, "participation", "stay") as Participation,
    hasPayrollPension: config.getBoolean(SECTION, "has_payroll_pension"),
    compareScheme: config.getString(SECTION, "compare_scheme", "occupational") as SchemeType,
    comparePreset: preset,
    altEmployeeAnnual: alt.employee,
    altEmployeePct: salary > 0 ? (alt.employee / salary) * 100 : 0,
    altEmployerAnnual: employerAnnual,
    currentFund: config.getNumber(SECTION, "current_fund"),
    yearsToContribute: Math.max(0, config.getNumber(SECTION, "years_to_contribute", 1)),
    annualReturnPct: config.getNumber(SECTION, "annual_return_pct"),
    aeAnnualFeePct: config.getNumber(SECTION, "ae_annual_fee_pct"),
    altAnnualFeePct: config.getNumber(SECTION, "alt_annual_fee_pct"),
    adminFeeWeekly: config.getNumber(SECTION, "admin_fee_weekly", 0.55),
    tax: resolveTaxIe(config),
  };
}

function eligibilityCopy(kind: AeEligibilityKind): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (kind) {
    case "auto_enrolled":
      return { label: "Auto-enrolled", variant: "default" };
    case "opt_in":
      return { label: "Opt-in only", variant: "secondary" };
    case "exempt":
      return { label: "Exempt employment", variant: "outline" };
    default:
      return { label: "Not eligible", variant: "destructive" };
  }
}

function schemeLabel(scheme: SchemeType): string {
  return scheme === "prsa" ? "PRSA" : "Occupational";
}

function ratioLabel(value: number): string {
  return value > 0 ? `${formatNumber(value, 2)}×` : "—";
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
  const mode = config.getString(SECTION, modeKey, "pct");
  const pct = config.getNumber(SECTION, pctKey);
  const amount = config.getNumber(SECTION, amountKey) || amountFromPct(salary, pct);
  const label = kind === "employee" ? "Employee contribution" : "Employer contribution";

  return (
    <div className="min-w-0">
      <HintLabel hint={hint}>{label}</HintLabel>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <Select
          value={mode}
          onValueChange={(value) => {
            config.set(SECTION, modeKey, value);
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
              config.set(SECTION, pctKey, value);
              syncContrib(config, kind, salary, "pct");
            } else {
              config.set(SECTION, amountKey, value);
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

export function AutoEnrolTool() {
  const config = useConfigStore();
  const input = readInput(config);
  const result = runAutoEnrolPlan(input);
  const badge = eligibilityCopy(result.eligibility);
  const altName = schemeLabel(input.compareScheme);
  const preset = input.comparePreset;
  const takeHomeGroups = [
    { label: "No pension", breakdown: result.none },
    { label: "My Future Fund", breakdown: result.ae.breakdown },
    { label: altName, breakdown: result.alt.breakdown },
  ];

  return (
    <ToolLayout
      title="My Future Fund"
      inputs={
        <Accordion type="multiple" defaultValue={["you", "enrolment", "compare"]} className="rounded-lg border border-border bg-card px-3">
          <AccordionItem value="you">
            <AccordionTrigger>You</AccordionTrigger>
            <AccordionContent>
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
                      label="Gross pay (€)"
                      step={1000}
                    />
                    <ConfigNumberField section={SECTION} configKey="age" label="Age" />
                  </>
                ) : (
                  <FieldNote className="col-span-full">
                    Profile: {formatEur(input.salary)} · age {input.age}
                  </FieldNote>
                )}
                <ConfigSelectField
                  section={SECTION}
                  configKey="employment_type"
                  label="Employment"
                  options={EMPLOYMENT_OPTIONS}
                  hint={EMPLOYMENT_HINT}
                />
                <ConfigSelectField
                  section={SECTION}
                  configKey="tax_status"
                  label="Tax status"
                  options={TAX_STATUS_OPTIONS}
                  hint={TAX_STATUS_HINT}
                />
                {input.taxStatus === "married_two" ? (
                  <ConfigNumberField
                    section={SECTION}
                    configKey="other_income"
                    label="Other spouse income (€)"
                    step={1000}
                    hint={OTHER_INCOME_HINT}
                  />
                ) : null}
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="enrolment">
            <AccordionTrigger>Enrolment</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section={SECTION}
                  configKey="enrolment_year"
                  label="This calendar year"
                  hint={ENROLMENT_YEAR_HINT}
                />
                <ConfigSelectField
                  section={SECTION}
                  configKey="participation"
                  label="Participation"
                  options={PARTICIPATION_OPTIONS}
                  hint={PARTICIPATION_HINT}
                />
                <ConfigCheckboxField
                  section={SECTION}
                  configKey="has_payroll_pension"
                  label="Already in a payroll pension"
                  hint={PAYROLL_PENSION_HINT}
                />
              </FieldGrid>
              <FieldNote className="mt-2">
                AE rates are fixed: {formatPct(result.ae.employeePct, 1)} employee /{" "}
                {formatPct(result.ae.employerPct, 1)} employer / {formatPct(result.ae.statePct, 1)} State
                on pay up to {formatEur(result.ae.assessable || input.salary)}. You cannot pay a different rate.
              </FieldNote>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compare">
            <AccordionTrigger>Compare with</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigSelectField
                  section={SECTION}
                  configKey="compare_scheme"
                  label="Alternative"
                  options={SCHEME_OPTIONS}
                  hint={COMPARE_SCHEME_HINT}
                />
                <SelectField
                  label="Rate preset"
                  value={preset}
                  options={PRESET_OPTIONS}
                  hint={COMPARE_PRESET_HINT}
                  onChange={(value) => {
                    if (value === "custom") {
                      config.set(SECTION, "employee_contrib_amount", input.altEmployeeAnnual);
                      config.set(SECTION, "employee_contrib_pct", input.altEmployeePct);
                      config.set(SECTION, "employer_contrib_amount", input.altEmployerAnnual);
                      config.set(
                        SECTION,
                        "employer_contrib_pct",
                        input.salary > 0 ? (input.altEmployerAnnual / input.salary) * 100 : 0,
                      );
                    }
                    config.set(SECTION, "compare_preset", value);
                  }}
                />
                {preset === "custom" ? (
                  <>
                    <ContribField kind="employee" salary={input.salary} hint={EMPLOYEE_CONTRIB_HINT} />
                    {input.employmentType === "paye" ? (
                      <ContribField kind="employer" salary={input.salary} hint={EMPLOYER_CONTRIB_HINT} />
                    ) : null}
                  </>
                ) : (
                  <FieldNote className="col-span-full">
                    {altName}: {formatPct(input.altEmployeePct, 1)} employee (
                    {formatEur(input.altEmployeeAnnual)}) ·{" "}
                    {formatPct(input.salary > 0 ? (input.altEmployerAnnual / input.salary) * 100 : 0, 1)}{" "}
                    employer ({formatEur(input.altEmployerAnnual)})
                    {result.alt.meetsExemption ? " · meets exemption floors" : " · below exemption floors"}
                  </FieldNote>
                )}
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="projection">
            <AccordionTrigger>Projection</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section={SECTION}
                  configKey="current_fund"
                  label="Current fund (€)"
                  step={1000}
                  hint={CURRENT_FUND_HINT}
                />
                <ConfigNumberField
                  section={SECTION}
                  configKey="years_to_contribute"
                  label="Years to contribute"
                  hint={YEARS_HINT}
                />
                <ConfigNumberField
                  section={SECTION}
                  configKey="annual_return_pct"
                  label="Expected return (%)"
                  step={0.1}
                  hint={RETURN_HINT}
                />
                <ConfigNumberField
                  section={SECTION}
                  configKey="ae_annual_fee_pct"
                  label="AE investment fee (%)"
                  step={0.01}
                  hint={AE_FEE_HINT}
                />
                <ConfigNumberField
                  section={SECTION}
                  configKey="alt_annual_fee_pct"
                  label={`${altName} fee (%)`}
                  step={0.1}
                  hint={ALT_FEE_HINT}
                />
                <ConfigNumberField
                  section={SECTION}
                  configKey="admin_fee_weekly"
                  label="AE admin fee (€ / week)"
                  step={0.01}
                  hint={ADMIN_FEE_HINT}
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

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <FieldNote>
              {formatPct(result.ae.employeePct, 1)} / {formatPct(result.ae.employerPct, 1)} /{" "}
              {formatPct(result.ae.statePct, 1)} this year · assessable {formatEur(result.ae.assessable)}
            </FieldNote>
          </div>

          <StatGrid>
            <StatCard
              label="AE into pot"
              value={formatEur(result.ae.totalIntoPot)}
              tone={result.aePutsMoreInPot ? "pass" : "default"}
            />
            <StatCard
              label={`${altName} into pot`}
              value={formatEur(result.alt.totalIntoPot)}
              tone={!result.aePutsMoreInPot ? "pass" : "default"}
            />
            <StatCard
              label="AE net cost"
              value={formatEur(result.ae.netCost)}
              tone={!result.altCostsLessTakeHome ? "pass" : "default"}
            />
            <StatCard
              label={`${altName} net cost`}
              value={formatEur(result.alt.netCost)}
              tone={result.altCostsLessTakeHome ? "pass" : "default"}
            />
            <StatCard label="AE pot per € net" value={ratioLabel(result.ae.potPerNetCost)} />
            <StatCard label={`${altName} pot per € net`} value={ratioLabel(result.alt.potPerNetCost)} />
            <StatCard label="AE employee" value={formatEur(result.ae.employee)} />
            <StatCard label="AE employer" value={formatEur(result.ae.employer)} />
            <StatCard label="AE State top-up" value={formatEur(result.ae.state)} />
            <StatCard label="AE admin fee" value={formatEur(result.ae.adminFee, 2)} />
            <StatCard label="Tax saved (AE)" value={formatEur(result.ae.taxSaved)} />
            <StatCard label={`Tax saved (${altName})`} value={formatEur(result.alt.taxSaved)} />
          </StatGrid>

          <FieldNote>
            {result.aePutsMoreInPot
              ? "My Future Fund puts more into the pot this year (State top-up plus the match)."
              : `${altName} puts more into the pot this year.`}{" "}
            {result.altCostsLessTakeHome
              ? `${altName} costs less take-home because of income-tax relief.`
              : "AE and the alternative have a similar take-home hit, or AE is cheaper because you cannot get relief."}
          </FieldNote>

          <Tabs defaultValue="takehome">
            <TabsList className={chartTabsListClass}>
              <TabsTrigger value="takehome">Take-home</TabsTrigger>
              <TabsTrigger value="year">This year</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="projection">Projection</TabsTrigger>
              <TabsTrigger value="wins">Who wins</TabsTrigger>
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
                    name: "Employee contribution",
                    data: takeHomeGroups.map((group) => group.breakdown.employeePension),
                    stack: "pay",
                  },
                ]}
              />
              <FieldNote className="mt-2">
                AE is taken from net pay, so the income-tax slice does not shrink. Occupational/PRSA
                contributions reduce income tax only, not USC or PRSI.
              </FieldNote>
            </TabsContent>
            <TabsContent value="year" className="mt-2">
              <Chart
                type="bar"
                labels={["Net cost", "Employee", "Employer", "State", "Into pot"]}
                series={[
                  {
                    name: "My Future Fund",
                    data: [
                      result.ae.netCost,
                      result.ae.employee,
                      result.ae.employer,
                      result.ae.state,
                      result.ae.totalIntoPot,
                    ],
                  },
                  {
                    name: altName,
                    data: [
                      result.alt.netCost,
                      result.alt.employee,
                      result.alt.employer,
                      0,
                      result.alt.totalIntoPot,
                    ],
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="schedule" className="mt-2">
              <Chart
                type="bar"
                labels={result.phaseSchedule.map((row) => row.label)}
                series={[
                  {
                    name: "Employee",
                    data: result.phaseSchedule.map((row) => row.employee),
                    stack: "ae",
                  },
                  {
                    name: "Employer",
                    data: result.phaseSchedule.map((row) => row.employer),
                    stack: "ae",
                  },
                  {
                    name: "State",
                    data: result.phaseSchedule.map((row) => row.state),
                    stack: "ae",
                  },
                ]}
              />
              <FieldNote className="mt-2">
                Phases follow the scheme calendar on this salary, capped at €80,000. From 2035 the total is
                14% of assessable pay.
              </FieldNote>
            </TabsContent>
            <TabsContent value="projection" className="mt-2">
              {result.projection.length > 0 ? (
                <Chart
                  type="line"
                  labels={result.projection.map((point) => String(point.calendarYear))}
                  series={[
                    { name: "My Future Fund", data: result.projection.map((point) => point.aeBalance) },
                    { name: altName, data: result.projection.map((point) => point.altBalance) },
                  ]}
                />
              ) : (
                <FieldNote>Set years to contribute to see a pot projection.</FieldNote>
              )}
              <FieldNote className="mt-2">
                Same expected return. AE uses the calendar rate steps, the €80,000 cap, 55c weekly admin
                while contributing, and the AE investment fee. {altName} uses your chosen rates and fee.
                Opt-out and suspend only change the AE line.
              </FieldNote>
            </TabsContent>
            <TabsContent value="wins" className="mt-2">
              <Chart
                type="line"
                labels={result.salarySweep.map((point) => `${Math.round(point.salary / 1000)}k`)}
                series={[
                  {
                    name: "My Future Fund",
                    data: result.salarySweep.map((point) => point.aePotPerNet),
                  },
                  {
                    name: altName,
                    data: result.salarySweep.map((point) => point.altPotPerNet),
                  },
                ]}
              />
              <FieldNote className="mt-2">
                Euros into the pot this year per euro of take-home cost, across salary. The occupational/PRSA
                line usually jumps at the standard-rate band. The AE line flattens once pay is above €80,000.
              </FieldNote>
            </TabsContent>
          </Tabs>

          <FieldNote>
            AE is accessed at State Pension age {IE_STATE_PENSION_AGE}. Occupational schemes can often pay
            from 50, PRSAs from 60. You cannot pay extra into My Future Fund.
          </FieldNote>
          <FieldNote>
            Both pots count toward the €2.2m Standard Fund Threshold. 25% tax-free lump sum on drawdown, rest
            taxed as income.
          </FieldNote>
          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}

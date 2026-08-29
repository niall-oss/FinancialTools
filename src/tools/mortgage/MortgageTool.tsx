import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ChartExplainer, FieldError, FieldGrid, FieldNote, HintLabel } from "@/components/app/FieldChrome";
import { ConfigNumberField, NumberField } from "@/components/app/NumberField";
import { ConfigSelectField } from "@/components/app/SelectField";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { chartTabsListClass, ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import type { BerRating } from "@/core/irish-green-mortgage";
import type { BuyerType } from "@/core/irish-mortgage-rules";
import { formatEur, formatPct } from "@/core/format";
import { useConfigStore } from "@/hooks/use-config";
import { aggregateAnnualTotals } from "@/tools/mortgage/amortization";
import { runMortgagePlan, type MortgageInput, type PropertyType } from "@/tools/mortgage/engine";
import {
  addRatePeriod,
  canAddRatePeriod,
  normalizeRateSchedule,
  parseRateSchedule,
  removeRatePeriod,
  serializeRateSchedule,
  updateRatePeriod,
  type RateKind,
  type RatePeriod,
} from "@/tools/mortgage/rate-schedule";
import {
  BER_RATING_HINT,
  BRIDGING_LOAN_HINT,
  BUYER_TYPE_HINT,
  CHART_AMORTIZATION_DETAIL,
  CHART_AMORTIZATION_SUMMARY,
  CHART_BALANCE_DETAIL,
  CHART_BALANCE_SUMMARY,
  CHART_INTEREST_DETAIL,
  CHART_INTEREST_SUMMARY,
  CHART_PAYDOWN_DETAIL,
  CHART_PAYDOWN_SUMMARY,
  CHART_PRINCIPAL_DETAIL,
  CHART_PRINCIPAL_SUMMARY,
  CHART_UPFRONT_DETAIL,
  CHART_UPFRONT_SUMMARY,
  DEPOSIT_PCT_HINT,
  DISCLAIMER,
  FHS_EQUITY_HINT,
  FHS_EQUITY_STAT_HINT,
  FHS_HINT,
  GREEN_DISCOUNT_OVERRIDE_HINT,
  GREEN_MORTGAGE_HINT,
  HOME_INSURANCE_HINT,
  HTB_APPLIED_HINT,
  HTB_HINT,
  HTB_REFUND_HINT,
  INTEREST_RATE_HINT,
  LPT_ADJUSTMENT_HINT,
  LPT_ANNUAL_HINT,
  MONTHLY_COMMITMENTS_HINT,
  MORTGAGE_PROTECTION_HINT,
  MPE_HINT,
  OVERPAYMENT_HINT,
  OVERPAYMENT_LUMP_SUM_START_HINT,
  OVERPAYMENT_MONTHLY_START_HINT,
  PROPERTY_TYPE_HINT,
  RATE_SCHEDULE_HINT,
  SECOND_SALARY_HINT,
  SOLICITOR_FEE_HINT,
  STRESS_TEST_HINT,
  SURVEY_FEE_HINT,
  TERM_YEARS_HINT,
  USE_PROFILE_SALARY_HINT,
  VALUATION_FEE_HINT,
} from "@/tools/mortgage/hints";
import {
  depositAmountFromPct,
  depositPctFromAmount,
  getInvalidMortgageFields,
  getMortgageFieldErrorMessage,
  getMortgageFieldErrors,
} from "@/tools/mortgage/validation";

const BUYER_OPTIONS = [
  { value: "ftb", label: "First-time buyer" },
  { value: "ssb", label: "Second / subsequent" },
  { value: "btl", label: "Buy-to-let" },
];

const PROPERTY_OPTIONS = [
  { value: "new_build", label: "New build / self-build" },
  { value: "second_hand", label: "Second-hand" },
];

const BER_OPTIONS: { value: BerRating; label: string }[] = [
  { value: "A0", label: "A0 (best)" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G (worst)" },
];

const DEPOSIT_MODE_OPTIONS = [
  { value: "pct", label: "Percentage (%)" },
  { value: "amount", label: "Euro amount (€)" },
];

function readInput(config: ReturnType<typeof useConfigStore>): MortgageInput {
  const useProfileSalary = config.getBoolean("mortgage", "use_profile_salary", true);
  const profileSalary = config.getNumber("profile", "annual_salary");
  const secondSalary = config.getNumber("mortgage", "second_applicant_salary");
  const overridePct = config.getNumber("mortgage", "green_discount_override_pct", -1);

  return {
    buyerType: config.getString("mortgage", "buyer_type", "ftb") as BuyerType,
    propertyType: config.getString("mortgage", "property_type", "new_build") as PropertyType,
    propertyPrice: config.getNumber("mortgage", "property_price"),
    depositPct: config.getNumber("mortgage", "deposit_pct"),
    interestRatePct: config.getNumber("mortgage", "interest_rate_pct"),
    termYears: config.getNumber("mortgage", "term_years"),
    ratePeriods: readRatePeriods(config),
    useGreenMortgage: config.getBoolean("mortgage", "use_green_mortgage"),
    berRating: config.getString("mortgage", "ber_rating", "B") as BerRating,
    greenDiscountOverridePct: overridePct < 0 ? null : overridePct,
    grossIncome: useProfileSalary
      ? profileSalary + secondSalary
      : secondSalary > 0
        ? secondSalary
        : profileSalary,
    monthlyCommitments: config.getNumber("mortgage", "monthly_commitments"),
    assumeMpe: config.getBoolean("mortgage", "assume_mpe"),
    stressTestEnabled: config.getBoolean("mortgage", "stress_test_enabled", true),
    isBridgingLoan: config.getBoolean("mortgage", "is_bridging_loan"),
    useHelpToBuy: config.getBoolean("mortgage", "use_help_to_buy"),
    htbRefundEstimate: config.getNumber("mortgage", "htb_refund_estimate"),
    useFirstHomeScheme: config.getBoolean("mortgage", "use_first_home_scheme"),
    fhsEquityPct: config.getNumber("mortgage", "fhs_equity_pct"),
    solicitorFee: config.getNumber("mortgage", "solicitor_fee"),
    valuationFee: config.getNumber("mortgage", "valuation_fee"),
    includeSurvey: config.getBoolean("mortgage", "include_survey", true),
    surveyFee: config.getNumber("mortgage", "survey_fee"),
    mortgageProtectionMonthly: config.getNumber("mortgage", "mortgage_protection_monthly"),
    homeInsuranceAnnual: config.getNumber("mortgage", "home_insurance_annual"),
    lptLocalAdjustmentPct: config.getNumber("mortgage", "lpt_local_adjustment_pct"),
    overpaymentMonthly: config.getNumber("mortgage", "overpayment_monthly"),
    overpaymentMonthlyStartYear: config.getNumber("mortgage", "overpayment_monthly_start_year", 1),
    overpaymentLumpSum: config.getNumber("mortgage", "overpayment_lump_sum"),
    overpaymentLumpSumStartYear: config.getNumber("mortgage", "overpayment_lump_sum_start_year", 1),
  };
}

function readRatePeriods(config: ReturnType<typeof useConfigStore>): RatePeriod[] {
  return normalizeRateSchedule(
    parseRateSchedule(config.getString("mortgage", "rate_schedule")),
    config.getNumber("mortgage", "term_years"),
    config.getNumber("mortgage", "interest_rate_pct"),
  );
}

function persistRateSchedule(
  config: ReturnType<typeof useConfigStore>,
  periods: RatePeriod[],
): void {
  if (periods[0]) config.set("mortgage", "interest_rate_pct", periods[0].ratePct);
  config.set("mortgage", "rate_schedule", serializeRateSchedule(periods));
}

function RatePeriodsField({
  periods,
  termYears,
  invalid,
  errorMessage,
}: {
  periods: RatePeriod[];
  termYears: number;
  invalid: boolean;
  errorMessage?: string;
}) {
  const config = useConfigStore();
  const canAdd = canAddRatePeriod(periods, termYears);

  return (
    <div className="mt-3 min-w-0">
      <HintLabel hint={RATE_SCHEDULE_HINT}>Rate periods</HintLabel>
      <div className="space-y-1.5">
        {periods.map((period, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              step={1}
              aria-label={`Period ${index + 1} years`}
              className="h-8 w-16 font-mono text-sm tabular-nums"
              value={period.years}
              onChange={(event) => {
                persistRateSchedule(
                  config,
                  updateRatePeriod(periods, index, { years: Number(event.target.value) }, termYears),
                );
              }}
            />
            <Select
              value={period.kind}
              onValueChange={(value) => {
                persistRateSchedule(
                  config,
                  updateRatePeriod(periods, index, { kind: value as RateKind }, termYears),
                );
              }}
            >
              <SelectTrigger size="sm" className="h-8 min-w-0 flex-1 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value="fixed" className="font-mono text-sm">
                  Fixed
                </SelectItem>
                <SelectItem value="variable" className="font-mono text-sm">
                  Variable
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              step={0.05}
              aria-label={`Period ${index + 1} rate`}
              aria-invalid={invalid || undefined}
              className="h-8 w-20 font-mono text-sm tabular-nums"
              value={period.ratePct}
              onChange={(event) => {
                persistRateSchedule(
                  config,
                  updateRatePeriod(periods, index, { ratePct: Number(event.target.value) }, termYears),
                );
              }}
            />
            {index > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label={`Remove period ${index + 1}`}
                onClick={() => persistRateSchedule(config, removeRatePeriod(periods, index))}
              >
                <Trash2 />
              </Button>
            ) : (
              <span className="inline-flex size-7 shrink-0" aria-hidden />
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="mt-2"
        disabled={!canAdd}
        onClick={() => persistRateSchedule(config, addRatePeriod(periods, termYears))}
      >
        <Plus />
        Add rate period
      </Button>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </div>
  );
}

function DepositField({ invalid, errorMessage }: { invalid: boolean; errorMessage?: string }) {
  const config = useConfigStore();
  const mode = config.getString("mortgage", "deposit_input_mode", "pct");
  const propertyPrice = config.getNumber("mortgage", "property_price");
  const depositPct = config.getNumber("mortgage", "deposit_pct");
  const depositAmount =
    config.getNumber("mortgage", "deposit_amount") || depositAmountFromPct(propertyPrice, depositPct);

  return (
    <div className="min-w-0">
      <HintLabel hint={DEPOSIT_PCT_HINT}>Deposit</HintLabel>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <Select
          value={mode}
          onValueChange={(value) => {
            config.set("mortgage", "deposit_input_mode", value);
            syncDeposit(config, value === "amount" ? "amount" : "pct");
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-full font-mono text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {DEPOSIT_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="font-mono text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          step={mode === "pct" ? 0.1 : 1000}
          aria-invalid={invalid || undefined}
          className="font-mono text-sm tabular-nums"
          value={mode === "pct" ? depositPct : depositAmount}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (mode === "pct") {
              config.set("mortgage", "deposit_pct", value);
              syncDeposit(config, "pct");
            } else {
              config.set("mortgage", "deposit_amount", value);
              syncDeposit(config, "amount");
            }
          }}
        />
      </div>
      <FieldNote className="mt-1">
        {mode === "pct"
          ? `= ${formatEur(depositAmountFromPct(propertyPrice, depositPct))} (${formatPct(depositPct, 1)} of price)`
          : `= ${formatPct(depositPctFromAmount(propertyPrice, depositAmount), 1)} of ${formatEur(propertyPrice)}`}
      </FieldNote>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </div>
  );
}

function syncDeposit(
  config: ReturnType<typeof useConfigStore>,
  anchor: "pct" | "amount",
): void {
  const propertyPrice = config.getNumber("mortgage", "property_price");
  if (propertyPrice <= 0) return;
  if (anchor === "pct") {
    const pct = config.getNumber("mortgage", "deposit_pct");
    config.set("mortgage", "deposit_amount", depositAmountFromPct(propertyPrice, pct));
  } else {
    const amount = config.getNumber("mortgage", "deposit_amount");
    config.set("mortgage", "deposit_pct", depositPctFromAmount(propertyPrice, amount));
  }
}

export function MortgageTool() {
  const config = useConfigStore();
  const input = readInput(config);
  const result = runMortgagePlan(input);
  const fieldErrors = getMortgageFieldErrors(input);
  const invalidFields = getInvalidMortgageFields(input);
  const passLabel = result.borrowing.passesCentralBankRules ? "pass" : "fail";

  const annualTotals = aggregateAnnualTotals(
    result.amortization.monthlySnapshots,
    result.loanAmountAfterFhs,
  );
  const yearLabels = annualTotals.map((year) => `Y${year.year}`);

  const baselineAnnual = result.overpayment
    ? aggregateAnnualTotals(
        result.overpayment.baseline.monthlySnapshots,
        result.loanAmountAfterFhs,
      )
    : null;
  const overpayAnnual = result.overpayment
    ? aggregateAnnualTotals(
        result.overpayment.withOverpayment.monthlySnapshots,
        result.loanAmountAfterFhs,
      )
    : null;
  const overpayLabels = overpayAnnual?.map((year) => `Y${year.year}`) ?? yearLabels;

  const riskBaseline = aggregateAnnualTotals(
    result.rateRisk.baseline.monthlySnapshots,
    result.loanAmountAfterFhs,
  );
  const riskPlus = aggregateAnnualTotals(
    result.rateRisk.plusOne.monthlySnapshots,
    result.loanAmountAfterFhs,
  );
  const riskMinus = aggregateAnnualTotals(
    result.rateRisk.minusOne.monthlySnapshots,
    result.loanAmountAfterFhs,
  );
  const riskYearCount = Math.max(riskBaseline.length, riskPlus.length, riskMinus.length, 1);
  const riskLabels = Array.from({ length: riskYearCount }, (_, index) => `Y${index + 1}`);
  const riskInterest = (rows: typeof riskBaseline): number[] =>
    Array.from({ length: riskYearCount }, (_, index) => rows[index]?.interestPaid ?? 0);

  return (
    <ToolLayout
      title="Irish mortgage calculator"
      inputs={
        <Accordion type="multiple" defaultValue={["buyer", "loan", "affordability"]} className="rounded-lg border border-border bg-card px-3">
          <AccordionItem value="buyer">
            <AccordionTrigger>Buyer & property</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigSelectField
                  section="mortgage"
                  configKey="buyer_type"
                  label="Buyer type"
                  options={BUYER_OPTIONS}
                  hint={BUYER_TYPE_HINT}
                />
                <ConfigSelectField
                  section="mortgage"
                  configKey="property_type"
                  label="Property type"
                  options={PROPERTY_OPTIONS}
                  hint={PROPERTY_TYPE_HINT}
                  invalid={invalidFields.has("property_type")}
                  errorMessage={getMortgageFieldErrorMessage(fieldErrors, "property_type")}
                />
                <NumberField
                  label="Property price (€)"
                  value={config.getNumber("mortgage", "property_price")}
                  step={1000}
                  invalid={invalidFields.has("property_price")}
                  errorMessage={getMortgageFieldErrorMessage(fieldErrors, "property_price")}
                  onChange={(value) => {
                    config.set("mortgage", "property_price", value);
                    const mode = config.getString("mortgage", "deposit_input_mode", "pct");
                    syncDeposit(config, mode === "amount" ? "amount" : "pct");
                  }}
                />
                <DepositField
                  invalid={invalidFields.has("deposit")}
                  errorMessage={getMortgageFieldErrorMessage(fieldErrors, "deposit")}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="use_profile_salary"
                  label="Use profile salary"
                  hint={USE_PROFILE_SALARY_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="second_applicant_salary"
                  label="Second applicant salary (€)"
                  step={1000}
                  hint={SECOND_SALARY_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="loan">
            <AccordionTrigger>Loan terms</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <NumberField
                  label="Base interest rate (%)"
                  value={input.interestRatePct}
                  step={0.05}
                  hint={INTEREST_RATE_HINT}
                  onChange={(value) => {
                    persistRateSchedule(
                      config,
                      normalizeRateSchedule(input.ratePeriods ?? [], input.termYears, value),
                    );
                  }}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="use_green_mortgage"
                  label="Apply green mortgage discount"
                  hint={GREEN_MORTGAGE_HINT}
                />
                <ConfigSelectField
                  section="mortgage"
                  configKey="ber_rating"
                  label="BER rating"
                  options={BER_OPTIONS}
                  hint={BER_RATING_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="green_discount_override_pct"
                  label="Discount override (%, −1 = auto)"
                  step={0.05}
                  hint={GREEN_DISCOUNT_OVERRIDE_HINT}
                />
                <NumberField
                  label="Term (years)"
                  value={input.termYears}
                  invalid={invalidFields.has("term_years")}
                  errorMessage={getMortgageFieldErrorMessage(fieldErrors, "term_years")}
                  hint={TERM_YEARS_HINT}
                  onChange={(value) => {
                    const termYears = value;
                    config.set("mortgage", "term_years", termYears);
                    persistRateSchedule(
                      config,
                      normalizeRateSchedule(input.ratePeriods ?? [], termYears, input.interestRatePct),
                    );
                  }}
                />
              </FieldGrid>
              <RatePeriodsField
                periods={input.ratePeriods ?? []}
                termYears={input.termYears}
                invalid={invalidFields.has("rate_schedule")}
                errorMessage={getMortgageFieldErrorMessage(fieldErrors, "rate_schedule")}
              />
              {input.useGreenMortgage ? (
                <FieldNote className="mt-2">
                  {result.green.greenEligible
                    ? `Effective rate: ${formatPct(result.effectiveInterestRatePct, 2)} (−${formatPct(result.green.greenDiscountPct, 2)} green discount, ${result.green.greenTier} tier)`
                    : "Green discount not applied. See warnings below."}
                </FieldNote>
              ) : null}
              {result.paymentAfterFirstPeriod ? (
                <FieldNote className="mt-2">
                  After year {result.paymentAfterFirstPeriod.afterYear} the payment becomes{" "}
                  {formatEur(result.paymentAfterFirstPeriod.monthlyPayment)} at{" "}
                  {formatPct(result.paymentAfterFirstPeriod.ratePct, 2)}.
                </FieldNote>
              ) : null}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="affordability">
            <AccordionTrigger>Affordability</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section="mortgage"
                  configKey="monthly_commitments"
                  label="Monthly commitments (€)"
                  step={50}
                  hint={MONTHLY_COMMITMENTS_HINT}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="stress_test_enabled"
                  label="Show stress-test payment"
                  hint={STRESS_TEST_HINT}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="assume_mpe"
                  label="Assume lender exception (MPE)"
                  hint={MPE_HINT}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="is_bridging_loan"
                  label="Bridging loan (LTI exempt)"
                  hint={BRIDGING_LOAN_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="schemes">
            <AccordionTrigger>Government schemes</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="use_help_to_buy"
                  label="Help to Buy (HTB)"
                  hint={HTB_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="htb_refund_estimate"
                  label="HTB refund estimate (€)"
                  step={500}
                  hint={HTB_REFUND_HINT}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="use_first_home_scheme"
                  label="First Home Scheme (FHS)"
                  hint={FHS_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="fhs_equity_pct"
                  label="FHS equity (%)"
                  step={0.5}
                  hint={FHS_EQUITY_HINT}
                  invalid={invalidFields.has("fhs_equity_pct")}
                  errorMessage={getMortgageFieldErrorMessage(fieldErrors, "fhs_equity_pct")}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="costs">
            <AccordionTrigger>Purchase costs</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section="mortgage"
                  configKey="solicitor_fee"
                  label="Solicitor fee (€)"
                  step={100}
                  hint={SOLICITOR_FEE_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="valuation_fee"
                  label="Valuation fee (€)"
                  step={50}
                  hint={VALUATION_FEE_HINT}
                />
                <ConfigCheckboxField
                  section="mortgage"
                  configKey="include_survey"
                  label="Include survey / snag list"
                  hint={SURVEY_FEE_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="survey_fee"
                  label="Survey fee (€)"
                  step={50}
                  hint={SURVEY_FEE_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ongoing">
            <AccordionTrigger>Ongoing costs</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section="mortgage"
                  configKey="mortgage_protection_monthly"
                  label="Mortgage protection (€/mo)"
                  step={5}
                  hint={MORTGAGE_PROTECTION_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="home_insurance_annual"
                  label="Home insurance (€/yr)"
                  step={50}
                  hint={HOME_INSURANCE_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="lpt_local_adjustment_pct"
                  label="LPT local adjustment (%)"
                  step={1}
                  hint={LPT_ADJUSTMENT_HINT}
                />
              </FieldGrid>
              <FieldNote className="mt-2">
                Revenue basic rate for this price is {formatEur(result.lpt.basicRate)}.
              </FieldNote>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="overpay">
            <AccordionTrigger>Overpayments</AccordionTrigger>
            <AccordionContent>
              <FieldGrid>
                <ConfigNumberField
                  section="mortgage"
                  configKey="overpayment_monthly"
                  label="Extra monthly (€)"
                  step={50}
                  hint={OVERPAYMENT_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="overpayment_monthly_start_year"
                  label="Extra monthly starts (year)"
                  hint={OVERPAYMENT_MONTHLY_START_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="overpayment_lump_sum"
                  label="Lump sum (€)"
                  step={1000}
                  hint={OVERPAYMENT_HINT}
                />
                <ConfigNumberField
                  section="mortgage"
                  configKey="overpayment_lump_sum_start_year"
                  label="Lump sum applied (year)"
                  hint={OVERPAYMENT_LUMP_SUM_START_HINT}
                />
              </FieldGrid>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      }
      results={
        <ResultsPanel>
          {result.warnings.length > 0
            ? result.warnings.map((warning) => (
                <Alert key={warning} className="border-warning/30 text-warning">
                  <TriangleAlert />
                  <AlertDescription className="text-warning">{warning}</AlertDescription>
                </Alert>
              ))
            : null}

          <div className="flex items-center gap-2">
            <Badge variant={passLabel === "pass" ? "default" : "destructive"}>
              Central Bank rules: {passLabel}
            </Badge>
          </div>

          <StatGrid>
            <StatCard label="Monthly repayment" value={formatEur(result.amortization.monthlyPayment)} />
            <StatCard
              label="Stressed repayment"
              value={input.stressTestEnabled ? formatEur(result.stressedMonthlyPayment) : "—"}
            />
            <StatCard
              label={`Max borrowable (${passLabel})`}
              value={formatEur(result.borrowing.maxLoanAllowed)}
              tone={passLabel}
            />
            <StatCard label="Your loan" value={formatEur(result.loanAmountAfterFhs)} />
            <StatCard label="Total interest" value={formatEur(result.amortization.totalInterest)} />
            <StatCard
              label="Cash needed at completion"
              value={formatEur(result.upfrontCosts.totalCashRequired)}
            />
            <StatCard
              label="Total monthly housing"
              value={formatEur(result.ongoing.totalMonthlyHousingCost)}
            />
          </StatGrid>

          <StatGrid>
            <StatCard label="Stamp duty" value={formatEur(result.stampDuty.total)} />
            <StatCard
              label="LPT (annual)"
              value={formatEur(result.lpt.annualCharge)}
              hint={LPT_ANNUAL_HINT}
            />
            <StatCard
              label="HTB applied"
              value={formatEur(result.htb.appliedAmount)}
              hint={HTB_APPLIED_HINT}
            />
            <StatCard
              label="FHS equity"
              value={formatEur(result.fhs.equityAmount)}
              hint={FHS_EQUITY_STAT_HINT}
            />
            {result.interestSavedVsStandardRate > 0 ? (
              <StatCard
                label="Green interest saved"
                value={formatEur(result.interestSavedVsStandardRate)}
              />
            ) : null}
            {result.overpayment ? (
              <>
                <StatCard
                  label="Overpayment interest saved"
                  value={formatEur(result.overpayment.interestSaved)}
                />
                <StatCard label="Term reduced by" value={`${result.overpayment.monthsSaved} months`} />
              </>
            ) : null}
          </StatGrid>

          <Tabs defaultValue="amort">
            <TabsList className={chartTabsListClass}>
              <TabsTrigger value="amort">Amortization</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="paydown">Paydown</TabsTrigger>
              <TabsTrigger value="principal">Principal</TabsTrigger>
              <TabsTrigger value="upfront">Upfront</TabsTrigger>
              <TabsTrigger value="interest">Interest</TabsTrigger>
            </TabsList>
            <TabsContent value="amort" className="mt-2">
              <ChartExplainer summary={CHART_AMORTIZATION_SUMMARY} detail={CHART_AMORTIZATION_DETAIL} />
              <Chart
                type="line"
                labels={yearLabels}
                series={[
                  {
                    name: "Principal",
                    data: annualTotals.map((year) => year.principalPaid),
                    area: true,
                    stack: "pay",
                  },
                  {
                    name: "Interest",
                    data: annualTotals.map((year) => year.interestPaid),
                    area: true,
                    stack: "pay",
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="balance" className="mt-2">
              <ChartExplainer summary={CHART_BALANCE_SUMMARY} detail={CHART_BALANCE_DETAIL} />
              <Chart
                type="line"
                labels={yearLabels}
                series={[{ name: "Remaining balance", data: annualTotals.map((year) => year.balanceEnd) }]}
              />
            </TabsContent>
            <TabsContent value="paydown" className="mt-2">
              <ChartExplainer summary={CHART_PAYDOWN_SUMMARY} detail={CHART_PAYDOWN_DETAIL} />
              {result.overpayment && baselineAnnual && overpayAnnual ? (
                <Chart
                  type="line"
                  labels={overpayLabels}
                  series={[
                    {
                      name: "Without overpayment",
                      data: baselineAnnual.map((year) => year.balanceEnd),
                    },
                    {
                      name: "With overpayment",
                      data: overpayAnnual.map((year) => year.balanceEnd),
                    },
                  ]}
                />
              ) : (
                <Chart
                  type="line"
                  labels={yearLabels}
                  series={[
                    {
                      name: "Paydown rate (% of opening balance)",
                      data: annualTotals.map((year) => Math.round(year.paydownRatePct * 100) / 100),
                    },
                  ]}
                />
              )}
            </TabsContent>
            <TabsContent value="principal" className="mt-2">
              <ChartExplainer summary={CHART_PRINCIPAL_SUMMARY} detail={CHART_PRINCIPAL_DETAIL} />
              {result.overpayment && baselineAnnual && overpayAnnual ? (
                <Chart
                  type="bar"
                  labels={overpayLabels}
                  series={[
                    {
                      name: "Without overpayment",
                      data: baselineAnnual.map((year) => Math.round(year.principalPaid)),
                    },
                    {
                      name: "With overpayment",
                      data: overpayAnnual.map((year) => Math.round(year.principalPaid)),
                    },
                  ]}
                />
              ) : (
                <Chart
                  type="bar"
                  labels={yearLabels}
                  series={[
                    {
                      name: "Annual paydown (€)",
                      data: annualTotals.map((year) => Math.round(year.principalPaid)),
                    },
                  ]}
                />
              )}
            </TabsContent>
            <TabsContent value="upfront" className="mt-2">
              <ChartExplainer summary={CHART_UPFRONT_SUMMARY} detail={CHART_UPFRONT_DETAIL} />
              <Chart
                type="bar"
                labels={["Deposit", "Stamp duty", "Fees"]}
                series={[
                  {
                    name: "Upfront",
                    data: [
                      result.upfrontCosts.deposit,
                      result.upfrontCosts.stampDuty,
                      result.upfrontCosts.solicitorFee +
                        result.upfrontCosts.valuationFee +
                        result.upfrontCosts.surveyFee +
                        result.upfrontCosts.landRegistryFee,
                    ],
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="interest" className="mt-2">
              <ChartExplainer summary={CHART_INTEREST_SUMMARY} detail={CHART_INTEREST_DETAIL} />
              <Chart
                type="line"
                labels={riskLabels}
                series={[
                  { name: "Your rates", data: riskInterest(riskBaseline) },
                  { name: "Variable +1%", data: riskInterest(riskPlus) },
                  { name: "Variable −1%", data: riskInterest(riskMinus) },
                ]}
              />
            </TabsContent>
          </Tabs>

          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}

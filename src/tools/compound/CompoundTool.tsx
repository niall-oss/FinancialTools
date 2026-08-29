import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart } from "@/components/app/Chart";
import { ConfigCheckboxField } from "@/components/app/CheckboxField";
import { ChartExplainer, FieldGrid, FieldNote } from "@/components/app/FieldChrome";
import { ConfigNumberField } from "@/components/app/NumberField";
import { ConfigSelectField, SelectField } from "@/components/app/SelectField";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { chartTabsListClass, ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import type { TaxMode } from "@/core/config/schema";
import { formatEur, formatPct } from "@/core/format";
import { describeIrishIncomeTaxFromProfile, resolveTaxIe } from "@/core/irish-income-tax";
import { useConfigStore } from "@/hooks/use-config";
import {
  fisherRealReturnPct,
  runCompoundSimulation,
  runSensitivityAnalysis,
} from "@/tools/compound/engine";
import {
  CGT_RATE_HINT,
  CHART_BALANCE_DETAIL,
  CHART_BALANCE_SUMMARY,
  CHART_MIX_DETAIL,
  CHART_MIX_SUMMARY,
  CHART_SENSITIVITY_DETAIL,
  CHART_SENSITIVITY_SUMMARY,
  CHART_TAX_DETAIL,
  CHART_TAX_SUMMARY,
  DISCLAIMER,
} from "@/tools/compound/hints";

const TAX_MODE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "deemed_disposal", label: "Deemed disposal (ETF)" },
  { value: "cgt_on_exit", label: "CGT on exit (stocks)" },
  { value: "income_annual", label: "Annual income tax on gains (20% / 40%)" },
];

const INCOME_TAX_RATE_OPTIONS = [
  { value: "20", label: "20% (standard rate)" },
  { value: "40", label: "40% (higher rate)" },
];

const INCOME_TAX_PROFILE_HINT =
  "Gains use whatever is left of your standard-rate band after salary, then the higher rate. Bands come from the home page.";

const INFLATION_RATE_HINT =
  "Deflates the pot into today's euros. Compounding, tax, and fees still run on the nominal path.";

export function CompoundTool() {
  const config = useConfigStore();

  const input = {
    initialInvestment: config.getNumber("compound", "initial_investment"),
    monthlyContribution: config.getNumber("compound", "monthly_contribution"),
    years: config.getNumber("compound", "years"),
    annualReturnPct: config.getNumber("compound", "annual_return_pct"),
    annualFeePct: config.getNumber("compound", "annual_fee_pct"),
    taxMode: config.getString("compound", "tax_mode", "none") as TaxMode,
    deemedDisposalRatePct: config.getNumber("compound", "deemed_disposal_rate_pct"),
    deemedDisposalIntervalYears: config.getNumber("compound", "deemed_disposal_interval_years"),
    cgtRatePct: config.getNumber("compound", "cgt_rate_pct"),
    incomeTaxFromProfile: config.getBoolean("compound", "income_tax_from_profile", true),
    incomeTaxManualRatePct: config.getNumber("compound", "income_tax_manual_rate_pct", 40),
    annualSalary: config.getNumber("profile", "annual_salary"),
    inflationRatePct: config.getNumber("compound", "inflation_rate_pct"),
    taxIe: resolveTaxIe(config),
  };

  const result = runCompoundSimulation(input);
  const approxRealReturnPct = fisherRealReturnPct(input.annualReturnPct, input.inflationRatePct);
  const labels = result.years.map((year) => `Y${year.year}`);
  const sensitivityRates = Array.from({ length: 9 }, (_, i) => input.annualReturnPct - 4 + i);
  const sensitivity = runSensitivityAnalysis(input, sensitivityRates);
  const taxLabels =
    result.taxEvents.length > 0 ? result.taxEvents.map((event) => `Year ${event.year}`) : ["No events"];
  const taxData = result.taxEvents.length > 0 ? result.taxEvents.map((event) => event.amount) : [0];

  return (
    <ToolLayout
      title="Compound calculator"
      inputs={
        <div className="flex flex-col gap-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGrid>
                <ConfigNumberField section="compound" configKey="initial_investment" label="Initial investment (€)" />
                <ConfigNumberField
                  section="compound"
                  configKey="monthly_contribution"
                  label="Monthly contribution (€)"
                />
                <ConfigNumberField section="compound" configKey="years" label="Horizon (years)" />
                <ConfigNumberField
                  section="compound"
                  configKey="annual_return_pct"
                  label="Expected annual return (%)"
                  step={0.1}
                />
                <ConfigNumberField
                  section="compound"
                  configKey="inflation_rate_pct"
                  label="Inflation rate (%)"
                  step={0.1}
                  hint={INFLATION_RATE_HINT}
                />
              </FieldGrid>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Tax & fees</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGrid>
                <ConfigNumberField
                  section="compound"
                  configKey="annual_fee_pct"
                  label="Annual fee (%)"
                  step={0.1}
                />
                <ConfigSelectField
                  section="compound"
                  configKey="tax_mode"
                  label="Tax mode"
                  options={TAX_MODE_OPTIONS}
                />
                <ConfigNumberField
                  section="compound"
                  configKey="deemed_disposal_rate_pct"
                  label="Deemed disposal rate (%)"
                  step={0.1}
                />
                <ConfigNumberField
                  section="compound"
                  configKey="deemed_disposal_interval_years"
                  label="Deemed disposal interval (years)"
                />
                <ConfigNumberField
                  section="compound"
                  configKey="cgt_rate_pct"
                  label="CGT rate (%)"
                  step={0.1}
                  hint={CGT_RATE_HINT}
                />
                <ConfigCheckboxField
                  section="compound"
                  configKey="income_tax_from_profile"
                  label="Use profile salary for income tax (20% / 40%)"
                  hint={INCOME_TAX_PROFILE_HINT}
                />
                {input.incomeTaxFromProfile ? (
                  <div className="col-span-full">
                    <FieldNote>{describeIrishIncomeTaxFromProfile(input.annualSalary, input.taxIe)}</FieldNote>
                  </div>
                ) : (
                  <SelectField
                    label="Income tax rate on gains"
                    value={String(input.incomeTaxManualRatePct)}
                    options={INCOME_TAX_RATE_OPTIONS}
                    onChange={(value) => config.set("compound", "income_tax_manual_rate_pct", Number(value))}
                  />
                )}
              </FieldGrid>
            </CardContent>
          </Card>
        </div>
      }
      results={
        <ResultsPanel>
          <StatGrid>
            <StatCard label="Final balance" value={formatEur(result.finalBalance)} />
            <StatCard label="Final (today's €)" value={formatEur(result.finalRealBalance)} />
            <StatCard label="Total contributed" value={formatEur(result.totalContributions)} />
            <StatCard label="Total fees" value={formatEur(result.totalFees)} />
            <StatCard label="Total tax" value={formatEur(result.totalTax)} />
            <StatCard
              label="Net growth"
              value={formatEur(result.finalBalance - result.totalContributions)}
            />
            <StatCard label="Approx. real return" value={formatPct(approxRealReturnPct)} />
          </StatGrid>

          <Tabs defaultValue="balance">
            <TabsList className={chartTabsListClass}>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="mix">Mix</TabsTrigger>
              <TabsTrigger value="tax">Tax</TabsTrigger>
              <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
            </TabsList>
            <TabsContent value="balance" className="mt-2">
              <ChartExplainer summary={CHART_BALANCE_SUMMARY} detail={CHART_BALANCE_DETAIL} />
              <Chart
                type="line"
                labels={labels}
                series={[
                  { name: "Nominal", data: result.years.map((year) => year.balance) },
                  { name: "Today's €", data: result.years.map((year) => year.realBalance) },
                ]}
              />
            </TabsContent>
            <TabsContent value="mix" className="mt-2">
              <ChartExplainer summary={CHART_MIX_SUMMARY} detail={CHART_MIX_DETAIL} />
              <Chart
                type="line"
                labels={labels}
                series={[
                  {
                    name: "Contributions",
                    data: result.years.map((year) => year.contributions),
                    area: true,
                    stack: "total",
                  },
                  {
                    name: "Growth",
                    data: result.years.map((year) => Math.max(0, year.balance - year.contributions)),
                    area: true,
                    stack: "total",
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="tax" className="mt-2">
              <ChartExplainer summary={CHART_TAX_SUMMARY} detail={CHART_TAX_DETAIL} />
              <Chart type="bar" labels={taxLabels} series={[{ name: "Tax paid", data: taxData }]} />
            </TabsContent>
            <TabsContent value="sensitivity" className="mt-2">
              <ChartExplainer summary={CHART_SENSITIVITY_SUMMARY} detail={CHART_SENSITIVITY_DETAIL} />
              <Chart
                type="scatter"
                points={sensitivity.map((point) => ({
                  name: "",
                  x: point.returnPct,
                  y: point.finalBalance,
                }))}
              />
            </TabsContent>
          </Tabs>

          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}

/** Irish PAYE income tax rates and standard rate bands (2026). */

export type TaxStatus = "single" | "spccc" | "married_one" | "married_two";

export interface TaxIeParams {
  standardRatePct: number;
  higherRatePct: number;
  bandSingle: number;
  bandSpccc: number;
  bandMarriedOne: number;
  bandMarriedTwoBase: number;
  bandMarriedTwoMaxIncrease: number;
}

export interface TaxIeReader {
  getNumber(section: string, key: string, fallback?: number): number;
}

export const TAX_IE_2026: TaxIeParams = {
  standardRatePct: 20,
  higherRatePct: 40,
  bandSingle: 44_000,
  bandSpccc: 48_000,
  bandMarriedOne: 53_000,
  bandMarriedTwoBase: 53_000,
  bandMarriedTwoMaxIncrease: 35_000,
};

export const IE_STANDARD_RATE_PCT = TAX_IE_2026.standardRatePct;
export const IE_HIGHER_RATE_PCT = TAX_IE_2026.higherRatePct;
export const IE_STANDARD_RATE_BAND_SINGLE = TAX_IE_2026.bandSingle;

export function taxIeConfigValues(tax: TaxIeParams = TAX_IE_2026): Record<string, number> {
  return {
    standard_rate_pct: tax.standardRatePct,
    higher_rate_pct: tax.higherRatePct,
    band_single: tax.bandSingle,
    band_spccc: tax.bandSpccc,
    band_married_one: tax.bandMarriedOne,
    band_married_two_base: tax.bandMarriedTwoBase,
    band_married_two_max_increase: tax.bandMarriedTwoMaxIncrease,
  };
}

export function resolveTaxIeFromSection(
  config: TaxIeReader,
  section: string,
  prefix = "",
): TaxIeParams {
  const key = (name: string): string => `${prefix}${name}`;
  return {
    standardRatePct: config.getNumber(section, key("standard_rate_pct"), TAX_IE_2026.standardRatePct),
    higherRatePct: config.getNumber(section, key("higher_rate_pct"), TAX_IE_2026.higherRatePct),
    bandSingle: config.getNumber(section, key("band_single"), TAX_IE_2026.bandSingle),
    bandSpccc: config.getNumber(section, key("band_spccc"), TAX_IE_2026.bandSpccc),
    bandMarriedOne: config.getNumber(section, key("band_married_one"), TAX_IE_2026.bandMarriedOne),
    bandMarriedTwoBase: config.getNumber(
      section,
      key("band_married_two_base"),
      TAX_IE_2026.bandMarriedTwoBase,
    ),
    bandMarriedTwoMaxIncrease: config.getNumber(
      section,
      key("band_married_two_max_increase"),
      TAX_IE_2026.bandMarriedTwoMaxIncrease,
    ),
  };
}

export function resolveTaxIe(config?: TaxIeReader | null): TaxIeParams {
  if (!config) return { ...TAX_IE_2026 };
  return resolveTaxIeFromSection(config, "tax_ie");
}

export function standardRateBandForStatus(
  tax: TaxIeParams,
  status: TaxStatus = "single",
  otherIncome = 0,
): number {
  switch (status) {
    case "spccc":
      return tax.bandSpccc;
    case "married_one":
      return tax.bandMarriedOne;
    case "married_two":
      return tax.bandMarriedTwoBase + Math.min(tax.bandMarriedTwoMaxIncrease, Math.max(0, otherIncome));
    default:
      return tax.bandSingle;
  }
}

export function calculateIrishIncomeTax(
  taxableIncome: number,
  tax: TaxIeParams = TAX_IE_2026,
  status: TaxStatus = "single",
  otherIncome = 0,
): number {
  if (taxableIncome <= 0) return 0;
  const band = standardRateBandForStatus(tax, status, otherIncome);
  const taxedAtStandard = Math.min(taxableIncome, band);
  const taxedAtHigher = Math.max(0, taxableIncome - band);
  return taxedAtStandard * (tax.standardRatePct / 100) + taxedAtHigher * (tax.higherRatePct / 100);
}

export function calculateIrishIncomeTaxOnGain(
  annualSalary: number,
  taxableGain: number,
  tax: TaxIeParams = TAX_IE_2026,
  status: TaxStatus = "single",
  otherIncome = 0,
): number {
  if (taxableGain <= 0) return 0;
  const taxWithout = calculateIrishIncomeTax(annualSalary, tax, status, otherIncome);
  const taxWith = calculateIrishIncomeTax(annualSalary + taxableGain, tax, status, otherIncome);
  return taxWith - taxWithout;
}

export function getMarginalIrishIncomeTaxRatePct(
  annualSalary: number,
  tax: TaxIeParams = TAX_IE_2026,
  status: TaxStatus = "single",
  otherIncome = 0,
): number {
  const band = standardRateBandForStatus(tax, status, otherIncome);
  return annualSalary >= band ? tax.higherRatePct : tax.standardRatePct;
}

export function describeIrishIncomeTaxFromProfile(
  annualSalary: number,
  tax: TaxIeParams = TAX_IE_2026,
  status: TaxStatus = "single",
  otherIncome = 0,
): string {
  const band = standardRateBandForStatus(tax, status, otherIncome);
  const bandLabel = band.toLocaleString("en-IE");
  if (annualSalary >= band) {
    return `Gains taxed at ${tax.higherRatePct}% (salary above €${bandLabel} standard rate band).`;
  }
  const headroom = (band - annualSalary).toLocaleString("en-IE");
  return `Gains taxed at ${tax.standardRatePct}% up to €${headroom} remaining in band, then ${tax.higherRatePct}%.`;
}

export function resolveIncomeTaxRatePct(
  annualSalary: number,
  fromProfile: boolean,
  manualRatePct: number,
  tax: TaxIeParams = TAX_IE_2026,
): number {
  if (!fromProfile) return manualRatePct;
  return getMarginalIrishIncomeTaxRatePct(annualSalary, tax);
}

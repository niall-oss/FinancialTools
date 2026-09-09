/** Irish USC and PRSI for 2026. Employee pension contributions do not reduce these. */

export const IE_USC_EXEMPT = 13_000;

export const IE_USC_BANDS = [
  { upTo: 12_012, ratePct: 0.5 },
  { upTo: 28_700, ratePct: 2 },
  { upTo: 70_044, ratePct: 3 },
  { upTo: Infinity, ratePct: 8 },
] as const;

export const IE_USC_REDUCED_INCOME_CAP = 60_000;
export const IE_USC_REDUCED_RATE_PCT = 2;

export const IE_USC_SELF_EMPLOYED_SURCHARGE_THRESHOLD = 100_000;
export const IE_USC_SELF_EMPLOYED_SURCHARGE_PCT = 3;

/** Class A employee / Class S self-employed rate through 30 Sep 2026. */
export const IE_PRSI_RATE_PCT = 4.2;
export const IE_PRSI_RATE_FROM_OCT_2026_PCT = 4.35;
export const IE_PRSI_WEEKS_AT_BASE_2026 = 39;
export const IE_PRSI_WEEKS_AT_OCT_2026 = 13;
export const IE_PRSI_WEEKLY_EXEMPT = 352;
export const IE_PRSI_CREDIT_MAX = 12;
export const IE_PRSI_CREDIT_TAPER_END = 424;
export const IE_PRSI_SELF_EMPLOYED_MINIMUM = 650;
export const IE_PRSI_EXEMPT_AGE = 70;

export interface UscSlice {
  from: number;
  to: number;
  ratePct: number;
  amount: number;
}

export interface UscOptions {
  selfEmployed?: boolean;
  reducedRate?: boolean;
}

function uscBandsFor(income: number, reducedRate: boolean): { upTo: number; ratePct: number }[] {
  if (reducedRate && income <= IE_USC_REDUCED_INCOME_CAP) {
    return [
      { upTo: 12_012, ratePct: 0.5 },
      { upTo: Infinity, ratePct: IE_USC_REDUCED_RATE_PCT },
    ];
  }
  return IE_USC_BANDS.map((band) => ({ upTo: band.upTo, ratePct: band.ratePct }));
}

export function uscSlices(income: number, options: UscOptions = {}): UscSlice[] {
  if (income <= IE_USC_EXEMPT) return [];

  const bands = uscBandsFor(income, options.reducedRate === true);
  const slices: UscSlice[] = [];
  let lower = 0;
  for (const band of bands) {
    if (income <= lower) break;
    const slice = Math.min(income, band.upTo) - lower;
    if (slice > 0) {
      slices.push({
        from: lower,
        to: Math.min(income, band.upTo),
        ratePct: band.ratePct,
        amount: slice * (band.ratePct / 100),
      });
    }
    lower = band.upTo;
  }
  return slices;
}

export function calculateUsc(income: number, selfEmployed = false): number {
  let tax = uscSlices(income).reduce((sum, slice) => sum + slice.amount, 0);
  if (selfEmployed && income > IE_USC_SELF_EMPLOYED_SURCHARGE_THRESHOLD) {
    tax += (income - IE_USC_SELF_EMPLOYED_SURCHARGE_THRESHOLD) * (IE_USC_SELF_EMPLOYED_SURCHARGE_PCT / 100);
  }
  return tax;
}

export function calculatePrsi(income: number, selfEmployed = false): number {
  if (income <= 0) return 0;
  if (!selfEmployed && income / 52 <= IE_PRSI_WEEKLY_EXEMPT) return 0;
  const charge = income * (IE_PRSI_RATE_PCT / 100);
  if (selfEmployed) return Math.max(charge, IE_PRSI_SELF_EMPLOYED_MINIMUM);
  return charge;
}

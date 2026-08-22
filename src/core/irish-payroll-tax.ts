/** Irish USC and PRSI for 2026. Employee pension contributions do not reduce these. */

export const IE_USC_EXEMPT = 13_000;

export const IE_USC_BANDS = [
  { upTo: 12_012, ratePct: 0.5 },
  { upTo: 28_700, ratePct: 2 },
  { upTo: 70_044, ratePct: 3 },
  { upTo: Infinity, ratePct: 8 },
] as const;

export const IE_USC_SELF_EMPLOYED_SURCHARGE_THRESHOLD = 100_000;
export const IE_USC_SELF_EMPLOYED_SURCHARGE_PCT = 3;

/** Class A employee / Class S self-employed rate through 30 Sep 2026. */
export const IE_PRSI_RATE_PCT = 4.2;
export const IE_PRSI_WEEKLY_EXEMPT = 352;
export const IE_PRSI_SELF_EMPLOYED_MINIMUM = 650;

export function calculateUsc(income: number, selfEmployed = false): number {
  if (income <= IE_USC_EXEMPT) return 0;

  let tax = 0;
  let lower = 0;
  for (const band of IE_USC_BANDS) {
    if (income <= lower) break;
    const slice = Math.min(income, band.upTo) - lower;
    if (slice > 0) tax += slice * (band.ratePct / 100);
    lower = band.upTo;
  }

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

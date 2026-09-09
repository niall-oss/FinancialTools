/** Irish occupational / PRSA / RAC contribution relief rules (2026). */

export const IE_PENSION_EARNINGS_CAP = 115_000;
export const IE_PENSION_STANDARD_FUND_THRESHOLD = 2_200_000;
export const IE_PRSA_EMPLOYER_LIMIT_PCT = 100;
export const IE_SPORTSPERSON_MIN_PCT = 30;
export const IE_SPORTSPERSON_AGE_CUTOFF = 50;

export interface PensionAgeBand {
  label: string;
  minAge: number;
  maxAge: number | null;
  pct: number;
}

export const PENSION_AGE_BANDS: PensionAgeBand[] = [
  { label: "Under 30", minAge: 0, maxAge: 29, pct: 15 },
  { label: "30–39", minAge: 30, maxAge: 39, pct: 20 },
  { label: "40–49", minAge: 40, maxAge: 49, pct: 25 },
  { label: "50–54", minAge: 50, maxAge: 54, pct: 30 },
  { label: "55–59", minAge: 55, maxAge: 59, pct: 35 },
  { label: "60 or over", minAge: 60, maxAge: null, pct: 40 },
];

export function pensionAgeBandForAge(age: number): PensionAgeBand {
  const band = PENSION_AGE_BANDS.find(
    (row) => age >= row.minAge && (row.maxAge === null || age <= row.maxAge),
  );
  return band ?? PENSION_AGE_BANDS[PENSION_AGE_BANDS.length - 1];
}

export function nextPensionAgeBand(age: number): PensionAgeBand | null {
  const current = pensionAgeBandForAge(age);
  const index = PENSION_AGE_BANDS.indexOf(current);
  return index >= 0 && index < PENSION_AGE_BANDS.length - 1 ? PENSION_AGE_BANDS[index + 1] : null;
}

export function pensionReliefPct(age: number, sportsperson = false): number {
  const bandPct = pensionAgeBandForAge(age).pct;
  if (sportsperson && age < IE_SPORTSPERSON_AGE_CUTOFF) {
    return Math.max(bandPct, IE_SPORTSPERSON_MIN_PCT);
  }
  return bandPct;
}

export function cappedPensionEarnings(relevantEarnings: number): number {
  return Math.max(0, Math.min(relevantEarnings, IE_PENSION_EARNINGS_CAP));
}

export function maxRelievableContribution(
  relevantEarnings: number,
  age: number,
  sportsperson = false,
): number {
  return cappedPensionEarnings(relevantEarnings) * (pensionReliefPct(age, sportsperson) / 100);
}

export function pensionEarningsCapWarning(
  earnings: number,
  contribution: number,
  age: number,
  sportsperson = false,
  prefix = "",
): string | null {
  if (earnings <= IE_PENSION_EARNINGS_CAP || contribution <= 0.5) return null;
  const cap = Math.round(maxRelievableContribution(earnings, age, sportsperson));
  const pct = pensionReliefPct(age, sportsperson);
  const capLabel = cap.toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  return `${prefix}Pay is above the €${IE_PENSION_EARNINGS_CAP.toLocaleString("en-IE")} earnings cap for pension tax relief. The ${pct}% age-band limit only applies to the first €${IE_PENSION_EARNINGS_CAP.toLocaleString("en-IE")} (${capLabel} this year). Extra salary does not increase that room.`;
}

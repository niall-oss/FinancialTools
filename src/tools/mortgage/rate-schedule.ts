export type RateKind = "fixed" | "variable";

export interface RatePeriod {
  kind: RateKind;
  years: number;
  ratePct: number;
}

export interface YearRate {
  kind: RateKind;
  ratePct: number;
}

export function defaultRateSchedule(termYears: number, openingRatePct: number): RatePeriod[] {
  return [
    {
      kind: "fixed",
      years: clampTerm(termYears),
      ratePct: clampRate(openingRatePct),
    },
  ];
}

export function parseRateSchedule(raw: string): RatePeriod[] {
  if (!raw.trim()) return [];
  const periods: RatePeriod[] = [];
  for (const chunk of raw.split(";")) {
    const parts = chunk.trim().split("|");
    if (parts.length < 3) continue;
    const kind = parseKind(parts[0]);
    if (!kind) continue;
    const years = Math.round(Number(parts[1]));
    const ratePct = Number(parts[2]);
    if (!Number.isFinite(years) || years < 1) continue;
    if (!Number.isFinite(ratePct)) continue;
    periods.push({ kind, years, ratePct: clampRate(ratePct) });
  }
  return periods;
}

export function serializeRateSchedule(periods: RatePeriod[]): string {
  return periods.map((period) => `${period.kind}|${period.years}|${period.ratePct}`).join(";");
}

export function normalizeRateSchedule(
  periods: RatePeriod[],
  termYears: number,
  openingRatePct: number,
): RatePeriod[] {
  const term = clampTerm(termYears);
  const opening = clampRate(openingRatePct);
  const cleaned = periods
    .map((period) => ({
      kind: period.kind === "variable" ? ("variable" as const) : ("fixed" as const),
      years: Math.max(1, Math.round(period.years) || 1),
      ratePct: clampRate(period.ratePct),
    }))
    .slice(0, term);

  if (cleaned.length === 0) return defaultRateSchedule(term, opening);

  cleaned[0] = { ...cleaned[0]!, ratePct: opening };
  return fitToTerm(cleaned, term);
}

export function canAddRatePeriod(periods: RatePeriod[], termYears: number): boolean {
  const term = clampTerm(termYears);
  if (periods.length === 0 || periods.length >= term) return false;
  const last = periods[periods.length - 1];
  return last !== undefined && last.years > 1;
}

export function addRatePeriod(periods: RatePeriod[], termYears: number): RatePeriod[] {
  if (!canAddRatePeriod(periods, termYears)) return periods;
  const last = periods[periods.length - 1]!;
  return [
    ...periods.slice(0, -1),
    { ...last, years: last.years - 1 },
    { kind: "variable", years: 1, ratePct: last.ratePct },
  ];
}

export function removeRatePeriod(periods: RatePeriod[], index: number): RatePeriod[] {
  if (index <= 0 || index >= periods.length) return periods;
  const removed = periods[index]!;
  const next = periods.filter((_, periodIndex) => periodIndex !== index);
  const absorb = index - 1;
  next[absorb] = { ...next[absorb]!, years: next[absorb]!.years + removed.years };
  return next;
}

export function updateRatePeriod(
  periods: RatePeriod[],
  index: number,
  patch: Partial<RatePeriod>,
  termYears: number,
): RatePeriod[] {
  if (index < 0 || index >= periods.length) return periods;
  const term = clampTerm(termYears);
  const next = periods.map((period, periodIndex) =>
    periodIndex === index ? { ...period, ...patch } : { ...period },
  );

  if (patch.years !== undefined) {
    applyYearEdit(next, index, patch.years, term);
  }

  const opening = next[0]?.ratePct ?? 0;
  return normalizeRateSchedule(next, term, opening);
}

export function expandRateByYear(periods: RatePeriod[], termYears: number): YearRate[] {
  const term = clampTerm(termYears);
  const result: YearRate[] = [];
  for (const period of periods) {
    for (let i = 0; i < period.years && result.length < term; i++) {
      result.push({ kind: period.kind, ratePct: period.ratePct });
    }
  }
  const last = result[result.length - 1] ?? { kind: "fixed" as const, ratePct: 0 };
  while (result.length < term) result.push({ ...last });
  return result;
}

export function shockVariableRates(periods: RatePeriod[], deltaPct: number): RatePeriod[] {
  return periods.map((period) =>
    period.kind === "variable"
      ? { ...period, ratePct: clampRate(period.ratePct + deltaPct) }
      : { ...period },
  );
}

export function applyOpeningRate(periods: RatePeriod[], openingRatePct: number): RatePeriod[] {
  if (periods.length === 0) return periods;
  return [{ ...periods[0]!, ratePct: clampRate(openingRatePct) }, ...periods.slice(1)];
}

function parseKind(raw: string | undefined): RateKind | null {
  if (raw === "fixed" || raw === "variable") return raw;
  return null;
}

function clampTerm(termYears: number): number {
  if (!Number.isFinite(termYears)) return 1;
  return Math.max(1, Math.round(termYears));
}

function clampRate(ratePct: number): number {
  if (!Number.isFinite(ratePct)) return 0;
  return Math.max(0, ratePct);
}

function fitToTerm(periods: RatePeriod[], term: number): RatePeriod[] {
  const result: RatePeriod[] = [];
  let remaining = term;
  for (let i = 0; i < periods.length && remaining > 0; i++) {
    const leftover = periods.length - i;
    const maxForThis = remaining - (leftover - 1);
    const years = i === periods.length - 1 ? remaining : Math.min(Math.max(1, periods[i]!.years), maxForThis);
    result.push({ ...periods[i]!, years });
    remaining -= years;
  }
  if (remaining > 0 && result.length > 0) {
    result[result.length - 1] = {
      ...result[result.length - 1]!,
      years: result[result.length - 1]!.years + remaining,
    };
  }
  return result;
}

function applyYearEdit(periods: RatePeriod[], index: number, rawYears: number, term: number): void {
  const requested = Math.max(1, Math.round(rawYears) || 1);
  if (periods.length === 1) {
    periods[0] = { ...periods[0]!, years: term };
    return;
  }

  const lastIndex = periods.length - 1;
  if (index === lastIndex) {
    const beforePrev = periods.slice(0, -2).reduce((sum, period) => sum + period.years, 0);
    const maxLast = term - beforePrev - 1;
    const lastYears = Math.min(requested, maxLast);
    periods[lastIndex] = { ...periods[lastIndex]!, years: lastYears };
    periods[lastIndex - 1] = {
      ...periods[lastIndex - 1]!,
      years: term - beforePrev - lastYears,
    };
    return;
  }

  const othersExceptLastAndThis = periods.reduce((sum, period, periodIndex) => {
    if (periodIndex === index || periodIndex === lastIndex) return sum;
    return sum + period.years;
  }, 0);
  const thisYears = Math.min(requested, Math.max(1, term - othersExceptLastAndThis - 1));
  periods[index] = { ...periods[index]!, years: thisYears };
  const used = periods.slice(0, lastIndex).reduce((sum, period) => sum + period.years, 0);
  periods[lastIndex] = { ...periods[lastIndex]!, years: Math.max(1, term - used) };
}

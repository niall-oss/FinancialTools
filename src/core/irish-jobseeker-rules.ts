/** Irish jobseeker payment rates and JPRB schedule (Budget 2026). */

export type PrsiBand = "5plus" | "2to5";

export const IE_JPRB_MIN_WEEKLY = 125;
export const IE_JPRB_WEEKS_5PLUS = 39;
export const IE_JPRB_WEEKS_2TO5 = 26;

export interface JprbPhaseRule {
  pct: number;
  cap: number;
  weeks: number;
}

export const IE_JPRB_5PLUS_PHASES: readonly JprbPhaseRule[] = [
  { pct: 60, cap: 450, weeks: 13 },
  { pct: 55, cap: 375, weeks: 13 },
  { pct: 50, cap: 300, weeks: 13 },
];

export const IE_JPRB_2TO5_PHASES: readonly JprbPhaseRule[] = [
  { pct: 50, cap: 300, weeks: 26 },
];

export const IE_JA_PERSONAL_25_PLUS = 254;
export const IE_JA_PERSONAL_UNDER_25 = 163.7;
export const IE_JA_AGE_CUTOFF = 25;
export const IE_JA_QUALIFIED_ADULT = 168.6;
export const IE_JA_CHILD_UNDER_12 = 58;
export const IE_JA_CHILD_12_PLUS = 78;
export const IE_JA_CAPITAL_DISREGARD = 20_000;

export const IE_JB_PERSONAL_MAX = 254;
export const IE_JB_DURATION_LONG_DAYS = 234;
export const IE_JB_DURATION_SHORT_DAYS = 156;

export const IE_CHILD_BENEFIT_MONTHLY = 140;

export interface JprbPhase {
  weekStart: number;
  weekEnd: number;
  weeklyRate: number;
}

export function weeklyFromAnnualSalary(annual: number): number {
  if (!Number.isFinite(annual) || annual <= 0) return 0;
  return annual / 52;
}

export function jaPersonalRate(age: number): number {
  if (!Number.isFinite(age) || age < IE_JA_AGE_CUTOFF) return IE_JA_PERSONAL_UNDER_25;
  return IE_JA_PERSONAL_25_PLUS;
}

export function jprbDurationWeeks(band: PrsiBand): number {
  return band === "5plus" ? IE_JPRB_WEEKS_5PLUS : IE_JPRB_WEEKS_2TO5;
}

export function jprbPhasesForBand(band: PrsiBand): readonly JprbPhaseRule[] {
  return band === "5plus" ? IE_JPRB_5PLUS_PHASES : IE_JPRB_2TO5_PHASES;
}

export function jprbWeeklyRate(weeklyGross: number, pct: number, cap: number): number {
  const earnings = Number.isFinite(weeklyGross) && weeklyGross > 0 ? weeklyGross : 0;
  const raw = earnings * (pct / 100);
  return Math.max(IE_JPRB_MIN_WEEKLY, Math.min(cap, raw));
}

export function jprbHitsCap(weeklyGross: number, band: PrsiBand): boolean {
  return jprbPhasesForBand(band).some((phase) => {
    const earnings = Number.isFinite(weeklyGross) && weeklyGross > 0 ? weeklyGross : 0;
    return earnings * (phase.pct / 100) > phase.cap;
  });
}

export function jprbSchedule(weeklyGross: number, band: PrsiBand): JprbPhase[] {
  let week = 0;
  return jprbPhasesForBand(band).map((phase) => {
    const weekStart = week;
    week += phase.weeks;
    return {
      weekStart,
      weekEnd: week,
      weeklyRate: jprbWeeklyRate(weeklyGross, phase.pct, phase.cap),
    };
  });
}

export function jprbRateAtWeek(weeklyGross: number, band: PrsiBand, localWeek: number): number {
  if (localWeek < 0) return 0;
  const phase = jprbSchedule(weeklyGross, band).find(
    (row) => localWeek >= row.weekStart && localWeek < row.weekEnd,
  );
  return phase?.weeklyRate ?? 0;
}

export function jbDurationWeeks(longRecord = true): number {
  const days = longRecord ? IE_JB_DURATION_LONG_DAYS : IE_JB_DURATION_SHORT_DAYS;
  return Math.round(days / 7);
}

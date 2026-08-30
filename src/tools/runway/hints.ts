import { formatEur } from "@/core/format";
import { jprbHitsCap, jprbSchedule, type PrsiBand } from "@/core/irish-jobseeker-rules";

export const DISCLAIMER =
  "Illustrative only. Type the weekly amount from your letter. This is not a DSP decision.";

export const CASH_HINT =
  "Money you can spend next week. Current accounts and credit union shares count. A house and a pension do not.";

export const NETWORTH_CASH_HINT =
  "Pulls the Cash group from the net worth snapshot. Untick to type a different amount.";

export const TARGET_HINT =
  "How many months you want the cash to last. Need is the smallest starting balance that does not hit zero in that time.";

export const ESSENTIAL_HINT =
  "Untick extras. Lean months and lean need ignore those rows.";

export const PRSI_HINT =
  "Five or more years of paid PRSI: 39 weeks of JPRB. Two to five years: 26 weeks. You can edit the amount after you add the row.";

export const AFTER_JA_HINT =
  "When JPRB ends, add the maximum Jobseeker's Allowance personal rate for your age. DSP may pay less after the means test.";

export const INCOME_SCHEME_LINES = [
  {
    title: "JPRB.",
    body: "First unemployed day on or after 31 March 2025, with enough PRSI. Pay tracks previous earnings.",
  },
  {
    title: "Jobseeker's Benefit.",
    body: "The older flat weekly rate if the claim started before that date.",
  },
  {
    title: "Jobseeker's Allowance.",
    body: "Means-tested. Use this if you do not get JPRB or Benefit, or if it would pay more than those schemes.",
  },
] as const;

export function jprbAmountHint(band: PrsiBand): string {
  if (band === "5plus") {
    return "This box is previous weekly gross pay, not the JPRB payment. Caps are €450 for 13 weeks, then €375, then €300. Floor €125.";
  }
  return "This box is previous weekly gross pay, not the JPRB payment. Cap is €300 for 26 weeks. Floor €125.";
}

export function jprbPayNote(weeklyGross: number, band: PrsiBand): string {
  const rows = jprbSchedule(weeklyGross, band);
  if (band === "5plus" && rows.length >= 3) {
    return `Estimated JPRB: ${formatEur(rows[0].weeklyRate)} a week for 13 weeks, then ${formatEur(rows[1].weeklyRate)}, then ${formatEur(rows[2].weeklyRate)}.`;
  }
  return `Estimated JPRB: ${formatEur(rows[0]?.weeklyRate ?? 0)} a week for 26 weeks.`;
}

export function jprbCapError(weeklyGross: number, band: PrsiBand): string | null {
  if (!jprbHitsCap(weeklyGross, band)) return null;
  if (band === "5plus") {
    return "Gross pay is above the cap. Weekly JPRB cannot exceed €450, then €375, then €300.";
  }
  return "Gross pay is above the cap. Weekly JPRB cannot exceed €300.";
}

export const GROUP_HINT =
  "Groups feed the pie and the stacked bars. Add a group if a bill does not fit.";

export const CHART_RUNWAY_SUMMARY =
  "Cash left at each month-end. Essentials-only ignores unticked rows. The dashed line starts from the target cash.";
export const CHART_RUNWAY_DETAIL =
  "Solid line is the cash you have now. Essentials-only drops rows you did not tick Need. The dashed line starts from the cash the target requires. The vertical mark is that month.";

export const CHART_FLOW_SUMMARY = "Bills by group each month, with income next to them.";
export const CHART_FLOW_DETAIL =
  "Stacked bars are spend. Income is its own series. When JPRB drops, the income bar gets shorter.";

export const CHART_MIX_SUMMARY = "How the first month's bills split by group.";
export const CHART_MIX_DETAIL =
  "Taken from the first month. Empty groups are left out. An annual bill is spread over the year, so it still gets a slice.";

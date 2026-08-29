export const USE_PROFILE_HINT =
  "Uses salary and age from the home-page profile. Turn off to override them for this tool only.";

export const EMPLOYMENT_HINT =
  "My Future Fund is for PAYE employees. Self-employed people cannot join; use the pension tax relief tool for a PRSA or RAC.";

export const TAX_STATUS_HINT =
  "Sets the standard-rate cut-off used to split 20% and 40% relief on the occupational/PRSA side. AE itself gets no income-tax relief.";

export const OTHER_INCOME_HINT =
  "For married / civil partners assessed jointly with two incomes, the extra standard-rate band is the lower of this amount and the max extra in Irish tax bands.";

export const ENROLMENT_YEAR_HINT =
  "Calendar year for this year's rates. Rates follow the scheme (2026–28 at 1.5%, then 3%, 4.5%, 6%), not years of personal membership.";

export const PARTICIPATION_HINT =
  "Stay: full contributions every year. Opt out: months 7–8 window; your contributions are refunded, employer and State stay in the pot, then re-enrolment after 2 years. Suspend: pause after 6 months for 2 years, no refund.";

export const PAYROLL_PENSION_HINT =
  "Tick if this employment already pays into a workplace scheme or employer PRSA. If those rates meet the 1.5% employer / 3.5% total floors, you are exempt from AE.";

export const COMPARE_SCHEME_HINT =
  "Occupational: employer contributions are not a BIK. PRSA: employer contributions above 100% of earnings are a BIK.";

export const COMPARE_PRESET_HINT =
  "Match AE uses this year's AE employee and employer percentages on full salary. Exemption floor is min(1.5%, €1,200) employer and min(3.5%, €2,800) total. Custom lets you type rates.";

export const EMPLOYEE_CONTRIB_HINT =
  "Your contribution into the workplace scheme or PRSA. Gets income-tax relief at your marginal rate. USC and PRSI still apply.";

export const EMPLOYER_CONTRIB_HINT =
  "Employer money into the workplace scheme or PRSA. Does not use your age-related relief cap.";

export const CURRENT_FUND_HINT =
  "Existing pot used only for the growth projection. Drawdown and lump sums are not modelled.";

export const YEARS_HINT =
  "How many more years you keep contributing. Defaults toward State Pension age 66, which is when AE can be accessed.";

export const RETURN_HINT =
  "Nominal annual growth before fees. Both pots grow tax-deferred.";

export const AE_FEE_HINT =
  "Investment management charge on the AE pot. Default 0.04%. The 55 cent weekly admin fee is separate and only applies while contributing.";

export const ALT_FEE_HINT =
  "Annual management / product charge on the occupational or PRSA projection. Typical PRSA charges are much higher than AE.";

export const ADMIN_FEE_HINT =
  "NAERSA weekly admin fee while contributions are being paid. Stops during opt-out gaps and suspension.";

export const DISCLAIMER =
  "Illustrative only, using 2026 Irish My Future Fund and PAYE rules as defaults. Not tax advice. Check myfuturefund.ie and a scheme booklet before acting.";

export const AE_STAT_HINT =
  "AE is My Future Fund, Ireland's auto-enrolment pension. This figure is this year's AE path, not the workplace scheme.";

export const CHART_TAKEHOME_SUMMARY =
  "Where a year's pay goes, with no pension, My Future Fund, and the workplace scheme.";
export const CHART_TAKEHOME_DETAIL =
  "AE is taken from net pay, so the income-tax slice does not shrink. Occupational or PRSA contributions cut income tax only. USC is Universal Social Charge. PRSI is Pay Related Social Insurance. Both still apply.";

export const CHART_YEAR_SUMMARY = "This year's cost and what lands in each pot.";
export const CHART_YEAR_DETAIL =
  "Net cost is the hit to take-home. Employee, employer, and State are the three AE slices. Occupational and PRSA have no State top-up. Into pot is the sum that actually invests.";

export const CHART_SCHEDULE_SUMMARY = "How AE contributions step up on the scheme calendar.";
export const CHART_SCHEDULE_DETAIL =
  "Phases follow the law, not years of membership. Pay is capped at €80,000. From 2035 the total is 14% of assessable pay, split across you, the employer, and the State.";

export const CHART_PROJECTION_SUMMARY = "Both pots grown on the same return, with AE's fees and rate steps.";
export const CHART_PROJECTION_DETAIL =
  "AE uses the calendar rates, the €80,000 cap, 55c a week admin while you pay in, and the AE investment fee. The other line uses the workplace rates and fee you set. Opt-out and suspend only change the AE line.";

export const CHART_WINS_SUMMARY = "Euros into the pot this year per euro of take-home cost, across salary.";
export const CHART_WINS_DETAIL =
  "Higher is better value. The workplace line usually jumps when you cross the standard-rate band. The AE line flattens once pay is above €80,000 because extra salary is ignored.";

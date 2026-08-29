export const USE_PROFILE_HINT =
  "Uses salary and age from the home-page profile. Turn off to override them for this tool only.";

export const EMPLOYMENT_HINT =
  "PAYE employees get relief through payroll (net pay). Self-employed claim via ROS against net relevant earnings. Age bands and the €115,000 cap are the same.";

export const TAX_STATUS_HINT =
  "Sets the standard-rate cut-off used to split 20% and 40% relief. Bands come from Irish tax bands on the home page unless you compare a proposed set below.";

export const OTHER_INCOME_HINT =
  "For married / civil partners assessed jointly with two incomes, the extra standard-rate band is the lower of this amount and the max extra in Irish tax bands.";

export const SPORTSPERSON_HINT =
  "Certain professional sportspersons can claim 30% of net relevant earnings under age 50, instead of the lower age-related percentage.";

export const SCHEME_HINT =
  "Occupational schemes: employer contributions are not a benefit in kind. PRSA/PEPP: employer contributions above 100% of earnings are a BIK from 2025.";

export const EMPLOYEE_CONTRIB_HINT =
  "Your own contributions plus AVCs. Relief is income tax only at your marginal rate. USC and PRSI are still charged on the amount.";

export const EMPLOYER_CONTRIB_HINT =
  "Treated as extra employer money, not salary sacrifice. Employer amounts do not use up your age-related employee cap.";

export const AVC_HINT =
  "Additional voluntary contributions paid by you this year. Counted with employee contributions against the age-related limit.";

export const BROUGHT_FORWARD_HINT =
  "Only contributions you already paid that could not get relief (not unused allowance) carry forward. They still have to fit this year's age-% cap. Unused capacity is lost at year end.";

export const COMPARE_BANDS_HINT =
  "Run the same contributions against a second set of income-tax bands without changing the home-page rates. Useful for Budget what-ifs.";

export const EXTRA_PCT_HINT =
  "Adds this percentage of earnings on top of your current employee contribution for the extra what-if column and take-home chart.";

export const CURRENT_FUND_HINT =
  "Existing pension pot, used only for the growth projection. Drawdown, lump sums, and ARFs are not modelled.";

export const YEARS_HINT =
  "How many more years you keep contributing. Defaults toward State Pension age 66. Age-band percentages step up in the always-max series.";

export const RETURN_HINT =
  "Nominal annual growth before fees. Pension growth is tax-deferred (no 8-year deemed disposal).";

export const FEE_HINT = "Annual management / product charge applied in the projection.";

export const PRSI_USC_NOTE =
  "Employee contributions do not reduce USC or PRSI. Class A PRSI is modelled at 4.2% (rises to 4.35% from 1 October 2026). Redirecting salary as an employer contribution is more efficient because those charges are avoided too.";

export const DISCLAIMER =
  "Illustrative only, using 2026 Irish rules as defaults. Not tax advice. Check a current tax-credit cert and scheme booklet before acting.";

export const CHART_TAKEHOME_SUMMARY = "Where a year's pay goes, with and without the pension.";
export const CHART_TAKEHOME_DETAIL =
  "Each bar is a full year of pay. Take-home is what hits the account. USC is Universal Social Charge. PRSI is Pay Related Social Insurance. Employee pension is your contribution. USC and PRSI do not fall when you pay into a pension.";

export const CHART_INCREASE_SUMMARY = "Tax saved and what the contribution costs you as you raise the %.";
export const CHART_INCREASE_DETAIL =
  "Runs employee contribution from 0% to this year's age cap. Tax saved is income tax avoided. Net cost is what you actually paid after that relief. The kink is where the next euro only gets 20% relief instead of 40%.";

export const CHART_AGE_SUMMARY = "The most you can get income-tax relief on at each age.";
export const CHART_AGE_DETAIL =
  "Irish age-related percentages of earnings, capped at €115,000. Your current band is the one that matches your age. Unused room does not carry forward.";

export const CHART_PROJECTION_SUMMARY = "The pot over time under three contribution habits.";
export const CHART_PROJECTION_DETAIL =
  "Hold current € keeps today's euro amount. Hold current % scales with salary. Always max uses the age-band % and steps up at 30, 40, 50, 55 and 60. Growth is tax-deferred. There is no 8-year deemed disposal on a pension.";

export const CHART_BANDS_SUMMARY = "This year's result on today's tax bands versus the proposed set.";
export const CHART_BANDS_DETAIL =
  "Same contributions. Current bands are the home-page rates. Proposed bands are the what-if you typed. Tax saved, income tax left, and take-home sit side by side.";

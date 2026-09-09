export const USE_PROFILE_HINT =
  "Uses salary and age from the home-page profile. Turn off to override them for this tool only.";

export const TAX_STATUS_HINT =
  "Sets the standard-rate band and the personal tax credit. Married, two incomes also needs the other spouse's pay so the extra band can be sized.";

export const OTHER_INCOME_HINT =
  "The extra standard-rate band for a jointly assessed couple is the lower of this amount and the max extra in Irish tax bands.";

export const RENT_HINT =
  "Private rent on your main home. €2,000 for a single person, €4,000 if you are jointly assessed. It is a credit, so it only helps if you actually owe income tax.";

export const AGE_CREDIT_HINT =
  "€245 if you are 65 or over. Tick it; the engine ignores it before 65.";

export const HOME_CARER_HINT =
  "€1,950 when you are jointly assessed with one income and the other spouse cares for a child or a dependent. Not available on two-income assessment.";

export const INCAPACITATED_CHILD_HINT =
  "€3,800 for a qualifying child. One row covers one child; raise the cert total if you have more.";

export const MEDICAL_CARD_HINT =
  "A full medical card, or age 70+, cuts USC to 2% above €12,012 if total income is €60,000 or less.";

export const CREDIT_OVERRIDE_HINT =
  "Uses the total from your Revenue tax-credit cert instead of the checkboxes. Match the payslip when the cert has credits this form does not list.";

export const EMPLOYEE_CONTRIB_HINT =
  "Taken from cash pay. Only the slice inside this year's age-band cap cuts income tax. USC and PRSI still apply. Percentage is of salary, not of salary plus BIK. Earnings for the cap stop at €115,000.";

export const FLAT_RATE_HINT =
  "Revenue flat-rate expense for some jobs. It reduces income-taxable pay only.";

export const BIK_HEALTH_HINT =
  "Premium your employer pays. Added to pay for income tax, USC, and PRSI. You also get 20% tax relief on that premium. Company-car BIK is not modelled.";

export const BIK_OTHER_HINT =
  "Other taxable benefits (gym, bus, etc.). Added to pay for income tax, USC, and PRSI. No extra credit.";

export const COMPARE_HINT =
  "A second run with a different salary, age, BIK, or employee pension. The current payslip stays as it is.";

export const COMPARE_SALARY_HINT =
  "Gross cash salary in the what-if. 0 keeps the current salary.";

export const COMPARE_PENSION_HINT =
  "Percentage of the what-if salary, or a euro amount. 0 keeps this payslip's contribution. Only the slice inside the what-if age-band cap cuts income tax.";

export const COMPARE_AGE_HINT =
  "Age in the what-if. 0 keeps this payslip's age. The pension relief percentage steps up at 30, 40, 50, 55, and 60. From 70, employee PRSI stops and reduced USC can apply.";

export const PAYSLIP_CUMULATIVE_NOTE =
  "These monthly figures are a full year divided by 12, so a live PAYE slip can disagree because payroll is cumulative and will not match after a raise, a bonus, or a start that was not January.";

export const DISCLAIMER =
  "Illustrative only, using 2026 Class A PAYE rules as defaults. Not tax advice. Check a tax-credit cert and a payslip before acting.";

export const CHART_PAY_SUMMARY = "Where a year's cash salary goes after income tax, USC, PRSI, and pension.";
export const CHART_PAY_DETAIL =
  "Take-home is cash. Benefit in kind is not in this stack. It only shows up as extra tax. Pension is the employee contribution.";

export const CHART_COMPARE_SUMMARY = "Current payslip versus the what-if, stacked the same way.";
export const CHART_COMPARE_DETAIL =
  "Each column is one year of cash salary. The difference in take-home is the number that matters for a raise or a new benefit.";

export const TAKEHOME_HINT =
  "Cash that hits the account in a month, salary minus income tax, USC, PRSI, and employee pension. BIK is not added.";

export const MARGINAL_HINT =
  "Income tax, USC, and PRSI on the next euro of salary, after the 2026 PRSI blend.";

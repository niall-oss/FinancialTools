import type { LearnContent } from "@/learn/types";

export const payeLearn: LearnContent = {
  overview:
    "A Class A payslip in pieces: income tax after credits, USC by band, PRSI, and what a raise or a benefit in kind does to take-home.",
  topics: [
    {
      id: "three-charges",
      title: "Income tax, USC, and PRSI are three bills",
      body: "A payslip takes three charges off gross pay. Income tax uses 20% and 40% bands, then tax credits. USC is a separate charge on gross pay, including most benefits in kind. PRSI is social insurance. Employee pension contributions shrink the income-tax bill, but only up to the age-band cap. They do not shrink USC or PRSI.\n\nCredits never reduce USC or PRSI. If your credits are larger than the income-tax bill, the leftover is unused. It does not become a refund of USC.",
      sourceIds: ["rev-how-tax", "ci-how-tax"],
    },
    {
      id: "pension-cap",
      title: "Pension relief stops at the age-band cap",
      body: "You can pay more than the age-related percentage into a pension. Payroll still takes the extra from take-home. Income-tax relief stops at 15% under 30, then 20%, 25%, 30%, 35%, and 40% from 60. Earnings for that calculation stop at €115,000.\n\nThe extra is not wasted in the pot. It just does not cut this year's income tax. USC and PRSI are charged on the pay either way. The pension tax relief tool sizes the same cap in more detail.",
      sourceIds: ["rev-pension-relief"],
    },
    {
      id: "credits",
      title: "Tax credits versus a tax-credit cert",
      body: "A credit cuts the income-tax bill euro for euro. A single PAYE employee starts with a €2,000 personal credit and a €2,000 employee credit. That is why the first stretch of pay is often income-tax free.\n\nThe checkboxes here fill the common credits: rent, age, home carer, incapacitated child, and the extra credit that comes with single person child carer status. If your Revenue tax-credit cert has a different total, type that figure. Payroll uses the cert, not this form.",
      sourceIds: ["rev-credits", "ci-how-tax"],
    },
    {
      id: "usc",
      title: "USC bands",
      body: "USC starts once income is above €13,000, then it is charged from the first euro. The 2026 bands are 0.5% to €12,012, 2% to €28,700, 3% to €70,044, and 8% after that.\n\nA full medical card, or being 70 or over, cuts the rate above €12,012 to 2% if total income is €60,000 or less. Over €60,000, the ordinary bands apply even with a card.",
      sourceIds: ["rev-usc"],
    },
    {
      id: "prsi",
      title: "Class A PRSI in 2026",
      body: "Most private-sector employees pay Class A. Weekly pay of €352 or less is exempt. Between €352.01 and €424 a tapered €12 credit applies. From age 70 there is no employee PRSI.\n\nThe employee rate is 4.2% until 30 September 2026 and 4.35% from 1 October. This tool uses 39 weeks at 4.2% and 13 weeks at 4.35% for an annual figure. A real payroll week may differ around the changeover.",
      sourceIds: ["ci-prsi"],
    },
    {
      id: "bik",
      title: "Benefit in kind is not extra cash",
      body: "If the employer pays your health insurance, the premium is added to pay for income tax, USC, and PRSI. You still get 20% tax relief on the premium. Take-home cash falls even though the salary figure did not change.\n\nOther benefits work the same way without that 20% credit. Company-car BIK depends on original market value and mileage. That formula is not in this tool.",
      sourceIds: ["rev-bik", "rev-health-insurance"],
    },
    {
      id: "cert",
      title: "How to read a tax-credit cert",
      body: "Revenue issues a tax-credit certificate to your employer. It lists credits, the standard-rate cut-off, and any benefit in kind they know about. Payroll uses that document.\n\nIf this calculator and a recent payslip disagree, put the cert total in and check whether pension and BIK on the slip match the inputs. A cumulative PAYE week can also differ from a simple annual split by 12.",
      sourceIds: ["rev-tcc"],
    },
  ],
  sources: [
    {
      id: "rev-how-tax",
      title: "How your tax is calculated",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/jobs-and-pensions/calculating-your-income-tax/how-your-tax-is-calculated.aspx",
    },
    {
      id: "ci-how-tax",
      title: "How your income tax is calculated",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/tax/income-tax/how-your-tax-is-calculated/",
    },
    {
      id: "rev-credits",
      title: "Personal tax credits, reliefs and exemptions",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/index.aspx",
    },
    {
      id: "rev-usc",
      title: "Universal Social Charge",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/jobs-and-pensions/usc/index.aspx",
    },
    {
      id: "ci-prsi",
      title: "Social insurance classes",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/social-welfare/irish-social-welfare-system/social-insurance-prsi/social-insurance-classes/",
    },
    {
      id: "rev-bik",
      title: "Benefit in kind and expenses",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/jobs-and-pensions/benefit-in-kind-and-expenses/index.aspx",
    },
    {
      id: "rev-health-insurance",
      title: "Tax relief on health insurance",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/health-and-age/health-insurance/index.aspx",
    },
    {
      id: "rev-pension-relief",
      title: "Tax relief limits on pension contributions",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/jobs-and-pensions/pension/relief/tax-relief-limits.aspx",
    },
    {
      id: "rev-tcc",
      title: "Tax credit certificate",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/jobs-and-pensions/tax-credit-certificate/index.aspx",
    },
  ],
};

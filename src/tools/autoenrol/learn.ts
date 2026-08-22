import type { LearnContent } from "@/learn/types";

export const autoenrolLearn: LearnContent = {
  overview:
    "My Future Fund is Ireland's auto-enrolment pension, run by NAERSA from 2026. This calculator sizes this year's contributions, opt-out and suspend paths, and a side-by-side with an occupational scheme or PRSA that does get income-tax relief.",
  topics: [
    {
      id: "who",
      title: "Who is enrolled",
      body: "You are auto-enrolled in an employment if you are a PAYE employee aged 23 to 60, earn at least €20,000 a year across jobs, and that employment is not already paying into a qualifying workplace pension or employer PRSA through payroll.\n\nIf you are 18 to 22, 60 to 66, or under the earnings threshold, you can opt in. Self-employed people cannot join. Use the pension tax relief tool for a PRSA or RAC instead.",
      sourceIds: ["gov-ae", "ci-ae", "mff"],
    },
    {
      id: "match",
      title: "Employee, employer, and State match",
      body: "For every €3 you put in, the employer puts in €3 and the State puts in €1. That is the 3+3+1 design. In 2026 to 2028 the rates are 1.5% employee, 1.5% employer, and 0.5% State. They step up every three years to 3%, then 4.5%, then 6% employee and employer, with the State at a third of the employee rate.\n\nRates follow the calendar, not how long you have been a member. Starting in 2030 still means 2030 rates, not a personal year-one 1.5%.",
      sourceIds: ["gov-ae", "ci-ae"],
    },
    {
      id: "cap",
      title: "The €80,000 cap and the fees",
      body: "Contributions are calculated on gross pay up to €80,000 a year. Earnings above that are ignored for My Future Fund.\n\nThe investment management charge defaults to 0.04% in this tool. NAERSA also takes 55 cent a week in administration while you are contributing. That weekly fee pauses during opt-out gaps and suspension.",
      sourceIds: ["gov-ae", "mff"],
    },
    {
      id: "opt-out",
      title: "Opt out and suspend",
      body: "You must stay in for six months. In months 7 and 8 you can opt out. Your own contributions are refunded. Employer and State money stays in the pot. You are put back in after two years.\n\nSuspend is different. After six months you can pause contributions for up to two years. Nothing is refunded. Use opt-out if you need the cash back. Use suspend if you want to pause without leaving.",
      sourceIds: ["ci-ae", "mff"],
    },
    {
      id: "exemption",
      title: "Workplace scheme exemption",
      body: "If this job already pays into a workplace scheme or employer PRSA, you may be exempt from auto-enrolment. From 2026 the floors are 1.5% employer and 3.5% total, with euro caps of €1,200 employer and €2,800 total.\n\nThe comparison presets in the tool are there to check whether a scheme you already have actually beats those floors, or whether AE would still apply.",
      sourceIds: ["gov-ae", "ci-ae"],
    },
    {
      id: "no-relief",
      title: "No income-tax relief on AE itself",
      body: "My Future Fund does not give income-tax relief on your contribution. The State top-up is the subsidy instead. USC and PRSI still apply to the pay the contribution comes from.\n\nAn occupational scheme or PRSA does give marginal-rate income-tax relief on employee contributions. That is why the comparison exists. AE can still win on fees and on the employer-plus-State match, especially early on. Run both sides rather than assuming one is always cheaper.",
      sourceIds: ["ci-ae", "ci-pension-relief"],
    },
  ],
  sources: [
    {
      id: "gov-ae",
      title: "Auto-enrolment",
      publisher: "gov.ie",
      url: "https://www.gov.ie/en/department-of-social-protection/campaigns/auto-enrolment/",
    },
    {
      id: "mff",
      title: "My Future Fund",
      publisher: "NAERSA",
      url: "https://www.myfuturefund.ie/",
    },
    {
      id: "ci-ae",
      title: "Auto-enrolment pension, MyFutureFund",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/personal-finance/pensions/auto-enrolment/",
    },
    {
      id: "ci-pension-relief",
      title: "Tax relief on pensions",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/personal-finance/pensions/tax-relief-on-pensions/",
    },
  ],
};

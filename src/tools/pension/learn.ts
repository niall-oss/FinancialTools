import type { LearnContent } from "@/learn/types";

export const pensionLearn: LearnContent = {
  overview:
    "This calculator shows how much of your contribution gets income-tax relief under Irish age bands, what that saves you this year, and how extra contributions might grow. It does not model drawdown, lump sums, or ARFs.",
  topics: [
    {
      id: "age-bands",
      title: "Age bands and the €115,000 cap",
      body: "Relief is a percentage of your earnings, and the percentage steps up with age: 15% under 30, then 20%, 25%, 30%, 35%, and 40% from 60. Earnings for this calculation are capped at €115,000, so a €200,000 salary does not unlock a €200,000 allowance.\n\nCertain professional sportspersons can use 30% before age 50 if that is higher than their age band. Employer contributions to an occupational scheme do not use up your personal percentage.",
      sourceIds: ["rev-relief-limits", "ci-pension-relief"],
    },
    {
      id: "income-tax-only",
      title: "Relief is income tax only",
      body: "You get relief at your marginal income-tax rate, 20% or 40%. USC and PRSI are still charged on the amount you contribute. On a 40% taxpayer the net saving is not 40% of the contribution once those two are counted.\n\nRedirecting salary as an employer contribution is more efficient because USC and PRSI are avoided too. That is a payroll design choice, not something this tool can invent for you.",
      sourceIds: ["ci-pension-relief"],
    },
    {
      id: "paye-vs-self",
      title: "PAYE and self-employed",
      body: "PAYE employees usually get the relief through payroll, as net pay. Self-employed people claim through ROS against net relevant earnings. The age bands and the €115,000 cap are the same either way.\n\nIf payroll is not applying relief, you claim it on a return. The calculator does not file anything. It only sizes the relief.",
      sourceIds: ["rev-relief-limits", "ci-pension-relief"],
    },
    {
      id: "occupational-prsa",
      title: "Occupational schemes and PRSAs",
      body: "In an occupational scheme, employer contributions are not a benefit in kind. On a PRSA or PEPP, employer contributions above 100% of earnings are a BIK from 2025. That is why the scheme type in the tool changes the comparison.\n\nYour own contributions plus AVCs count against the age-related cap. Employer money into an occupational scheme does not.",
      sourceIds: ["rev-relief-limits", "ci-pension-relief"],
    },
    {
      id: "headroom",
      title: "Unused headroom is not carry-forward",
      body: "If you contribute less than your age-band maximum this year, the unused capacity is lost at year end. You cannot bank it.\n\nWhat can carry forward is a contribution you already paid that did not get relief, still subject to this year's age-percentage cap. Those are easy to mix up. The tool treats them as different inputs because they are.",
      sourceIds: ["rev-relief-limits"],
    },
    {
      id: "what-if",
      title: "What the extra contribution chart is for",
      body: "The extra-percentage column asks what happens if you pay more this year, including a step up when you cross an age band. Growth in the projection is tax-deferred. There is no eight-year deemed disposal inside a pension.\n\nDrawdown, tax-free lump sums, and ARF imputed distributions are out of scope. The chart is about accumulation, not retirement income.",
      sourceIds: ["ci-pension-relief"],
    },
  ],
  sources: [
    {
      id: "rev-relief-limits",
      title: "Tax relief limits on pension contributions",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/jobs-and-pensions/pension/relief/tax-relief-limits.aspx",
    },
    {
      id: "ci-pension-relief",
      title: "Tax relief on pensions",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/personal-finance/pensions/tax-relief-on-pensions/",
    },
  ],
};

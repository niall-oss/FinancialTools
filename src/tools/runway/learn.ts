import type { LearnContent } from "@/learn/types";

export const runwayLearn: LearnContent = {
  overview:
    "How long this cash lasts once you subtract income you still get. And how much cash you would need for it to last a number of months you pick, 6 by default.",
  topics: [
    {
      id: "runway",
      title: "Months until the account hits zero",
      body: "Add up monthly bills. Subtract money still coming in. Divide the cash you can actually spend by that net gap. That is how many months until the account is empty.\n\nA house and a pension do not count. If you cannot pay rent from it next week, it is not the runway.",
      sourceIds: ["ci-saving"],
    },
    {
      id: "size-the-pot",
      title: "How much for 3 or 6 months",
      body: "People often aim for 3 or 6 months of expenses. That ignores income that continues after a job ends. It also ignores Jobseeker's Pay-Related Benefit dropping every 13 weeks.\n\nThis page adds up the weekly gaps. If later months cost more because JPRB stepped down, you need more than six times the first month's gap. If income covers the bills, need is €0. Extra cushion is up to you.",
      sourceIds: ["ci-saving", "ci-jprb"],
    },
    {
      id: "essentials",
      title: "Essentials versus the rest",
      body: "Tick Need on rent, food, heat, and loan payments. Leave subscriptions and takeaways off.\n\nLean months uses only the ticked rows. That is the version you would live on if the job search ran long. The cut list ranks each bill by how many months you gain if you drop it.",
      sourceIds: ["ci-saving"],
    },
    {
      id: "jprb-ja-jb",
      title: "JPRB, Allowance, and the old Benefit",
      body: "If your first unemployed day is on or after 31 March 2025, the main PRSI payment is Jobseeker's Pay-Related Benefit. It tracks previous gross earnings, with a floor of €125 a week. Five or more years of contributions pay 39 weeks: 60% of earnings for 13 weeks, then 55% for 13, then 50% for 13, each step capped. Two to five years pays 26 weeks at 50%, capped at €300.\n\nJobseeker's Benefit is the older flat-rate scheme for claims that started before that date. The 2026 maximum personal rate is €254 a week, for 9 or 6 months depending on contributions.\n\nJobseeker's Allowance is means-tested. You can claim it if you do not qualify for JPRB or Benefit, or if Optional Allowance would pay more. The buttons here fill the published maximum for your age. They do not decide if you qualify.",
      sourceIds: ["ci-jprb", "gov-jprb", "ci-ja", "ci-jb", "ci-rates-2026"],
    },
    {
      id: "means-test",
      title: "This is not a means test",
      body: "Jobseeker's Allowance looks at your income, your partner's income, and capital. Savings over €20,000 can cut the award. The emergency fund itself can count as capital.\n\nType the weekly amount from a decision letter if you have one. The preset is the published maximum, not your award.",
      sourceIds: ["ci-ja"],
    },
    {
      id: "other-income",
      title: "Other money that still comes in",
      body: "Child Benefit is €140 a month per child, job or no job. One row per child, or one row with the total.\n\nPartner pay, rent you collect, dividends, and part-time work all go in as income. Rent Supplement depends on county rent limits, so type the weekly figure you were given.\n\nFuel Allowance, the Christmas bonus, and a medical card are not in the calculator. A redundancy lump sum belongs in starting cash.",
      sourceIds: ["ci-child-benefit", "ci-unemployed"],
    },
    {
      id: "apply",
      title: "Apply on the first day",
      body: "Jobseeker's Allowance and Benefit usually skip the first 3 days. JPRB starts the Monday after the job ends. Late claims are hard to backdate.\n\nApply on MyWelfare.ie the day you finish. This page does not send a claim.",
      sourceIds: ["ci-ja", "ci-jprb", "gov-jprb"],
    },
  ],
  sources: [
    {
      id: "ci-jprb",
      title: "Jobseeker's Pay-Related Benefit",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/social-welfare/unemployed-people/jobseekers-pay-related-benefit/",
    },
    {
      id: "gov-jprb",
      title: "Jobseeker's Pay-Related Benefit",
      publisher: "Department of Social Protection",
      url: "https://www.gov.ie/en/department-of-social-protection/services/jobseekers-pay-related-benefit/",
    },
    {
      id: "ci-ja",
      title: "Jobseeker's Allowance",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/social-welfare/unemployed-people/jobseekers-allowance/",
    },
    {
      id: "ci-jb",
      title: "Jobseeker's Benefit",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/social-welfare/unemployed-people/jobseekers-benefit/",
    },
    {
      id: "ci-child-benefit",
      title: "Child Benefit",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/social-welfare/families-and-children/child-benefit/",
    },
    {
      id: "ci-unemployed",
      title: "Payments for unemployed people",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/social-welfare/unemployed-people/",
    },
    {
      id: "ci-rates-2026",
      title: "Social welfare rates 2026",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/budgets/social-welfare-rates-announced-in-budget-2026/",
    },
    {
      id: "ci-saving",
      title: "Interest on loans and savings",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/personal-finance/savings-and-investments/interest-on-loans-and-savings/",
    },
  ],
};

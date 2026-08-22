import type { LearnContent } from "@/learn/types";

export const networthLearn: LearnContent = {
  overview:
    "This is a current-position list, not a forecast. You type what you own and what you owe. The charts split that list by group and by how easy the money is to reach. Nothing here is a valuation or advice.",
  topics: [
    {
      id: "snapshot",
      title: "A snapshot is not cash",
      body: "Net worth is assets minus liabilities on the day you fill it in. A house and a pension can make the number look large while the current account is thin.\n\nUse this page to see the mix. Do not treat the headline as money you can spend this month.",
      sourceIds: ["ci-saving", "cbi-hfcs"],
    },
    {
      id: "pensions",
      title: "Pensions are not spendable",
      body: "Occupational pots, PRSAs, and similar funds count as assets, but you cannot draw them like a deposit. Access rules, tax, and retirement age sit in front of that money.\n\nThe access chart puts pensions in locked for that reason. Cash and investments sit in accessible.",
      sourceIds: ["ci-pensions"],
    },
    {
      id: "property",
      title: "Property is an estimate",
      body: "Put in what you think the home would sell for, not what you paid, and not what is left on the mortgage. The mortgage is a separate liability.\n\nA sale would also take costs, time, and tax. The tool does not deduct those. Treat the property slice as a rough stock, not proceeds in hand.",
      sourceIds: ["ci-saving", "cbi-hfcs"],
    },
    {
      id: "groups",
      title: "Why groups exist",
      body: "Each row has a group so the donuts and the mix bar have categories to add up. Keep names short. Add a group if the presets miss something you care about, such as crypto or a credit union share account.\n\nZero rows stay in the form as blanks. They drop out of totals and charts until you type an amount.",
      sourceIds: ["cbi-hfcs"],
    },
  ],
  sources: [
    {
      id: "ci-saving",
      title: "Interest on loans and savings",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/personal-finance/savings-and-investments/interest-on-loans-and-savings/",
    },
    {
      id: "ci-pensions",
      title: "Introduction to pensions",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/personal-finance/pensions/introduction-to-pensions/",
    },
    {
      id: "cbi-hfcs",
      title: "The evolution of Irish household wealth",
      publisher: "Central Bank of Ireland",
      url: "https://www.centralbank.ie/statistics/statistical-publications/behind-the-data/the-evolution-of-irish-household-wealth",
    },
  ],
};

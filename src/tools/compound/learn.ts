import type { LearnContent } from "@/learn/types";

export const compoundLearn: LearnContent = {
  overview:
    "Projects a lump sum plus monthly contributions, with Irish tax and an annual fee. The chart shows the pot in euros and in today's purchasing power.",
  topics: [
    {
      id: "compounding",
      title: "What compounding is",
      body: "Compounding is growth on growth. A 7% return on €10,000 is €700. Next year that €700 earns too, so the same 7% is applied to a larger pot.\n\nTime does most of the work. Thirty years of contributions look boring in year two and slightly alarming in year twenty-eight. That is the point of the chart.",
      sourceIds: [],
    },
    {
      id: "fees",
      title: "Fees eat the rate you actually compound at",
      body: "The advertised return is not what compounds. A 0.5% annual fee on a 7% growth assumption leaves you compounding closer to 6.5%. Over 30 years that gap is large.\n\nThe tool subtracts the fee each year before growth. It is a flat percentage of the pot, not a full product charge schedule with dealing fees and exit charges.",
      sourceIds: [],
    },
    {
      id: "inflation",
      title: "Inflation and what a euro will buy",
      body: "Nominal is the euro amount on the statement. Real is what those euros buy in today's money. The chart shows both.\n\nTax still hits the nominal path. Deemed disposal, CGT, and income tax are levied on euro gains, not on purchasing power. The inflation rate only deflates the year-end pot after tax and fees.\n\nThe default 2.5% is a modelling assumption, not a forecast. Raise it if you want a harsher real-terms picture.",
      sourceIds: [],
    },
    {
      id: "deemed-disposal",
      title: "Deemed disposal on funds",
      body: "Most Irish and EU-domiciled funds are taxed as investment undertakings, not as shares. That includes the UCITS ETFs Irish residents typically buy. Every eight years Revenue treats you as if you sold, even if you still hold the units. That is deemed disposal.\n\nThe tax is exit tax. From 1 January 2026 the rate for individuals is 38%. It was 41%. You pay on the paper gain at each eight-year mark, then your cost basis steps up. You can owe cash when you have not sold anything.\n\nThis tool defaults to 38% every 8 years. Real lots bought on different dates have different clocks. Read the Revenue manuals if you are close to an anniversary.",
      sourceIds: ["rev-exit-tax-tdm", "rev-ebrief-016-26"],
    },
    {
      id: "cgt",
      title: "CGT on shares",
      body: "Company shares are different. You pay Capital Gains Tax when you actually sell, at 33% for most gains. The first €1,270 of chargeable gains in a year is exempt.\n\nThis tool applies a single CGT rate to the gain at the end of the horizon. It does not model the annual exemption or losses, so it will usually overstate the tax a little. That is still the right comparison against deemed disposal, where the eight-year bills add up.",
      sourceIds: ["rev-cgt", "ci-cgt"],
    },
    {
      id: "income-tax",
      title: "Income tax on gains",
      body: "Some investment returns are taxed as income at 20% and 40%, not as CGT. Use this mode when that is the right treatment, rather than deemed disposal or CGT on exit.\n\nIf you tick income tax from profile, the tool fills whatever is left of your standard-rate band after salary, then taxes the rest at 40%. That is a sketch of PAYE, not a full tax return.",
      sourceIds: ["ci-income-tax"],
    },
  ],
  sources: [
    {
      id: "rev-exit-tax-tdm",
      title: "Investment undertakings, including deemed disposal",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/tax-professionals/tdm/income-tax-capital-gains-tax-corporation-tax/part-27/27-01a-02.pdf",
    },
    {
      id: "rev-ebrief-016-26",
      title: "Exit tax rate reduced to 38% from 2026",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/tax-professionals/ebrief/2026/no-0162026.aspx",
    },
    {
      id: "rev-cgt",
      title: "Capital Gains Tax on the disposal of an asset",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/gains-gifts-and-inheritance/transfering-an-asset/index.aspx",
    },
    {
      id: "ci-cgt",
      title: "Capital Gains Tax",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/tax/capital-taxes/capital-gains-tax/",
    },
    {
      id: "ci-income-tax",
      title: "How your income tax is calculated",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/money-and-tax/tax/income-tax/how-your-tax-is-calculated/",
    },
  ],
};

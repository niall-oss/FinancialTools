import type { LearnContent } from "@/learn/types";

export const mortgageLearn: LearnContent = {
  overview:
    "This calculator estimates how much you can borrow under Central Bank limits, what the monthly repayment looks like, and the extra costs of buying in Ireland. The limits are caps, not a promise a lender will offer that amount.",
  topics: [
    {
      id: "lti-ltv",
      title: "Borrowing limits, LTI and LTV",
      body: "The Central Bank caps how large a mortgage can be relative to your income and the property price. Loan-to-income is 4 times gross income for a first-time buyer and 3.5 times for a second or subsequent buyer. Buy-to-let has no LTI cap in these rules, but a much tighter loan-to-value.\n\nLoan-to-value is 90% for owner-occupiers, so you need at least 10% deposit, and 70% for buy-to-let, so 30% down. Lenders may exceed the limits for a slice of new lending. That exception is discretionary. Do not budget as if you will get it.\n\nA lender still has to test whether you can actually pay. Existing loans, childcare, and other commitments can cut the offer well below the Central Bank ceiling.",
      sourceIds: ["cbi-mortgage-measures", "ci-mortgage"],
    },
    {
      id: "stress-test",
      title: "The stress test",
      body: "Before they lend, banks have to check the repayment still works if the rate rises. The usual test is your offer rate plus 2%, with a floor around 5%.\n\nA cheap tracker or a short discount rate can look affordable today and fail the stress test. The tool uses that buffer so the monthly figure is not the most optimistic one on the sheet.",
      sourceIds: ["cbi-mortgage-measures"],
    },
    {
      id: "htb",
      title: "Help to Buy",
      body: "Help to Buy refunds Irish income tax and DIRT you paid in the previous four years, to help with the deposit on a new home. The cap is the lowest of €30,000, 10% of the price, or tax actually paid. The property must be a new build at or under €500,000, you must live in it, and the mortgage must be at least 70% of the price.\n\nIt does not apply to second-hand homes. The refund is not free money from a separate pot. It is tax you already paid, coming back.",
      sourceIds: ["rev-htb", "ci-htb"],
    },
    {
      id: "fhs",
      title: "First Home Scheme",
      body: "The First Home Scheme is shared equity on a new build. The State and participating lenders take a stake of up to 30% of the price, or 20% if you also use Help to Buy, so your mortgage can be smaller. The minimum stake is €10,000 or 2.5% of the price, whichever is higher.\n\nYou have to take the maximum mortgage the participating lender will give you. You can buy the equity back later. It does not cut stamp duty. The official scheme site is the place to check price caps and participating lenders, which change.",
      sourceIds: ["fhs", "ci-fhs"],
    },
    {
      id: "stamp-duty",
      title: "Stamp duty",
      body: "Residential stamp duty from 2 October 2024 is 1% on the first €1 million, 2% on the next €500,000, and 6% above €1.5 million.\n\nOn a new build, duty is calculated on the price excluding 13.5% VAT. That is why a new home and a second-hand home at the same sticker price do not cost the same in stamp duty. Budget for it. It is due when you complete, not with the monthly mortgage.",
      sourceIds: ["rev-stamp", "ci-buying-costs"],
    },
    {
      id: "ber",
      title: "BER and green mortgage rates",
      body: "A Building Energy Rating is the official energy label for a home. SEAI is moving to a simpler A0 to G scale from May 2026. Older A1 to B3 certificates stay valid until they expire.\n\nSome lenders cut the fixed rate if the BER is strong enough, often B3 equivalent or better. Products are usually fixed. Switching early can mean breakage fees. The discount in this tool is a typical BER-based reduction unless you type your lender's actual figure.",
      sourceIds: ["seai-ber"],
    },
    {
      id: "lpt",
      title: "Local Property Tax",
      body: "LPT is an annual charge based on the property's market value on the valuation date. The 2026 to 2030 bands are what this tool uses. Local authorities can vary the national basic rate by up to 15% either way. Several Dublin councils add the full 15%.\n\nIt is not part of the mortgage, but it is a yearly cost of owning the house. Ignore it and the cash-flow picture is too kind.",
      sourceIds: ["rev-lpt"],
    },
    {
      id: "overpay",
      title: "Overpayments",
      body: "Extra monthly payments or a lump sum cut the interest you pay and can shorten the term. On a variable rate this is usually straightforward. On a fixed rate, check breakage fees before you overpay.\n\nThe tool can start the extra from a later year, which is useful if you expect a raise or a bonus rather than spare cash from day one.",
      sourceIds: ["ci-mortgage"],
    },
  ],
  sources: [
    {
      id: "cbi-mortgage-measures",
      title: "Mortgage measures",
      publisher: "Central Bank of Ireland",
      url: "https://www.centralbank.ie/financial-system/financial-stability/macro-prudential-policy/mortgage-measures",
    },
    {
      id: "ci-mortgage",
      title: "Taking out a mortgage",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/housing/owning-a-home/help-with-buying-a-home/taking-out-a-mortgage/",
    },
    {
      id: "rev-htb",
      title: "Help to Buy scheme",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/property/help-to-buy-incentive/index.aspx",
    },
    {
      id: "ci-htb",
      title: "Help to Buy scheme",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/housing/owning-a-home/help-with-buying-a-home/help-to-buy-scheme/",
    },
    {
      id: "fhs",
      title: "First Home Scheme",
      publisher: "First Home Scheme",
      url: "https://www.firsthomescheme.ie/",
    },
    {
      id: "ci-fhs",
      title: "First Home Scheme",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/housing/owning-a-home/help-with-buying-a-home/first-home-scheme/",
    },
    {
      id: "rev-stamp",
      title: "Stamp duty rates on property",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/property/stamp-duty/property/stamp-duty-property/rates.aspx",
    },
    {
      id: "ci-buying-costs",
      title: "Costs of buying a home",
      publisher: "Citizens Information",
      url: "https://www.citizensinformation.ie/en/housing/owning-a-home/buying-a-home/costs-of-buying-a-home/",
    },
    {
      id: "seai-ber",
      title: "Building Energy Rating",
      publisher: "SEAI",
      url: "https://www.seai.ie/ber",
    },
    {
      id: "rev-lpt",
      title: "Local Property Tax liability",
      publisher: "Revenue",
      url: "https://www.revenue.ie/en/property/local-property-tax/lpt-liability/index.aspx",
    },
  ],
};

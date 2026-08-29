export const BUYER_TYPE_HINT =
  "First-time buyer means you have never held a residential mortgage. Second or subsequent means you have. Buy-to-let is an investment property and the LTV is tighter.";

export const PROPERTY_TYPE_HINT =
  "New builds qualify for Help to Buy and First Home Scheme. Stamp duty on a new build is on the price excluding 13.5% VAT.";

export const DEPOSIT_PCT_HINT =
  "Percentage or euro amount. Central Bank rules want at least 10% for an owner-occupier, 30% for buy-to-let.";

export const INTEREST_RATE_HINT =
  "Rate before any green discount. This is the opening period rate.";

export const RATE_SCHEDULE_HINT =
  "Most Irish mortgages fix for a few years, then go variable. Add later periods to forecast that. You can change the rate at most once per year. Only variable years move in the +1% / −1% interest chart. Later rates are a guess, not a quote.";

export const GREEN_MORTGAGE_HINT =
  "Some lenders cut the fixed rate if the BER is A0, A, or B. Products are usually fixed. Switching early can mean breakage fees.";

export const BER_RATING_HINT =
  "Building Energy Rating from SEAI. From May 2026 the scale is A0 to G. Older A1 to B3 certificates stay valid until they expire. Most lenders want B3 equivalent or better.";

export const GREEN_DISCOUNT_OVERRIDE_HINT =
  "Leave at −1 to use the BER-based discount. Type a value if you know your lender's exact cut.";

export const TERM_YEARS_HINT =
  "Irish mortgages often run 25 to 35 years. A longer term lowers the monthly payment and raises the interest you pay.";

export const USE_PROFILE_SALARY_HINT =
  "Uses your profile salary for borrowing capacity. Add a second applicant salary for a joint application.";

export const SECOND_SALARY_HINT =
  "Joint applications use combined gross income for the loan-to-income limit.";

export const MONTHLY_COMMITMENTS_HINT =
  "Existing loans, childcare, and other regular costs. Lenders take these off disposable income when they test affordability.";

export const STRESS_TEST_HINT =
  "Lenders have to test the repayment at your offer rate plus 2%, with a floor around 5%.";

export const MPE_HINT =
  "Lenders may exceed LTI and LTV limits for up to 15% of new lending. That exception is discretionary. Do not budget as if you will get it.";

export const BRIDGING_LOAN_HINT =
  "Bridging loans on a principal home of 18 months or less are exempt from LTI limits from April 2026. LTV limits still apply.";

export const HTB_HINT =
  "Help to Buy refunds income tax and DIRT you paid, up to €30,000 or 10% of the price, on a new build at or under €500,000. The mortgage must be at least 70% of the price.";

export const HTB_REFUND_HINT =
  "Your estimate based on tax paid in the prior 4 years. Revenue caps at €30,000, 10% of the price, or tax actually paid.";

export const FHS_HINT =
  "Shared equity on a new build, up to 30% of the price, or 20% if you also use Help to Buy. You have to take the maximum mortgage a participating lender will give you.";

export const FHS_EQUITY_HINT =
  "State and lender stake in the home. Minimum is €10,000 or 2.5% of the price. It cuts the mortgage, not stamp duty.";

export const SOLICITOR_FEE_HINT =
  "Conveyancing is often €1,500 to €3,000 plus 23% VAT. Ask for a fixed-price quote.";

export const VALUATION_FEE_HINT =
  "The lender's valuation report. Often €150 to €250.";

export const SURVEY_FEE_HINT =
  "Structural survey or new-build snag list. Not required by the Central Bank rules.";

export const MORTGAGE_PROTECTION_HINT =
  "Life cover that clears the mortgage if you die. The lender can require it. They cannot force you to buy theirs.";

export const HOME_INSURANCE_HINT =
  "Buildings insurance, required by the lender. Often €300 to €800 a year, depending on cover.";

export const LPT_ADJUSTMENT_HINT =
  "Local Property Tax. Councils can vary the national basic rate by up to 15% either way. Several Dublin councils add the full 15%. The yearly charge after this % is the LPT (annual) figure on the right.";

export const LPT_ANNUAL_HINT =
  "Local Property Tax. Yearly Revenue charge on the home's value, from the 2026–2030 bands, then your council's %.";

export const HTB_APPLIED_HINT =
  "Help to Buy. The refund actually used against cash at completion, after Revenue caps.";

export const FHS_EQUITY_STAT_HINT =
  "First Home Scheme. The State's equity stake, which cuts the mortgage, not stamp duty.";

export const OVERPAYMENT_HINT =
  "Extra payments cut the interest you pay and can shorten the term. On a fixed rate, check breakage fees first.";

export const OVERPAYMENT_MONTHLY_START_HINT =
  "Year the extra monthly payment starts. 1 means from the start. Type 4 to begin in year 4.";

export const OVERPAYMENT_LUMP_SUM_START_HINT =
  "Year the lump sum is applied. 1 means at the start. Type 4 to pay it at the beginning of year 4.";

export const LTI_HINT =
  "Maximum loan as a multiple of gross annual income. 4 times for a first-time buyer, 3.5 times for a second or subsequent buyer.";

export const LTV_HINT =
  "Maximum mortgage as a share of the property price. 90% for an owner-occupier, 70% for buy-to-let. That sets the minimum deposit.";

export const DISCLAIMER =
  "Illustrative only; not mortgage advice. Lenders apply individual credit policies and net disposable income tests.";

export const CHART_AMORTIZATION_SUMMARY =
  "Each year, how much of your payment reduces the loan versus interest.";
export const CHART_AMORTIZATION_DETAIL =
  "Amortization is that split. Early years are mostly interest. Later years pay down more of the loan. The two areas add up to what you paid that year.";

export const CHART_BALANCE_SUMMARY = "What you still owe at the end of each year.";
export const CHART_BALANCE_DETAIL =
  "Starts at the loan amount and falls as you pay principal. Overpayments and a rate step change the slope.";

export const CHART_PAYDOWN_SUMMARY =
  "How fast the balance falls, with and without extra payments if you set them.";
export const CHART_PAYDOWN_DETAIL =
  "With an overpayment, two lines compare the remaining balance. Without one, the line is that year's principal as a share of the opening balance.";

export const CHART_PRINCIPAL_SUMMARY = "How much of the loan you actually paid off each year.";
export const CHART_PRINCIPAL_DETAIL =
  "This is principal only, not interest. Extra monthly or lump-sum payments show as a second series when you set them.";

export const CHART_UPFRONT_SUMMARY = "Cash you need at purchase, besides the ongoing mortgage.";
export const CHART_UPFRONT_DETAIL =
  "Deposit, stamp duty, and fees (solicitor, valuation, survey, land registry). Help to Buy can cut the cash you bring.";

export const CHART_INTEREST_SUMMARY =
  "Annual interest on your rates, and if variable years move 1% either way.";
export const CHART_INTEREST_DETAIL =
  "Your rates uses the periods you set. The other two lines add or subtract 1% on variable years only. Fixed years do not move. That is the rate-risk picture after a fix ends.";

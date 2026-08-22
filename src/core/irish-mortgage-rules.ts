/** Central Bank of Ireland mortgage measures (2023 framework, 2026 bridging update). */

export type BuyerType = "ftb" | "ssb" | "btl";

export const LTI_MULTIPLE: Record<BuyerType, number | null> = {
  ftb: 4,
  ssb: 3.5,
  btl: null,
};

export const LTV_MAX_PCT: Record<BuyerType, number> = {
  ftb: 90,
  ssb: 90,
  btl: 70,
};

/** Minimum deposit % implied by LTV limits (Central Bank). */
export function getMinDepositPct(buyerType: BuyerType): number {
  return 100 - LTV_MAX_PCT[buyerType];
}

/** Typical FTB exception ceiling (discretionary, max 15% of lender book). */
export const MPE_LTI_MULTIPLE_FTB = 4.75;
export const MPE_LTI_MULTIPLE_SSB = 4;

export const HTB_MAX_REFUND = 30_000;
export const HTB_MAX_PROPERTY_PRICE = 500_000;
export const HTB_MIN_MORTGAGE_LTV_PCT = 70;

export const FHS_MAX_EQUITY_PCT = 30;
export const FHS_MAX_EQUITY_WITH_HTB_PCT = 20;
export const FHS_MIN_EQUITY_EUR = 10_000;
export const FHS_MIN_EQUITY_PCT = 2.5;

export const STRESS_BUFFER_PCT = 2;
export const STRESS_RATE_FLOOR_PCT = 5;

export type BindingConstraint = "lti" | "ltv" | "none";

export interface BorrowingCapacityInput {
  buyerType: BuyerType;
  grossIncome: number;
  propertyPrice: number;
  depositPct: number;
  assumeMpe?: boolean;
  isBridgingLoan?: boolean;
}

export interface BorrowingCapacityResult {
  maxLoanByLti: number | null;
  maxLoanByLtv: number;
  maxLoanAllowed: number;
  maxLoanMpe: number | null;
  ltiMultiple: number | null;
  ltvMaxPct: number;
  depositAmount: number;
  loanAmount: number;
  ltvPct: number;
  bindingConstraint: BindingConstraint;
  passesCentralBankRules: boolean;
  maxPropertyPriceAtDeposit: number;
}

export function calculateBorrowingCapacity(input: BorrowingCapacityInput): BorrowingCapacityResult {
  const ltiMultiple = input.isBridgingLoan ? null : LTI_MULTIPLE[input.buyerType];
  const ltvMaxPct = LTV_MAX_PCT[input.buyerType];

  const maxLoanByLti =
    ltiMultiple === null ? null : input.grossIncome * ltiMultiple;
  const maxLoanByLtv = input.propertyPrice * (ltvMaxPct / 100);

  const maxLoanAllowed =
    maxLoanByLti === null ? maxLoanByLtv : Math.min(maxLoanByLti, maxLoanByLtv);

  let maxLoanMpe: number | null = null;
  if (input.assumeMpe && input.buyerType !== "btl" && !input.isBridgingLoan) {
    const mpeMultiple =
      input.buyerType === "ftb" ? MPE_LTI_MULTIPLE_FTB : MPE_LTI_MULTIPLE_SSB;
    maxLoanMpe = Math.min(input.grossIncome * mpeMultiple, maxLoanByLtv);
  }

  const depositAmount = input.propertyPrice * (input.depositPct / 100);
  const loanAmount = input.propertyPrice - depositAmount;
  const ltvPct = input.propertyPrice > 0 ? (loanAmount / input.propertyPrice) * 100 : 0;

  let bindingConstraint: BindingConstraint = "none";
  if (maxLoanByLti !== null) {
    bindingConstraint = maxLoanByLti <= maxLoanByLtv ? "lti" : "ltv";
  } else {
    bindingConstraint = "ltv";
  }

  const passesCentralBankRules = loanAmount <= maxLoanAllowed + 0.01;

  const maxPropertyPriceAtDeposit =
    ltiMultiple === null
      ? input.propertyPrice
      : Math.min(
          (input.grossIncome * ltiMultiple) / (1 - input.depositPct / 100),
          input.propertyPrice,
        );

  return {
    maxLoanByLti,
    maxLoanByLtv,
    maxLoanAllowed,
    maxLoanMpe,
    ltiMultiple,
    ltvMaxPct,
    depositAmount,
    loanAmount,
    ltvPct,
    bindingConstraint,
    passesCentralBankRules,
    maxPropertyPriceAtDeposit,
  };
}

export function calculateStressRatePct(offerRatePct: number): number {
  return Math.max(offerRatePct + STRESS_BUFFER_PCT, STRESS_RATE_FLOOR_PCT);
}

/** Property Registration Authority fee tiers (approximate). */
export function calculateLandRegistryFee(propertyPrice: number): number {
  if (propertyPrice <= 200_000) return 600;
  if (propertyPrice <= 400_000) return 700;
  return 800;
}

export interface HtbResult {
  eligible: boolean;
  appliedAmount: number;
  cappedAmount: number;
  warnings: string[];
}

export function calculateHelpToBuy(input: {
  useHelpToBuy: boolean;
  propertyType: "new_build" | "second_hand";
  propertyPrice: number;
  htbRefundEstimate: number;
  mortgageLtvPct: number;
}): HtbResult {
  const warnings: string[] = [];
  if (!input.useHelpToBuy) {
    return { eligible: false, appliedAmount: 0, cappedAmount: 0, warnings };
  }

  if (input.propertyType !== "new_build") {
    warnings.push("Help to Buy applies to new builds and self-builds only.");
    return { eligible: false, appliedAmount: 0, cappedAmount: 0, warnings };
  }

  if (input.propertyPrice > HTB_MAX_PROPERTY_PRICE) {
    warnings.push(`Help to Buy is limited to properties up to €${HTB_MAX_PROPERTY_PRICE.toLocaleString("en-IE")}.`);
    return { eligible: false, appliedAmount: 0, cappedAmount: 0, warnings };
  }

  const capByPrice = input.propertyPrice * 0.1;
  const cappedAmount = Math.min(HTB_MAX_REFUND, capByPrice, Math.max(0, input.htbRefundEstimate));

  if (input.mortgageLtvPct < HTB_MIN_MORTGAGE_LTV_PCT) {
    warnings.push(`HTB requires a mortgage of at least ${HTB_MIN_MORTGAGE_LTV_PCT}% of the property value.`);
  }

  return {
    eligible: true,
    appliedAmount: cappedAmount,
    cappedAmount,
    warnings,
  };
}

export interface FhsResult {
  eligible: boolean;
  equityAmount: number;
  maxEquityPct: number;
  warnings: string[];
}

export function calculateFirstHomeScheme(input: {
  useFirstHomeScheme: boolean;
  propertyType: "new_build" | "second_hand";
  propertyPrice: number;
  fhsEquityPct: number;
  useHelpToBuy: boolean;
  assumeMpe: boolean;
}): FhsResult {
  const warnings: string[] = [];
  if (!input.useFirstHomeScheme) {
    return { eligible: false, equityAmount: 0, maxEquityPct: 0, warnings };
  }

  if (input.propertyType !== "new_build") {
    warnings.push("First Home Scheme applies to new builds and self-builds only.");
    return { eligible: false, equityAmount: 0, maxEquityPct: 0, warnings };
  }

  if (input.assumeMpe) {
    warnings.push("First Home Scheme is not available with a macro-prudential exception (MPE).");
  }

  const maxEquityPct = input.useHelpToBuy
    ? FHS_MAX_EQUITY_WITH_HTB_PCT
    : FHS_MAX_EQUITY_PCT;

  const requestedPct = Math.min(input.fhsEquityPct, maxEquityPct);
  const minEquity = Math.max(FHS_MIN_EQUITY_EUR, input.propertyPrice * (FHS_MIN_EQUITY_PCT / 100));
  let equityAmount = input.propertyPrice * (requestedPct / 100);

  if (equityAmount > 0 && equityAmount < minEquity) {
    equityAmount = minEquity;
    warnings.push(
      `FHS minimum equity is €${FHS_MIN_EQUITY_EUR.toLocaleString("en-IE")} or ${FHS_MIN_EQUITY_PCT}% of price.`,
    );
  }

  const maxEquityAmount = input.propertyPrice * (maxEquityPct / 100);
  if (equityAmount > maxEquityAmount) {
    equityAmount = maxEquityAmount;
  }

  return {
    eligible: true,
    equityAmount,
    maxEquityPct,
    warnings,
  };
}

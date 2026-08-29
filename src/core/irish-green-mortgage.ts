/** Irish green mortgage BER discounts — indicative tiers (not live lender rates). */

export type BerRating = "A0" | "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type GreenTier = "premium" | "standard" | "ecosaver" | "none";

/** EcoSaver-style tiered discount (% off base rate) by BER grade. */
const ECOSAVER_DISCOUNT_PCT: Record<BerRating, number> = {
  A0: 0.35,
  A: 0.3,
  B: 0.25,
  C: 0.15,
  D: 0.1,
  E: 0.05,
  F: 0,
  G: 0,
};

const STANDARD_GREEN_RATINGS: BerRating[] = ["A0", "A", "B"];
const PREMIUM_GREEN_RATINGS: BerRating[] = ["A0", "A"];

export interface GreenMortgageInput {
  useGreenMortgage: boolean;
  berRating: BerRating;
  baseInterestRatePct: number;
  greenDiscountOverridePct: number | null;
}

export interface GreenMortgageResult {
  greenEligible: boolean;
  greenTier: GreenTier;
  greenDiscountPct: number;
  effectiveInterestRatePct: number;
  premiumEligible: boolean;
  warnings: string[];
}

export function isStandardGreenEligible(berRating: BerRating): boolean {
  return STANDARD_GREEN_RATINGS.includes(berRating);
}

export function isPremiumGreenEligible(berRating: BerRating): boolean {
  return PREMIUM_GREEN_RATINGS.includes(berRating);
}

export function getAutoGreenDiscountPct(berRating: BerRating): number {
  return ECOSAVER_DISCOUNT_PCT[berRating];
}

export function resolveGreenMortgage(input: GreenMortgageInput): GreenMortgageResult {
  const warnings: string[] = [];

  if (!input.useGreenMortgage) {
    return {
      greenEligible: false,
      greenTier: "none",
      greenDiscountPct: 0,
      effectiveInterestRatePct: input.baseInterestRatePct,
      premiumEligible: false,
      warnings,
    };
  }

  const autoDiscount = getAutoGreenDiscountPct(input.berRating);
  const hasOverride =
    input.greenDiscountOverridePct !== null &&
    input.greenDiscountOverridePct >= 0 &&
    !Number.isNaN(input.greenDiscountOverridePct);

  let greenDiscountPct: number;
  if (hasOverride) {
    greenDiscountPct = input.greenDiscountOverridePct!;
  } else if (autoDiscount > 0) {
    greenDiscountPct = autoDiscount;
  } else {
    greenDiscountPct = 0;
    warnings.push(
      "BER below B does not qualify for the usual green rate. Type your lender's discount if they still give you one, like Bank of Ireland EcoSaver.",
    );
  }

  const standardEligible = isStandardGreenEligible(input.berRating);
  const premiumEligible = isPremiumGreenEligible(input.berRating);

  let greenTier: GreenTier = "none";
  if (greenDiscountPct > 0) {
    if (premiumEligible && greenDiscountPct >= 0.3) {
      greenTier = "premium";
    } else if (standardEligible) {
      greenTier = "standard";
    } else {
      greenTier = "ecosaver";
    }
  }

  const effectiveInterestRatePct = Math.max(
    0,
    input.baseInterestRatePct - greenDiscountPct,
  );

  return {
    greenEligible: greenDiscountPct > 0,
    greenTier,
    greenDiscountPct,
    effectiveInterestRatePct,
    premiumEligible,
    warnings,
  };
}

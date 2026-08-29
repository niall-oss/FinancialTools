import {
  calculateBorrowingCapacity,
  FHS_MAX_EQUITY_PCT,
  FHS_MAX_EQUITY_WITH_HTB_PCT,
  getMinDepositPct,
  HTB_MAX_PROPERTY_PRICE,
} from "../../core/irish-mortgage-rules";
import type { MortgageInput } from "./engine";

export type InvalidMortgageField =
  | "deposit"
  | "property_price"
  | "property_type"
  | "fhs_equity_pct"
  | "term_years";

export type MortgageFieldErrors = Partial<Record<InvalidMortgageField, string[]>>;

function addError(errors: MortgageFieldErrors, field: InvalidMortgageField, message: string): void {
  const list = errors[field] ?? [];
  if (!list.includes(message)) list.push(message);
  errors[field] = list;
}

export function getMortgageFieldErrors(input: MortgageInput): MortgageFieldErrors {
  const errors: MortgageFieldErrors = {};

  const minDeposit = getMinDepositPct(input.buyerType);
  if (input.depositPct < minDeposit) {
    const buyerLabel =
      input.buyerType === "btl"
        ? "buy-to-let"
        : input.buyerType === "ssb"
          ? "second/subsequent buyers"
          : "first-time buyers";
    addError(
      errors,
      "deposit",
      `Minimum deposit is ${minDeposit}% for ${buyerLabel} under Central Bank rules.`,
    );
  }

  if (input.propertyPrice <= 0) {
    addError(errors, "property_price", "Enter a valid property price.");
  }

  if (input.termYears <= 0) {
    addError(errors, "term_years", "Enter a mortgage term of at least 1 year.");
  }

  if (input.useHelpToBuy) {
    if (input.propertyType !== "new_build") {
      addError(errors, "property_type", "Help to Buy applies to new builds and self-builds only.");
    }
    if (input.propertyPrice > HTB_MAX_PROPERTY_PRICE) {
      addError(
        errors,
        "property_price",
        `Help to Buy is limited to properties up to €${HTB_MAX_PROPERTY_PRICE.toLocaleString("en-IE")}.`,
      );
    }
  }

  if (input.useFirstHomeScheme) {
    const maxPct = input.useHelpToBuy ? FHS_MAX_EQUITY_WITH_HTB_PCT : FHS_MAX_EQUITY_PCT;
    if (input.fhsEquityPct > maxPct) {
      addError(
        errors,
        "fhs_equity_pct",
        input.useHelpToBuy
          ? `First Home Scheme equity is capped at ${maxPct}% when also using Help to Buy.`
          : `First Home Scheme equity is capped at ${maxPct}%.`,
      );
    }
    if (input.propertyType !== "new_build") {
      addError(
        errors,
        "property_type",
        "First Home Scheme applies to new builds and self-builds only.",
      );
    }
  }

  if (input.grossIncome > 0 && input.propertyPrice > 0) {
    const borrowing = calculateBorrowingCapacity({
      buyerType: input.buyerType,
      grossIncome: input.grossIncome,
      propertyPrice: input.propertyPrice,
      depositPct: input.depositPct,
      isBridgingLoan: input.isBridgingLoan,
    });
    if (!borrowing.passesCentralBankRules && !input.assumeMpe) {
      if (borrowing.bindingConstraint === "ltv") {
        addError(
          errors,
          "deposit",
          `Deposit is too low. Maximum mortgage is ${borrowing.ltvMaxPct}% of the property value.`,
        );
      } else if (borrowing.maxLoanByLti !== null) {
        addError(
          errors,
          "property_price",
          `Property is too expensive for your income. Maximum loan is €${Math.round(borrowing.maxLoanAllowed).toLocaleString("en-IE")} (${borrowing.ltiMultiple}× gross income).`,
        );
      }
    }
  }

  return errors;
}

export function getInvalidMortgageFields(input: MortgageInput): Set<InvalidMortgageField> {
  return new Set(Object.keys(getMortgageFieldErrors(input)) as InvalidMortgageField[]);
}

export function getMortgageFieldErrorMessage(
  errors: MortgageFieldErrors,
  field: InvalidMortgageField,
): string | undefined {
  const messages = errors[field];
  return messages?.length ? messages.join(" ") : undefined;
}

export function depositPctFromAmount(propertyPrice: number, amount: number): number {
  if (propertyPrice <= 0) return 0;
  return Math.round((amount / propertyPrice) * 10_000) / 100;
}

export function depositAmountFromPct(propertyPrice: number, pct: number): number {
  return Math.round(propertyPrice * (pct / 100));
}

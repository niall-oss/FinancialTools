/** Monthly mortgage payment (standard amortization). */
export function calculateMonthlyPayment(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (loanAmount <= 0 || termYears <= 0) return 0;
  if (annualRatePct === 0) return loanAmount / (termYears * 12);

  const monthlyRate = annualRatePct / 100 / 12;
  const months = termYears * 12;
  return (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

export interface AmortizationSnapshot {
  year: number;
  month: number;
  balance: number;
  principalPaid: number;
  interestPaid: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalRepaid: number;
  years: AmortizationSnapshot[];
  monthlySnapshots: AmortizationSnapshot[];
}

export function runAmortizationSchedule(input: {
  loanAmount: number;
  annualRatePct: number;
  termYears: number;
  overpaymentMonthly?: number;
  overpaymentMonthlyStartYear?: number;
  overpaymentLumpSum?: number;
  overpaymentLumpSumStartYear?: number;
}): AmortizationResult {
  const overpaymentMonthly = input.overpaymentMonthly ?? 0;
  const overpaymentMonthlyStartYear = input.overpaymentMonthlyStartYear ?? 1;
  const overpaymentLumpSum = input.overpaymentLumpSum ?? 0;
  const overpaymentLumpSumStartYear = input.overpaymentLumpSumStartYear ?? 1;
  const monthlyRate = input.annualRatePct / 100 / 12;
  const basePayment = calculateMonthlyPayment(
    input.loanAmount,
    input.annualRatePct,
    input.termYears,
  );

  let balance = input.loanAmount;
  let lumpSumApplied = false;

  let totalInterest = 0;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const maxMonths = input.termYears * 12 + 600;
  const monthlySnapshots: AmortizationSnapshot[] = [];
  const yearMap = new Map<number, AmortizationSnapshot>();

  for (let month = 1; month <= maxMonths && balance > 0.01; month++) {
    const year = Math.ceil(month / 12);

    if (
      !lumpSumApplied &&
      overpaymentLumpSum > 0 &&
      year >= overpaymentLumpSumStartYear
    ) {
      const applied = Math.min(overpaymentLumpSum, balance);
      balance -= applied;
      cumulativePrincipal += applied;
      lumpSumApplied = true;
    }

    const extraMonthly =
      overpaymentMonthly > 0 && year >= overpaymentMonthlyStartYear
        ? overpaymentMonthly
        : 0;

    const interest = balance * monthlyRate;
    let principal = basePayment - interest + extraMonthly;
    if (principal > balance) principal = balance;

    balance -= principal;
    totalInterest += interest;
    cumulativeInterest += interest;
    cumulativePrincipal += principal;

    const snap: AmortizationSnapshot = {
      year,
      month,
      balance: Math.max(0, balance),
      principalPaid: principal,
      interestPaid: interest,
      cumulativeInterest,
      cumulativePrincipal,
    };
    monthlySnapshots.push(snap);
    yearMap.set(year, snap);

    if (balance <= 0.01) break;
  }

  const totalRepaid = input.loanAmount + totalInterest;
  const monthlyPayment = basePayment + (overpaymentMonthly > 0 ? overpaymentMonthly : 0);

  return {
    monthlyPayment,
    totalInterest,
    totalRepaid,
    years: Array.from(yearMap.values()),
    monthlySnapshots,
  };
}

export function compareOverpayment(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
  overpaymentMonthly: number,
  overpaymentLumpSum: number,
  overpaymentMonthlyStartYear = 1,
  overpaymentLumpSumStartYear = 1,
): {
  baseline: AmortizationResult;
  withOverpayment: AmortizationResult;
  interestSaved: number;
  monthsSaved: number;
} {
  const baseline = runAmortizationSchedule({ loanAmount, annualRatePct, termYears });
  const withOverpayment = runAmortizationSchedule({
    loanAmount,
    annualRatePct,
    termYears,
    overpaymentMonthly,
    overpaymentMonthlyStartYear,
    overpaymentLumpSum,
    overpaymentLumpSumStartYear,
  });

  return {
    baseline,
    withOverpayment,
    interestSaved: baseline.totalInterest - withOverpayment.totalInterest,
    monthsSaved: baseline.monthlySnapshots.length - withOverpayment.monthlySnapshots.length,
  };
}

export interface AnnualAmortizationSummary {
  year: number;
  balanceEnd: number;
  principalPaid: number;
  interestPaid: number;
  /** Principal paid as % of balance at start of year — rises as interest share falls. */
  paydownRatePct: number;
}

export function aggregateAnnualTotals(
  monthlySnapshots: AmortizationSnapshot[],
  initialLoan: number,
): AnnualAmortizationSummary[] {
  const byYear = new Map<number, { principal: number; interest: number; balanceEnd: number }>();

  for (const snap of monthlySnapshots) {
    const entry = byYear.get(snap.year) ?? { principal: 0, interest: 0, balanceEnd: snap.balance };
    entry.principal += snap.principalPaid;
    entry.interest += snap.interestPaid;
    entry.balanceEnd = snap.balance;
    byYear.set(snap.year, entry);
  }

  let openingBalance = initialLoan;
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, data]) => {
      const paydownRatePct =
        openingBalance > 0 ? (data.principal / openingBalance) * 100 : 0;
      const summary: AnnualAmortizationSummary = {
        year,
        balanceEnd: data.balanceEnd,
        principalPaid: data.principal,
        interestPaid: data.interest,
        paydownRatePct,
      };
      openingBalance = data.balanceEnd;
      return summary;
    });
}

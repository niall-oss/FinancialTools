/** Irish residential stamp duty bands (effective 2 Oct 2024, Budget 2025). */

export const VAT_RATE_NEW_BUILD = 0.135;

export interface StampDutyBand {
  label: string;
  from: number;
  to: number | null;
  ratePct: number;
  amount: number;
}

export interface StampDutyResult {
  total: number;
  consideration: number;
  bands: StampDutyBand[];
}

function bandAmount(from: number, to: number | null, ratePct: number, consideration: number): number {
  const upper = to === null ? consideration : Math.min(consideration, to);
  const taxable = Math.max(0, upper - from);
  return taxable * (ratePct / 100);
}

/** Progressive residential stamp duty on consideration amount. */
export function calculateResidentialStampDuty(
  purchasePrice: number,
  isNewBuild = false,
): StampDutyResult {
  const consideration = isNewBuild
    ? purchasePrice / (1 + VAT_RATE_NEW_BUILD)
    : purchasePrice;

  const tiers: { from: number; to: number | null; ratePct: number; label: string }[] = [
    { from: 0, to: 1_000_000, ratePct: 1, label: "First €1m" },
    { from: 1_000_000, to: 1_500_000, ratePct: 2, label: "€1m – €1.5m" },
    { from: 1_500_000, to: null, ratePct: 6, label: "Above €1.5m" },
  ];

  const bands: StampDutyBand[] = [];
  let total = 0;

  for (const tier of tiers) {
    const amount = bandAmount(tier.from, tier.to, tier.ratePct, consideration);
    if (amount > 0) {
      bands.push({
        label: tier.label,
        from: tier.from,
        to: tier.to,
        ratePct: tier.ratePct,
        amount,
      });
      total += amount;
    }
  }

  return { total, consideration, bands };
}

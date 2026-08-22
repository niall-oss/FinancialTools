/** Irish Local Property Tax — 2026–2030 valuation period bands (Revenue). */

export interface LptBand {
  band: number;
  min: number;
  max: number;
  basicRate: number;
}

/** 19 bands for properties up to €2.1m (valuation period 2026–2030). */
export const LPT_BANDS_2026: LptBand[] = [
  { band: 1, min: 1, max: 240_000, basicRate: 95 },
  { band: 2, min: 240_001, max: 315_000, basicRate: 235 },
  { band: 3, min: 315_001, max: 420_000, basicRate: 333 },
  { band: 4, min: 420_001, max: 525_000, basicRate: 428 },
  { band: 5, min: 525_001, max: 630_000, basicRate: 523 },
  { band: 6, min: 630_001, max: 735_000, basicRate: 618 },
  { band: 7, min: 735_001, max: 840_000, basicRate: 713 },
  { band: 8, min: 840_001, max: 945_000, basicRate: 808 },
  { band: 9, min: 945_001, max: 1_050_000, basicRate: 903 },
  { band: 10, min: 1_050_001, max: 1_155_000, basicRate: 998 },
  { band: 11, min: 1_155_001, max: 1_260_000, basicRate: 1_094 },
  { band: 12, min: 1_260_001, max: 1_365_000, basicRate: 1_272 },
  { band: 13, min: 1_365_001, max: 1_470_000, basicRate: 1_535 },
  { band: 14, min: 1_470_001, max: 1_575_000, basicRate: 1_797 },
  { band: 15, min: 1_575_001, max: 1_680_000, basicRate: 2_060 },
  { band: 16, min: 1_680_001, max: 1_785_000, basicRate: 2_322 },
  { band: 17, min: 1_785_001, max: 1_890_000, basicRate: 2_585 },
  { band: 18, min: 1_890_001, max: 1_995_000, basicRate: 2_847 },
  { band: 19, min: 1_995_001, max: 2_100_000, basicRate: 3_110 },
];

const LPT_TIER_RATE_LOW = 0.000906;
const LPT_TIER_RATE_MID = 0.0025;
const LPT_TIER_RATE_HIGH = 0.003;

export interface LptResult {
  band: LptBand | null;
  basicRate: number;
  annualCharge: number;
  usesFormula: boolean;
}

export function calculateLpt(
  propertyValue: number,
  localAdjustmentPct = 0,
): LptResult {
  let basicRate: number;

  if (propertyValue <= 2_100_000) {
    const band =
      LPT_BANDS_2026.find((b) => propertyValue >= b.min && propertyValue <= b.max) ??
      LPT_BANDS_2026[LPT_BANDS_2026.length - 1];
    basicRate = band.basicRate;
    const annualCharge = basicRate * (1 + localAdjustmentPct / 100);
    return { band, basicRate, annualCharge, usesFormula: false };
  }

  // Properties above €2.1m: tiered formula (Finance Act 2025).
  const tier1 = 1_260_000 * LPT_TIER_RATE_LOW;
  const tier2 = (2_100_000 - 1_260_000) * LPT_TIER_RATE_MID;
  const tier3 = Math.max(0, propertyValue - 2_100_000) * LPT_TIER_RATE_HIGH;
  basicRate = tier1 + tier2 + tier3;
  const annualCharge = basicRate * (1 + localAdjustmentPct / 100);
  return { band: null, basicRate, annualCharge, usesFormula: true };
}

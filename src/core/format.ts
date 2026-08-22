export function formatEur(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-IE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

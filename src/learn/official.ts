export const OFFICIAL_SOURCE_DOMAINS = [
  "revenue.ie",
  "centralbank.ie",
  "gov.ie",
  "citizensinformation.ie",
  "seai.ie",
  "myfuturefund.ie",
  "firsthomescheme.ie",
] as const;

export function isOfficialSourceUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return OFFICIAL_SOURCE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

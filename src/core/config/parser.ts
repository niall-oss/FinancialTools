import { coerceConfigValue, type ConfigData } from "./schema";

function stripInlineComment(value: string): string {
  let inQuotes = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '"' || char === "'") inQuotes = !inQuotes;
    else if (char === "#" && !inQuotes) return value.slice(0, i).trim();
  }
  return value.trim();
}

export function parseConfig(text: string): ConfigData {
  const result: ConfigData = {};
  let currentSection: string | null = null;

  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) continue;

    const sectionMatch = /^\[(.+)\]$/.exec(stripped);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      result[currentSection] ??= {};
      continue;
    }

    if (!currentSection || !stripped.includes("=")) continue;

    const eqIndex = stripped.indexOf("=");
    const key = stripped.slice(0, eqIndex).trim();
    const rawValue = stripInlineComment(stripped.slice(eqIndex + 1));
    if (key) result[currentSection][key] = coerceConfigValue(rawValue);
  }

  return result;
}

export function serializeConfig(data: ConfigData): string {
  const lines = ["# Irish Financial Tools — config", ""];
  for (const [section, values] of Object.entries(data)) {
    lines.push(`[${section}]`);
    for (const [key, value] of Object.entries(values)) {
      lines.push(`${key}=${value}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

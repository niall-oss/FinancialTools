import { parseConfig, serializeConfig } from "./parser";
import {
  DEFAULTS,
  mergeWithDefaults,
  STORAGE_KEY,
  type ConfigData,
  type ConfigValue,
} from "./schema";

type Listener = () => void;

function readEmbeddedDefaults(): ConfigData | null {
  const el = document.getElementById("embedded-default-config");
  if (!el?.textContent) return null;
  try {
    return mergeWithDefaults(JSON.parse(el.textContent) as ConfigData);
  } catch {
    return null;
  }
}

export class ConfigStore {
  private data: ConfigData = structuredClone(DEFAULTS);
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  getData(): ConfigData {
    return this.data;
  }

  getSection(section: string): Record<string, ConfigValue> {
    return this.data[section] ?? {};
  }

  get(section: string, key: string): ConfigValue | undefined {
    return this.data[section]?.[key];
  }

  getNumber(section: string, key: string, fallback = 0): number {
    const value = this.get(section, key);
    return typeof value === "number" ? value : fallback;
  }

  getBoolean(section: string, key: string, fallback = false): boolean {
    const value = this.get(section, key);
    return typeof value === "boolean" ? value : fallback;
  }

  getString(section: string, key: string, fallback = ""): string {
    const value = this.get(section, key);
    return typeof value === "string" ? value : String(value ?? fallback);
  }

  set(section: string, key: string, value: ConfigValue): void {
    this.data[section] ??= {};
    this.data[section][key] = value;
    this.persist();
    this.notify();
  }

  setSection(section: string, values: Record<string, ConfigValue>): void {
    this.data[section] = { ...values };
    this.persist();
    this.notify();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, serializeConfig(this.data));
    } catch {
      // localStorage may be unavailable
    }
  }

  async load(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.data = mergeWithDefaults(parseConfig(stored));
      return;
    }

    try {
      const response = await fetch("./config/defaults.txt");
      if (response.ok) {
        this.data = mergeWithDefaults(parseConfig(await response.text()));
        this.persist();
        return;
      }
    } catch {
      // fetch fails on file:// — fall through
    }

    const embedded = readEmbeddedDefaults();
    this.data = embedded ?? structuredClone(DEFAULTS);
  }

  importText(text: string): void {
    this.data = mergeWithDefaults(parseConfig(text));
    this.persist();
    this.notify();
  }

  exportText(): string {
    return serializeConfig(this.data);
  }

  downloadExport(): void {
    const blob = new Blob([this.exportText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "config.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async importFromFile(file: File): Promise<void> {
    this.importText(await file.text());
  }

  resetToDefaults(): void {
    const embedded = readEmbeddedDefaults();
    this.data = embedded ?? structuredClone(DEFAULTS);
    this.persist();
    this.notify();
  }
}

export const configStore = new ConfigStore();

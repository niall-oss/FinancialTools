import type { ConfigSection } from "@/core/config/schema";

export type NetWorthSide = "asset" | "liability";
export type AccessBucket = "accessible" | "locked" | "property" | "other";

export interface NetWorthItem {
  id: string;
  side: NetWorthSide;
  group: string;
  name: string;
  amount: number;
}

export interface NetWorthState {
  assetGroups: string[];
  liabilityGroups: string[];
  items: NetWorthItem[];
}

export interface GroupTotal {
  group: string;
  amount: number;
}

export interface MixRow {
  group: string;
  assets: number;
  liabilities: number;
}

export interface AccessTotal {
  bucket: AccessBucket;
  label: string;
  amount: number;
}

export interface NetWorthResult {
  assets: number;
  liabilities: number;
  netWorth: number;
  debtToAssetsPct: number;
  accessible: number;
  locked: number;
  property: number;
  otherAccess: number;
  assetByGroup: GroupTotal[];
  liabilityByGroup: GroupTotal[];
  mix: MixRow[];
  access: AccessTotal[];
  listedItems: NetWorthItem[];
}

export const DEFAULT_ASSET_GROUPS = [
  "Cash",
  "Property",
  "Pensions",
  "Investments",
  "Vehicles",
  "Other",
] as const;

export const DEFAULT_LIABILITY_GROUPS = ["Mortgage", "Loans", "Credit cards", "Other"] as const;

export const OTHER_GROUP = "Other";

export const ACCESS_LABELS: Record<AccessBucket, string> = {
  accessible: "Accessible",
  locked: "Locked (pensions)",
  property: "Property",
  other: "Other",
};

export interface QuickAddPreset {
  label: string;
  side: NetWorthSide;
  group: string;
  name: string;
}

export const QUICK_ADD_PRESETS: QuickAddPreset[] = [
  { label: "Current account", side: "asset", group: "Cash", name: "Current account" },
  { label: "Credit union", side: "asset", group: "Cash", name: "Credit union" },
  { label: "Home", side: "asset", group: "Property", name: "Home" },
  { label: "Mortgage", side: "liability", group: "Mortgage", name: "Home loan" },
  { label: "Occupational pension", side: "asset", group: "Pensions", name: "Occupational pension" },
  { label: "PRSA", side: "asset", group: "Pensions", name: "PRSA" },
  { label: "ETFs", side: "asset", group: "Investments", name: "ETFs" },
  { label: "Car", side: "asset", group: "Vehicles", name: "Car" },
  { label: "Car loan", side: "liability", group: "Loans", name: "Car loan" },
  { label: "Credit card", side: "liability", group: "Credit cards", name: "Credit card" },
];

export function sanitizeLabel(value: string): string {
  return value.replace(/[|;,#]/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function sectionString(section: ConfigSection, key: string): string | undefined {
  const value = section[key];
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  return String(value);
}

export function encodeGroups(groups: string[]): string {
  return groups.map(sanitizeLabel).filter(Boolean).join(",");
}

export function decodeGroups(raw: string | undefined, fallback: readonly string[]): string[] {
  if (raw === undefined) return [...fallback];
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const part of raw.split(",")) {
    const name = sanitizeLabel(part);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    groups.push(name);
  }
  return groups;
}

export function encodeItems(items: Pick<NetWorthItem, "group" | "name" | "amount">[]): string {
  return items
    .map((item) => `${sanitizeLabel(item.group) || OTHER_GROUP}|${sanitizeLabel(item.name) || "Item"}|${normalizeAmount(item.amount)}`)
    .join(";");
}

export function decodeItems(raw: string | undefined, side: NetWorthSide): NetWorthItem[] {
  if (!raw?.trim()) return [];
  const items: NetWorthItem[] = [];
  for (const chunk of raw.split(";")) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("|");
    if (parts.length < 3) continue;
    const amount = normalizeAmount(Number(parts[parts.length - 1]));
    const group = sanitizeLabel(parts[0]) || OTHER_GROUP;
    const name = sanitizeLabel(parts.slice(1, -1).join(" ")) || "Item";
    items.push({
      id: `${side}-${items.length}`,
      side,
      group,
      name,
      amount,
    });
  }
  return items;
}

export function serializeNetWorthState(state: NetWorthState): {
  asset_groups: string;
  liability_groups: string;
  assets: string;
  liabilities: string;
} {
  return {
    asset_groups: encodeGroups(state.assetGroups),
    liability_groups: encodeGroups(state.liabilityGroups),
    assets: encodeItems(state.items.filter((item) => item.side === "asset")),
    liabilities: encodeItems(state.items.filter((item) => item.side === "liability")),
  };
}

export function parseNetWorthSection(section: ConfigSection): NetWorthState {
  return {
    assetGroups: decodeGroups(sectionString(section, "asset_groups"), DEFAULT_ASSET_GROUPS),
    liabilityGroups: decodeGroups(sectionString(section, "liability_groups"), DEFAULT_LIABILITY_GROUPS),
    items: [
      ...decodeItems(sectionString(section, "assets"), "asset"),
      ...decodeItems(sectionString(section, "liabilities"), "liability"),
    ],
  };
}

function groupsFor(state: NetWorthState, side: NetWorthSide): string[] {
  return side === "asset" ? state.assetGroups : state.liabilityGroups;
}

function withGroups(state: NetWorthState, side: NetWorthSide, groups: string[]): NetWorthState {
  if (side === "asset") return { ...state, assetGroups: groups };
  return { ...state, liabilityGroups: groups };
}

function ensureGroup(state: NetWorthState, side: NetWorthSide, group: string): NetWorthState {
  const name = sanitizeLabel(group) || OTHER_GROUP;
  const groups = groupsFor(state, side);
  if (groups.includes(name)) return state;
  return withGroups(state, side, [...groups, name]);
}

export function addItem(
  state: NetWorthState,
  input: { side: NetWorthSide; group: string; name: string; amount?: number },
): { state: NetWorthState; id: string } {
  const withGroup = ensureGroup(state, input.side, input.group);
  const sameSideCount = withGroup.items.filter((item) => item.side === input.side).length;
  const item: NetWorthItem = {
    id: `${input.side}-${sameSideCount}`,
    side: input.side,
    group: sanitizeLabel(input.group) || OTHER_GROUP,
    name: sanitizeLabel(input.name) || "Item",
    amount: normalizeAmount(input.amount ?? 0),
  };
  return { state: { ...withGroup, items: [...withGroup.items, item] }, id: item.id };
}

export function updateItem(
  state: NetWorthState,
  id: string,
  patch: { name?: string; amount?: number },
): NetWorthState {
  return {
    ...state,
    items: state.items.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        name: patch.name === undefined ? item.name : sanitizeLabel(patch.name),
        amount: patch.amount === undefined ? item.amount : normalizeAmount(patch.amount),
      };
    }),
  };
}

export function removeItem(state: NetWorthState, id: string): NetWorthState {
  return { ...state, items: state.items.filter((item) => item.id !== id) };
}

export function addGroup(state: NetWorthState, side: NetWorthSide, rawName: string): NetWorthState {
  const name = sanitizeLabel(rawName);
  if (!name) return state;
  return ensureGroup(state, side, name);
}

export function removeGroup(state: NetWorthState, side: NetWorthSide, group: string): NetWorthState {
  const groups = groupsFor(state, side);
  if (!groups.includes(group)) return state;
  const moved = state.items.filter((item) => item.side === side && item.group === group);
  if (group === OTHER_GROUP && moved.length > 0) return state;

  let nextGroups = groups.filter((name) => name !== group);
  let items = state.items;
  if (moved.length > 0) {
    if (!nextGroups.includes(OTHER_GROUP)) nextGroups = [...nextGroups, OTHER_GROUP];
    items = state.items.map((item) =>
      item.side === side && item.group === group ? { ...item, group: OTHER_GROUP } : item,
    );
  }
  return withGroups({ ...state, items }, side, nextGroups);
}

export function accessBucket(group: string): AccessBucket {
  const key = group.trim().toLowerCase();
  if (key === "cash" || key === "investments") return "accessible";
  if (key === "pensions") return "locked";
  if (key === "property") return "property";
  return "other";
}

function sumByGroup(items: NetWorthItem[], groups: string[]): GroupTotal[] {
  const totals = new Map<string, number>();
  for (const group of groups) totals.set(group, 0);
  for (const item of items) {
    const amount = normalizeAmount(item.amount);
    totals.set(item.group, (totals.get(item.group) ?? 0) + amount);
  }
  const ordered = groups.map((group) => ({ group, amount: totals.get(group) ?? 0 }));
  for (const [group, amount] of totals) {
    if (!groups.includes(group)) ordered.push({ group, amount });
  }
  return ordered.filter((row) => row.amount > 0);
}

export function runNetWorth(state: NetWorthState): NetWorthResult {
  const items = state.items.map((item) => ({ ...item, amount: normalizeAmount(item.amount) }));
  const assetItems = items.filter((item) => item.side === "asset");
  const liabilityItems = items.filter((item) => item.side === "liability");
  const assets = assetItems.reduce((sum, item) => sum + item.amount, 0);
  const liabilities = liabilityItems.reduce((sum, item) => sum + item.amount, 0);

  const accessTotals: Record<AccessBucket, number> = {
    accessible: 0,
    locked: 0,
    property: 0,
    other: 0,
  };
  for (const item of assetItems) {
    accessTotals[accessBucket(item.group)] += item.amount;
  }

  const mixMap = new Map<string, MixRow>();
  const mixOrder: string[] = [];
  const register = (group: string): MixRow => {
    const existing = mixMap.get(group);
    if (existing) return existing;
    const row = { group, assets: 0, liabilities: 0 };
    mixMap.set(group, row);
    mixOrder.push(group);
    return row;
  };
  for (const group of state.assetGroups) register(group);
  for (const group of state.liabilityGroups) register(group);
  for (const item of items) {
    const row = register(item.group);
    if (item.side === "asset") row.assets += item.amount;
    else row.liabilities += item.amount;
  }

  const listedItems = items.filter((item) => item.amount > 0);
  const groupOrder = (side: NetWorthSide, group: string): number => {
    const groups = groupsFor(state, side);
    const index = groups.indexOf(group);
    return index === -1 ? groups.length : index;
  };
  listedItems.sort((a, b) => {
    if (a.side !== b.side) return a.side === "asset" ? -1 : 1;
    const groupDelta = groupOrder(a.side, a.group) - groupOrder(b.side, b.group);
    if (groupDelta !== 0) return groupDelta;
    return a.name.localeCompare(b.name);
  });

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    debtToAssetsPct: assets > 0 ? (liabilities / assets) * 100 : 0,
    accessible: accessTotals.accessible,
    locked: accessTotals.locked,
    property: accessTotals.property,
    otherAccess: accessTotals.other,
    assetByGroup: sumByGroup(assetItems, state.assetGroups),
    liabilityByGroup: sumByGroup(liabilityItems, state.liabilityGroups),
    mix: mixOrder
      .map((group) => mixMap.get(group)!)
      .filter((row) => row.assets > 0 || row.liabilities > 0),
    access: (["accessible", "locked", "property", "other"] as const)
      .map((bucket) => ({
        bucket,
        label: ACCESS_LABELS[bucket],
        amount: accessTotals[bucket],
      }))
      .filter((row) => row.amount > 0),
    listedItems,
  };
}

export const DEFAULT_NET_WORTH_STATE: NetWorthState = {
  assetGroups: [...DEFAULT_ASSET_GROUPS],
  liabilityGroups: [...DEFAULT_LIABILITY_GROUPS],
  items: [
    { id: "asset-0", side: "asset", group: "Cash", name: "Current account", amount: 5000 },
    { id: "asset-1", side: "asset", group: "Cash", name: "Credit union", amount: 10000 },
    { id: "asset-2", side: "asset", group: "Property", name: "Home", amount: 400000 },
    { id: "asset-3", side: "asset", group: "Pensions", name: "Occupational pension", amount: 40000 },
    { id: "asset-4", side: "asset", group: "Pensions", name: "PRSA", amount: 0 },
    { id: "asset-5", side: "asset", group: "Investments", name: "ETFs", amount: 10000 },
    { id: "asset-6", side: "asset", group: "Vehicles", name: "Car", amount: 10000 },
    { id: "liability-0", side: "liability", group: "Mortgage", name: "Home loan", amount: 280000 },
    { id: "liability-1", side: "liability", group: "Loans", name: "Car loan", amount: 5000 },
    { id: "liability-2", side: "liability", group: "Credit cards", name: "Credit card", amount: 0 },
  ],
};

export const DEFAULT_NET_WORTH_SECTION = serializeNetWorthState(DEFAULT_NET_WORTH_STATE);

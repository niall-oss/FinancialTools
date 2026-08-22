import { describe, expect, it } from "vitest";
import { DEFAULTS } from "../src/core/config/schema";
import {
  addGroup,
  addItem,
  decodeItems,
  encodeItems,
  parseNetWorthSection,
  removeGroup,
  runNetWorth,
  serializeNetWorthState,
  updateItem,
  type NetWorthState,
} from "../src/tools/networth/engine";

const empty: NetWorthState = {
  assetGroups: ["Cash", "Property", "Other"],
  liabilityGroups: ["Mortgage", "Other"],
  items: [],
};

describe("encode and decode", () => {
  it("round-trips items including zero amounts", () => {
    const encoded = encodeItems([
      { group: "Cash", name: "Current account", amount: 8500 },
      { group: "Pensions", name: "PRSA", amount: 0 },
    ]);
    expect(encoded).toBe("Cash|Current account|8500;Pensions|PRSA|0");
    const decoded = decodeItems(encoded, "asset");
    expect(decoded).toEqual([
      { id: "asset-0", side: "asset", group: "Cash", name: "Current account", amount: 8500 },
      { id: "asset-1", side: "asset", group: "Pensions", name: "PRSA", amount: 0 },
    ]);
  });

  it("strips pipe and semicolon from names on encode", () => {
    const encoded = encodeItems([{ group: "Cash", name: "A|B;C", amount: 10 }]);
    expect(encoded).toBe("Cash|A B C|10");
    expect(decodeItems(encoded, "asset")[0].name).toBe("A B C");
  });

  it("treats negative and non-finite amounts as zero", () => {
    expect(decodeItems("Cash|Bad|-5", "asset")[0].amount).toBe(0);
    expect(decodeItems("Cash|Nan|NaN", "asset")[0].amount).toBe(0);
  });

  it("round-trips a full section", () => {
    const state: NetWorthState = {
      assetGroups: ["Cash", "Crypto"],
      liabilityGroups: ["Mortgage"],
      items: [
        { id: "asset-0", side: "asset", group: "Cash", name: "Current account", amount: 100 },
        { id: "liability-0", side: "liability", group: "Mortgage", name: "Home loan", amount: 40 },
      ],
    };
    const section = serializeNetWorthState(state);
    expect(parseNetWorthSection(section)).toEqual(state);
  });
});

describe("runNetWorth", () => {
  it("nets assets minus liabilities and skips zeros in charts", () => {
    const result = runNetWorth({
      ...empty,
      items: [
        { id: "asset-0", side: "asset", group: "Cash", name: "Current account", amount: 10000 },
        { id: "asset-1", side: "asset", group: "Property", name: "Home", amount: 200000 },
        { id: "asset-2", side: "asset", group: "Cash", name: "Empty", amount: 0 },
        { id: "liability-0", side: "liability", group: "Mortgage", name: "Home loan", amount: 80000 },
      ],
    });
    expect(result.assets).toBe(210000);
    expect(result.liabilities).toBe(80000);
    expect(result.netWorth).toBe(130000);
    expect(result.debtToAssetsPct).toBeCloseTo((80000 / 210000) * 100);
    expect(result.listedItems.map((item) => item.name)).toEqual([
      "Current account",
      "Home",
      "Home loan",
    ]);
    expect(result.assetByGroup).toEqual([
      { group: "Cash", amount: 10000 },
      { group: "Property", amount: 200000 },
    ]);
    expect(result.liabilityByGroup).toEqual([{ group: "Mortgage", amount: 80000 }]);
  });

  it("puts custom groups on the mix chart", () => {
    const result = runNetWorth({
      assetGroups: ["Cash", "Crypto"],
      liabilityGroups: ["Loans"],
      items: [
        { id: "asset-0", side: "asset", group: "Crypto", name: "BTC", amount: 5000 },
        { id: "liability-0", side: "liability", group: "Loans", name: "Car loan", amount: 2000 },
      ],
    });
    expect(result.mix).toEqual([
      { group: "Crypto", assets: 5000, liabilities: 0 },
      { group: "Loans", assets: 0, liabilities: 2000 },
    ]);
  });

  it("classifies access from group names", () => {
    const result = runNetWorth({
      assetGroups: ["Cash", "Investments", "Pensions", "Property", "Vehicles"],
      liabilityGroups: [],
      items: [
        { id: "a0", side: "asset", group: "Cash", name: "Cash", amount: 10 },
        { id: "a1", side: "asset", group: "Investments", name: "ETF", amount: 20 },
        { id: "a2", side: "asset", group: "Pensions", name: "PRSA", amount: 30 },
        { id: "a3", side: "asset", group: "Property", name: "Home", amount: 40 },
        { id: "a4", side: "asset", group: "Vehicles", name: "Car", amount: 5 },
      ],
    });
    expect(result.accessible).toBe(30);
    expect(result.locked).toBe(30);
    expect(result.property).toBe(40);
    expect(result.otherAccess).toBe(5);
  });
});

describe("group edits", () => {
  it("moves items to Other when a group is deleted", () => {
    const started: NetWorthState = {
      assetGroups: ["Cash", "Other"],
      liabilityGroups: ["Mortgage"],
      items: [{ id: "asset-0", side: "asset", group: "Cash", name: "Current account", amount: 10 }],
    };
    const next = removeGroup(started, "asset", "Cash");
    expect(next.assetGroups).toEqual(["Other"]);
    expect(next.items[0].group).toBe("Other");
  });

  it("adds a custom group and an item in it", () => {
    const withGroup = addGroup(empty, "asset", "Crypto");
    expect(withGroup.assetGroups).toContain("Crypto");
    const { state, id } = addItem(withGroup, {
      side: "asset",
      group: "Crypto",
      name: "BTC",
      amount: 1000,
    });
    expect(id).toBe("asset-0");
    expect(runNetWorth(state).netWorth).toBe(1000);
    expect(runNetWorth(updateItem(state, id, { amount: 1500 })).netWorth).toBe(1500);
  });
});

describe("schema defaults", () => {
  it("match the example household snapshot", () => {
    const result = runNetWorth(parseNetWorthSection(DEFAULTS.networth));
    expect(result.assets).toBe(475000);
    expect(result.liabilities).toBe(285000);
    expect(result.netWorth).toBe(190000);
    expect(result.listedItems.some((item) => item.name === "PRSA")).toBe(false);
  });
});

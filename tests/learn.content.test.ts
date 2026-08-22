import { describe, expect, it } from "vitest";
import { parseAppRoute } from "../src/hooks/use-hash-route";
import { isOfficialSourceUrl } from "../src/learn/official";
import { getTools } from "../src/tools/registry";

describe("parseAppRoute", () => {
  it("treats an empty hash as home", () => {
    expect(parseAppRoute("")).toEqual({ kind: "home" });
  });

  it("treats a tool id as a tool route", () => {
    expect(parseAppRoute("mortgage")).toEqual({ kind: "tool", id: "mortgage" });
  });

  it("parses learn pages", () => {
    expect(parseAppRoute("learn/compound")).toEqual({ kind: "learn", toolId: "compound" });
    expect(parseAppRoute("learn")).toEqual({ kind: "learn", toolId: "" });
  });
});

describe("learn content", () => {
  const tools = getTools();

  it("is present on every registered tool", () => {
    expect(tools.length).toBeGreaterThan(0);
    for (const tool of tools) {
      expect(tool.learn.overview.length).toBeGreaterThan(0);
      expect(tool.learn.topics.length).toBeGreaterThan(0);
      expect(tool.learn.sources.length).toBeGreaterThan(0);
    }
  });

  it("uses https official hosts only", () => {
    for (const tool of tools) {
      for (const source of tool.learn.sources) {
        expect(isOfficialSourceUrl(source.url), `${tool.id}: ${source.url}`).toBe(true);
      }
    }
  });

  it("points topic references at sources that exist", () => {
    for (const tool of tools) {
      const ids = new Set(tool.learn.sources.map((source) => source.id));
      for (const topic of tool.learn.topics) {
        for (const sourceId of topic.sourceIds) {
          expect(ids.has(sourceId), `${tool.id} topic ${topic.id} -> ${sourceId}`).toBe(true);
        }
      }
    }
  });
});

describe("isOfficialSourceUrl", () => {
  it("accepts https subdomains of the allowlist", () => {
    expect(isOfficialSourceUrl("https://www.revenue.ie/en/property/help-to-buy-incentive/index.aspx")).toBe(true);
  });

  it("rejects non-official and non-https urls", () => {
    expect(isOfficialSourceUrl("https://www.example.com/tax")).toBe(false);
    expect(isOfficialSourceUrl("http://www.revenue.ie/en/")).toBe(false);
  });
});

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatTokenReport, resolveSkillFile, tokenReport } from "../src/commands/tokens.js";

const FIXTURES = fileURLToPath(new URL("../fixtures", import.meta.url));

describe("tokenReport", () => {
  it("reports all three loading tiers for pdf-extractor", () => {
    const report = tokenReport(join(FIXTURES, "pdf-extractor"));
    expect(report.name).toBe("pdf-extractor");
    const references = report.entries.filter((entry) => entry.tier === "reference");
    expect(references.map((entry) => entry.label).sort()).toEqual([
      "references/forms.md",
      "scripts/extract.py",
    ]);
    expect(report.metadataTokens).toBeGreaterThan(10);
    expect(report.bodyTokens).toBeGreaterThan(20);
    expect(report.referenceTokens).toBeGreaterThan(0);
    expect(report.totalTokens).toBe(report.metadataTokens + report.bodyTokens + report.referenceTokens);
  });

  it("reports zero referenced files for commit-helper", () => {
    const report = tokenReport(join(FIXTURES, "commit-helper"));
    expect(report.entries.filter((entry) => entry.tier === "reference")).toHaveLength(0);
    expect(report.referenceTokens).toBe(0);
  });

  it("skips broken references instead of crashing", () => {
    const report = tokenReport(join(FIXTURES, "broken-links"));
    expect(report.entries.filter((entry) => entry.tier === "reference")).toHaveLength(0);
  });

  it("formats the loading-tier summary", () => {
    const text = formatTokenReport(tokenReport(join(FIXTURES, "pdf-extractor")), FIXTURES);
    expect(text).toContain("always in context");
    expect(text).toContain("loaded on trigger");
    expect(text).toContain("total if fully loaded");
  });

  it("throws for paths without a SKILL.md", () => {
    expect(() => resolveSkillFile(join(FIXTURES, "nope"))).toThrow(/path not found/);
    expect(() => resolveSkillFile(join(FIXTURES, "pdf-extractor", "scripts"))).toThrow(/no SKILL.md/);
  });
});

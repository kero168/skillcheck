import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatLintSummary, lintTargets } from "../src/commands/lint.js";

const FIXTURES = fileURLToPath(new URL("../fixtures", import.meta.url));

describe("lintTargets", () => {
  it("passes both valid fixture skills with zero findings", () => {
    const summary = lintTargets([join(FIXTURES, "commit-helper"), join(FIXTURES, "pdf-extractor")]);
    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(0);
    expect(summary.exitCode).toBe(0);
  });

  it("fails the missing-name fixture with S003", () => {
    const summary = lintTargets([join(FIXTURES, "missing-name")]);
    expect(summary.results[0]!.findings.map((f) => f.ruleId)).toContain("S003");
    expect(summary.exitCode).toBe(1);
  });

  it("fails the broken-yaml fixture with S002", () => {
    const summary = lintTargets([join(FIXTURES, "broken-yaml")]);
    expect(summary.results[0]!.findings.map((f) => f.ruleId)).toEqual(["S002"]);
    expect(summary.exitCode).toBe(1);
  });

  it("reports one error and one warning for broken-links", () => {
    const summary = lintTargets([join(FIXTURES, "broken-links")]);
    expect(summary.results[0]!.findings.map((f) => f.ruleId)).toEqual(["S009", "S014"]);
    expect(summary.errors).toBe(1);
    expect(summary.warnings).toBe(1);
  });

  it("lints a whole tree when given a directory without a direct SKILL.md", () => {
    const summary = lintTargets([FIXTURES]);
    expect(summary.results).toHaveLength(5);
    expect(summary.exitCode).toBe(1);
  });

  it("escalates warnings to a failing exit code with strict", () => {
    const base = mkdtempSync(join(tmpdir(), "skillcheck-"));
    const skillDir = join(base, "quiet-skill");
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      "---\nname: quiet-skill\ndescription: Formats spreadsheet exports into tidy CSV summaries.\n---\n\n# Quiet Skill\n\nDo quiet things.\n"
    );
    expect(lintTargets([skillDir]).exitCode).toBe(0);
    expect(lintTargets([skillDir], { strict: true }).exitCode).toBe(1);
  });

  it("throws a friendly error for nonexistent paths", () => {
    expect(() => lintTargets([join(FIXTURES, "no-such-dir")])).toThrow(/path not found/);
  });

  it("formats findings with rule IDs and a summary line", () => {
    const summary = lintTargets([join(FIXTURES, "missing-name")]);
    const text = formatLintSummary(summary, FIXTURES);
    expect(text).toContain("S003");
    expect(text).toContain("problem");
  });
});

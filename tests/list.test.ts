import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatSkillList, listSkills } from "../src/commands/list.js";

const FIXTURES = fileURLToPath(new URL("../fixtures", import.meta.url));

describe("listSkills", () => {
  it("finds all five fixture skills and grades their health", () => {
    const summary = listSkills(FIXTURES);
    expect(summary.entries).toHaveLength(5);
    const statusByDir = Object.fromEntries(
      summary.entries.map((entry) => [basename(dirname(entry.path)), entry.status])
    );
    expect(statusByDir).toEqual({
      "broken-links": "fail",
      "broken-yaml": "fail",
      "commit-helper": "ok",
      "missing-name": "fail",
      "pdf-extractor": "ok",
    });
    expect(summary.exitCode).toBe(1);
  });

  it("reports body token estimates for every entry", () => {
    const summary = listSkills(FIXTURES);
    for (const entry of summary.entries) {
      expect(entry.bodyTokens).toBeGreaterThan(0);
    }
  });

  it("exits 0 for a healthy subtree", () => {
    const summary = listSkills(join(FIXTURES, "commit-helper"));
    expect(summary.exitCode).toBe(0);
  });

  it("throws when no skills exist under the root", () => {
    expect(() => listSkills(join(FIXTURES, "pdf-extractor", "scripts"))).toThrow(/no SKILL.md/);
  });

  it("renders a table with headers and names", () => {
    const text = formatSkillList(listSkills(FIXTURES), FIXTURES);
    expect(text).toContain("STATUS");
    expect(text).toContain("commit-helper");
    expect(text).toContain("fail");
  });
});

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSkillFile, parseSkillSource } from "../src/parse.js";
import { runRules } from "../src/rules/index.js";

const FIXTURES = fileURLToPath(new URL("../fixtures", import.meta.url));

const VALID_SOURCE = [
  "---",
  "name: sample-skill",
  "description: Does useful things with files. Use when the user asks for sample output.",
  "---",
  "",
  "# Sample",
  "",
  "Do the thing.",
  "",
].join("\n");

function idsFor(source: string, path = "/tmp/sample-skill/SKILL.md"): string[] {
  return runRules(parseSkillSource(source, path)).map((finding) => finding.ruleId);
}

describe("rules", () => {
  it("passes a fully valid skill with zero findings", () => {
    expect(idsFor(VALID_SOURCE)).toEqual([]);
  });

  it("S001: fires when frontmatter is missing, and suppresses field rules", () => {
    const ids = idsFor("# No frontmatter here\n");
    expect(ids).toContain("S001");
    expect(ids).not.toContain("S003");
    expect(ids).not.toContain("S004");
  });

  it("S002: fires on invalid YAML (broken-yaml fixture) with no cascade", () => {
    const findings = runRules(parseSkillFile(join(FIXTURES, "broken-yaml", "SKILL.md")));
    expect(findings.map((f) => f.ruleId)).toEqual(["S002"]);
    expect(findings[0]!.severity).toBe("error");
  });

  it("S003: fires when name is missing (missing-name fixture)", () => {
    const ids = runRules(parseSkillFile(join(FIXTURES, "missing-name", "SKILL.md"))).map((f) => f.ruleId);
    expect(ids).toContain("S003");
    expect(ids).toContain("S008");
  });

  it("S004: fires when description is missing", () => {
    const ids = idsFor("---\nname: sample-skill\n---\n\nBody here.\n");
    expect(ids).toContain("S004");
    expect(ids).not.toContain("S006");
    expect(ids).not.toContain("S008");
  });

  it("S005: fires on invalid name format", () => {
    const source = VALID_SOURCE.replace("name: sample-skill", "name: Bad_Name");
    expect(idsFor(source)).toContain("S005");
  });

  it("S005: fires on names longer than 64 characters", () => {
    const source = VALID_SOURCE.replace("name: sample-skill", `name: ${"a".repeat(70)}`);
    expect(idsFor(source)).toContain("S005");
  });

  it("S006: fires on a too-short description", () => {
    const source = VALID_SOURCE.replace(/description: .*/, "description: Too short.");
    const ids = idsFor(source);
    expect(ids).toContain("S006");
    expect(ids).not.toContain("S008");
  });

  it("S007: fires on a description over 1024 characters", () => {
    const source = VALID_SOURCE.replace(/description: .*/, `description: ${"a".repeat(1100)}`);
    expect(idsFor(source)).toContain("S007");
  });

  it("S008: fires when the description has no trigger phrase", () => {
    const source = VALID_SOURCE.replace(
      /description: .*/,
      "description: Formats spreadsheet exports into tidy CSV files."
    );
    expect(idsFor(source)).toContain("S008");
  });

  it("S008: accepts Japanese trigger phrases", () => {
    const source = VALID_SOURCE.replace(
      /description: .*/,
      "description: 表計算のエクスポートを整形します。CSVの整形を頼まれたときに使用します。"
    );
    expect(idsFor(source)).not.toContain("S008");
  });

  it("S009 and S014: fire for the broken-links fixture, in line order", () => {
    const findings = runRules(parseSkillFile(join(FIXTURES, "broken-links", "SKILL.md")));
    expect(findings.map((f) => f.ruleId)).toEqual(["S009", "S014"]);
    expect(findings[0]!.severity).toBe("error");
    expect(findings[1]!.severity).toBe("warning");
    expect(findings[0]!.line).toBeLessThan(findings[1]!.line ?? 0);
  });

  it("S009 and S014: stay quiet when referenced files exist (pdf-extractor fixture)", () => {
    const findings = runRules(parseSkillFile(join(FIXTURES, "pdf-extractor", "SKILL.md")));
    expect(findings).toEqual([]);
  });

  it("S009: ignores URLs, anchors, and fenced code blocks", () => {
    const body = [
      "See [site](https://example.com/missing.md) and [anchor](#top).",
      "```",
      "[fake](references/inside-fence.md)",
      "```",
    ].join("\n");
    const ids = idsFor(`${VALID_SOURCE}\n${body}\n`);
    expect(ids).not.toContain("S009");
  });

  it("S010: fires when the directory name does not match the skill name", () => {
    expect(idsFor(VALID_SOURCE, "/tmp/other-dir/SKILL.md")).toContain("S010");
  });

  it("S011: fires on unknown frontmatter fields", () => {
    const source = VALID_SOURCE.replace("---\n\n# Sample", "unexpected: true\n---\n\n# Sample");
    expect(idsFor(source)).toContain("S011");
  });

  it("S012: fires when the body exceeds the token budget", () => {
    const source = `${VALID_SOURCE}\n${"word ".repeat(6000)}\n`;
    expect(idsFor(source)).toContain("S012");
  });

  it("S013: fires on an empty body", () => {
    const source = "---\nname: sample-skill\ndescription: Does things. Use when the user asks for sample output.\n---\n";
    expect(idsFor(source)).toContain("S013");
  });

  it("supports include/exclude filters by rule ID", () => {
    const skill = parseSkillSource("# No frontmatter\n", "/tmp/sample-skill/SKILL.md");
    expect(runRules(skill, { include: ["S001"] }).map((f) => f.ruleId)).toEqual(["S001"]);
    expect(runRules(skill, { exclude: ["S001"] }).map((f) => f.ruleId)).not.toContain("S001");
  });
});

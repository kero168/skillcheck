import { describe, expect, it } from "vitest";
import { parseSkillSource } from "../src/parse.js";

describe("parseSkillSource", () => {
  it("parses frontmatter and body", () => {
    const source = "---\nname: demo-skill\ndescription: Something useful.\n---\n\n# Demo\n";
    const skill = parseSkillSource(source, "/tmp/demo-skill/SKILL.md");
    expect(skill.frontmatter).toEqual({ name: "demo-skill", description: "Something useful." });
    expect(skill.frontmatterError).toBeNull();
    expect(skill.body).toBe("\n# Demo\n");
    expect(skill.bodyStartLine).toBe(5);
  });

  it("returns null frontmatter when the file does not start with ---", () => {
    const skill = parseSkillSource("# Just markdown\n", "/tmp/x/SKILL.md");
    expect(skill.frontmatterText).toBeNull();
    expect(skill.frontmatter).toBeNull();
    expect(skill.body).toBe("# Just markdown\n");
    expect(skill.bodyStartLine).toBe(1);
  });

  it("reports YAML syntax errors", () => {
    const skill = parseSkillSource("---\ndescription: [unclosed\n---\nbody\n", "/tmp/x/SKILL.md");
    expect(skill.frontmatterText).not.toBeNull();
    expect(skill.frontmatter).toBeNull();
    expect(skill.frontmatterError).toBeTruthy();
  });

  it("rejects non-mapping frontmatter", () => {
    const skill = parseSkillSource("---\njust a string\n---\nbody\n", "/tmp/x/SKILL.md");
    expect(skill.frontmatter).toBeNull();
    expect(skill.frontmatterError).toMatch(/mapping/);
  });

  it("flags an unterminated frontmatter block", () => {
    const skill = parseSkillSource("---\nname: x\n", "/tmp/x/SKILL.md");
    expect(skill.frontmatterText).not.toBeNull();
    expect(skill.frontmatterError).toMatch(/never closed/);
    expect(skill.body).toBe("");
  });

  it("treats empty frontmatter as an empty mapping", () => {
    const skill = parseSkillSource("---\n---\nbody\n", "/tmp/x/SKILL.md");
    expect(skill.frontmatter).toEqual({});
    expect(skill.frontmatterError).toBeNull();
  });
});

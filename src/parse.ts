import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { ParsedSkill } from "./types.js";

const FRONTMATTER_OPEN = /^---\r?\n/;

/** Parse SKILL.md content that is already in memory. */
export function parseSkillSource(source: string, filePath: string): ParsedSkill {
  const path = resolve(filePath);
  const base: ParsedSkill = {
    path,
    dir: dirname(path),
    source,
    frontmatterText: null,
    frontmatter: null,
    frontmatterError: null,
    body: source,
    bodyStartLine: 1,
  };
  if (!FRONTMATTER_OPEN.test(source)) {
    return base;
  }

  const lines = source.split(/\r?\n/);
  let closeIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      closeIndex = i;
      break;
    }
  }
  if (closeIndex === -1) {
    return {
      ...base,
      frontmatterText: lines.slice(1).join("\n"),
      frontmatterError: "frontmatter block is never closed (missing terminating ---)",
      body: "",
      bodyStartLine: lines.length + 1,
    };
  }

  const frontmatterText = lines.slice(1, closeIndex).join("\n");
  let frontmatter: Record<string, unknown> | null = null;
  let frontmatterError: string | null = null;
  try {
    const parsed: unknown = parseYaml(frontmatterText);
    if (parsed === null || parsed === undefined) {
      frontmatter = {};
    } else if (typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    } else {
      frontmatterError = "frontmatter must be a YAML mapping of keys to values";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    frontmatterError = message.split("\n")[0] ?? message;
  }

  return {
    ...base,
    frontmatterText,
    frontmatter,
    frontmatterError,
    body: lines.slice(closeIndex + 1).join("\n"),
    bodyStartLine: closeIndex + 2,
  };
}

/** Read and parse a SKILL.md file from disk. */
export function parseSkillFile(filePath: string): ParsedSkill {
  const abs = resolve(filePath);
  return parseSkillSource(readFileSync(abs, "utf8"), abs);
}

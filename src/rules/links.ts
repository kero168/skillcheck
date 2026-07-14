import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import type { ParsedSkill, Rule } from "../types.js";

const LINK_RE = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const CODE_SPAN_RE = /`([^`\n]+)`/g;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const PATH_LIKE_RE = /^(?:\.\.?\/)*[\w.@-]+(?:\/[\w.@-]+)+$/;
const EXT_RE = /\.[A-Za-z0-9]{1,10}$/;
const FENCE_RE = /^\s*(?:```|~~~)/;

/** A file reference found in a SKILL.md body. */
export interface BodyReference {
  /** Reference as written in the markdown. */
  target: string;
  /** 1-based line number in SKILL.md. */
  line: number;
  /** "link" for markdown links/images, "code" for inline code spans. */
  kind: "link" | "code";
  /** Absolute path the reference resolves to. */
  resolved: string;
  /** Whether the resolved path exists on disk. */
  exists: boolean;
}

/**
 * Collect local file references from a skill body: relative markdown
 * links/images plus inline code spans that look like relative file paths.
 * Fenced code blocks are skipped; URLs, anchors, and absolute paths are
 * ignored.
 */
export function collectReferences(skill: ParsedSkill): BodyReference[] {
  const refs: BodyReference[] = [];
  const lines = skill.body.split(/\r?\n/);
  let inFence = false;
  lines.forEach((text, index) => {
    if (FENCE_RE.test(text)) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      return;
    }
    const lineNo = skill.bodyStartLine + index;
    for (const match of text.matchAll(LINK_RE)) {
      const target = match[1];
      if (!target || SCHEME_RE.test(target) || target.startsWith("#") || isAbsolute(target)) {
        continue;
      }
      pushReference(refs, skill, target, lineNo, "link");
    }
    const withoutLinks = text.replace(LINK_RE, " ");
    for (const match of withoutLinks.matchAll(CODE_SPAN_RE)) {
      const target = (match[1] ?? "").trim();
      if (SCHEME_RE.test(target) || !PATH_LIKE_RE.test(target) || !EXT_RE.test(target)) {
        continue;
      }
      pushReference(refs, skill, target, lineNo, "code");
    }
  });
  return refs;
}

function pushReference(
  refs: BodyReference[],
  skill: ParsedSkill,
  target: string,
  line: number,
  kind: "link" | "code"
): void {
  const withoutAnchor = target.split("#")[0]?.split("?")[0] ?? target;
  const cleaned = decodeSafe(withoutAnchor);
  if (cleaned.length === 0) {
    return;
  }
  const resolved = resolve(skill.dir, cleaned);
  refs.push({ target, line, kind, resolved, exists: existsSync(resolved) });
}

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const linkRules: Rule[] = [
  {
    id: "S009",
    name: "broken-link",
    severity: "error",
    description: "Relative markdown links must point to files that exist",
    check({ skill, report }) {
      for (const ref of collectReferences(skill)) {
        if (ref.kind === "link" && !ref.exists) {
          report(`broken link "${ref.target}": file does not exist`, ref.line);
        }
      }
    },
  },
  {
    id: "S014",
    name: "missing-referenced-file",
    severity: "warning",
    description: "File paths mentioned in inline code should exist inside the skill directory",
    check({ skill, report }) {
      for (const ref of collectReferences(skill)) {
        if (ref.kind === "code" && !ref.exists) {
          report(`referenced file "${ref.target}" does not exist`, ref.line);
        }
      }
    },
  },
];

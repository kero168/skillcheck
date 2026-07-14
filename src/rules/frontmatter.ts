import { basename } from "node:path";
import type { Rule } from "../types.js";

/**
 * Frontmatter fields accepted by the Agent Skills format. Anything else is
 * flagged by S011 as a warning (agents ignore unknown fields silently, which
 * usually means the author made a typo).
 */
export const ALLOWED_FRONTMATTER_FIELDS = new Set([
  "name",
  "description",
  "license",
  "allowed-tools",
  "metadata",
  "version",
]);

/** Maximum skill name length allowed by the Agent Skills spec. */
export const NAME_MAX_LENGTH = 64;
/** Maximum description length allowed by the Agent Skills spec. */
export const DESCRIPTION_MAX_LENGTH = 1024;
/** Descriptions shorter than this are almost never useful triggers. */
export const DESCRIPTION_MIN_LENGTH = 20;

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Heuristics for "does the description say when to use the skill?".
 * Agents pick skills from descriptions alone, so a good description names
 * its triggers ("Use when the user asks to ...").
 */
const TRIGGER_PATTERNS: RegExp[] = [
  /\buse\s+(?:this|it|when|for|if|to)\b/i,
  /\bwhen\s+(?:the\s+|a\s+)?(?:user|you)\b/i,
  /\bfor\s+\p{L}+ing\b/iu,
  /\btriggers?\b/i,
  /\bhelps?\s+(?:with|you|to)\b/i,
  /使用|使って|使う|場合|とき|時に/,
];

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export const frontmatterRules: Rule[] = [
  {
    id: "S001",
    name: "missing-frontmatter",
    severity: "error",
    description: "SKILL.md must begin with a YAML frontmatter block delimited by ---",
    check({ skill, report }) {
      if (skill.frontmatterText === null) {
        report("SKILL.md must start with a YAML frontmatter block (--- ... ---)", 1);
      }
    },
  },
  {
    id: "S002",
    name: "invalid-frontmatter-yaml",
    severity: "error",
    description: "Frontmatter must be valid YAML and a mapping of keys to values",
    check({ skill, report }) {
      if (skill.frontmatterText !== null && skill.frontmatterError !== null) {
        report(`frontmatter is not valid YAML: ${skill.frontmatterError}`, 1);
      }
    },
  },
  {
    id: "S003",
    name: "missing-name",
    severity: "error",
    description: 'Frontmatter must contain a non-empty string field "name"',
    check({ skill, report }) {
      if (skill.frontmatter === null) {
        return;
      }
      if (nonEmptyString(skill.frontmatter["name"]) === null) {
        report('frontmatter is missing required field "name" (non-empty string)', 1);
      }
    },
  },
  {
    id: "S004",
    name: "missing-description",
    severity: "error",
    description: 'Frontmatter must contain a non-empty string field "description"',
    check({ skill, report }) {
      if (skill.frontmatter === null) {
        return;
      }
      if (nonEmptyString(skill.frontmatter["description"]) === null) {
        report('frontmatter is missing required field "description" (non-empty string)', 1);
      }
    },
  },
  {
    id: "S005",
    name: "invalid-name-format",
    severity: "error",
    description: `name must be lowercase letters, digits, and hyphens, at most ${NAME_MAX_LENGTH} characters`,
    check({ skill, report }) {
      const name = nonEmptyString(skill.frontmatter?.["name"]);
      if (name === null) {
        return;
      }
      if (name.length > NAME_MAX_LENGTH) {
        report(`name is ${name.length} characters; the Agent Skills spec allows at most ${NAME_MAX_LENGTH}`, 1);
      }
      if (!NAME_RE.test(name)) {
        report(`name "${name}" must contain only lowercase letters, digits, and single hyphens (e.g. "pdf-extractor")`, 1);
      }
    },
  },
  {
    id: "S006",
    name: "description-too-short",
    severity: "warning",
    description: `description shorter than ${DESCRIPTION_MIN_LENGTH} characters cannot describe what and when`,
    check({ skill, report }) {
      const description = nonEmptyString(skill.frontmatter?.["description"]);
      if (description === null) {
        return;
      }
      const length = description.trim().length;
      if (length < DESCRIPTION_MIN_LENGTH) {
        report(`description is only ${length} characters; say what the skill does and when to use it`, 1);
      }
    },
  },
  {
    id: "S007",
    name: "description-too-long",
    severity: "error",
    description: `description must not exceed ${DESCRIPTION_MAX_LENGTH} characters (Agent Skills spec limit)`,
    check({ skill, report }) {
      const description = nonEmptyString(skill.frontmatter?.["description"]);
      if (description === null) {
        return;
      }
      if (description.length > DESCRIPTION_MAX_LENGTH) {
        report(`description is ${description.length} characters; the Agent Skills spec caps it at ${DESCRIPTION_MAX_LENGTH}`, 1);
      }
    },
  },
  {
    id: "S008",
    name: "no-trigger-phrase",
    severity: "warning",
    description: 'description should state when to use the skill (e.g. "Use when ...")',
    check({ skill, report }) {
      const description = nonEmptyString(skill.frontmatter?.["description"]);
      if (description === null || description.trim().length < DESCRIPTION_MIN_LENGTH) {
        return;
      }
      if (!TRIGGER_PATTERNS.some((pattern) => pattern.test(description))) {
        report(
          'description never says when to use the skill; add a trigger phrase such as "Use when ..." so agents can decide to load it',
          1
        );
      }
    },
  },
  {
    id: "S010",
    name: "name-directory-mismatch",
    severity: "warning",
    description: "The skill directory should be named after the skill",
    check({ skill, report }) {
      const name = nonEmptyString(skill.frontmatter?.["name"]);
      if (name === null || !NAME_RE.test(name)) {
        return;
      }
      const dirName = basename(skill.dir);
      if (dirName !== name) {
        report(`directory "${dirName}" does not match skill name "${name}"; rename the folder to "${name}"`, 1);
      }
    },
  },
  {
    id: "S011",
    name: "unknown-frontmatter-field",
    severity: "warning",
    description: "Frontmatter should only use fields defined by the Agent Skills format",
    check({ skill, report }) {
      if (skill.frontmatter === null) {
        return;
      }
      const known = [...ALLOWED_FRONTMATTER_FIELDS].join(", ");
      for (const key of Object.keys(skill.frontmatter)) {
        if (!ALLOWED_FRONTMATTER_FIELDS.has(key)) {
          report(`unknown frontmatter field "${key}" (known fields: ${known})`, 1);
        }
      }
    },
  },
];

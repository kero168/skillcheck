/** Severity of a lint finding. */
export type Severity = "error" | "warning";

/** A single lint finding produced by a rule. */
export interface Finding {
  /** Stable rule identifier, e.g. "S003". */
  ruleId: string;
  severity: Severity;
  message: string;
  /** Absolute path of the SKILL.md that produced the finding. */
  file: string;
  /** 1-based line number, when the rule can locate the problem. */
  line?: number;
}

/** A parsed SKILL.md file. */
export interface ParsedSkill {
  /** Absolute path to the SKILL.md file. */
  path: string;
  /** Directory containing the SKILL.md file (the skill root). */
  dir: string;
  /** Raw file content. */
  source: string;
  /** Raw frontmatter text (without --- delimiters), or null when absent. */
  frontmatterText: string | null;
  /** Parsed frontmatter mapping, or null when absent or invalid. */
  frontmatter: Record<string, unknown> | null;
  /** YAML/shape error when frontmatter is present but unusable. */
  frontmatterError: string | null;
  /** Markdown body after the frontmatter block. */
  body: string;
  /** 1-based line number where the body starts. */
  bodyStartLine: number;
}

/** Context handed to each rule's check function. */
export interface RuleContext {
  skill: ParsedSkill;
  /** Report a finding for this rule. */
  report(message: string, line?: number): void;
}

/** A lint rule. Rules are pure: parse once, check many. */
export interface Rule {
  /** Stable ID (S001, S002, ...). Never reuse retired IDs. */
  id: string;
  /** Short kebab-case name. */
  name: string;
  severity: Severity;
  /** One-line human description shown by `skillcheck rules`. */
  description: string;
  check(ctx: RuleContext): void;
}

/** Options for runRules. */
export interface RunRulesOptions {
  /** Only run rules with these IDs. */
  include?: string[];
  /** Skip rules with these IDs. */
  exclude?: string[];
}

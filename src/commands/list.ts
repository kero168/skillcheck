import { relative, resolve } from "node:path";
import pc from "picocolors";
import { discoverSkills } from "../discover.js";
import { SkillcheckError } from "../errors.js";
import { parseSkillFile } from "../parse.js";
import { runRules } from "../rules/index.js";
import { renderTable } from "../table.js";
import { estimateTokens } from "../tokenizer.js";

export type SkillStatus = "ok" | "warn" | "fail";

export interface SkillListEntry {
  name: string | null;
  /** Absolute path of the SKILL.md. */
  path: string;
  errors: number;
  warnings: number;
  /** Estimated tokens in the SKILL.md body. */
  bodyTokens: number;
  status: SkillStatus;
}

export interface ListSummary {
  root: string;
  entries: SkillListEntry[];
  exitCode: 0 | 1;
}

export interface ListOptions {
  /** Treat warnings as failures for the exit code. */
  strict?: boolean;
}

/** Discover every skill under a directory and lint each one. */
export function listSkills(root: string, options: ListOptions = {}): ListSummary {
  const absRoot = resolve(root);
  const files = discoverSkills(absRoot);
  if (files.length === 0) {
    throw new SkillcheckError(`no SKILL.md found under: ${root}`);
  }
  const entries: SkillListEntry[] = files.map((file) => {
    const skill = parseSkillFile(file);
    const findings = runRules(skill);
    const errors = findings.filter((finding) => finding.severity === "error").length;
    const warnings = findings.filter((finding) => finding.severity === "warning").length;
    const rawName = skill.frontmatter?.["name"];
    const name = typeof rawName === "string" && rawName.trim().length > 0 ? rawName : null;
    const status: SkillStatus = errors > 0 ? "fail" : warnings > 0 ? "warn" : "ok";
    return {
      name,
      path: file,
      errors,
      warnings,
      bodyTokens: estimateTokens(skill.body),
      status,
    };
  });
  const failed =
    entries.some((entry) => entry.status === "fail") ||
    (options.strict === true && entries.some((entry) => entry.status === "warn"));
  return { root: absRoot, entries, exitCode: failed ? 1 : 0 };
}

/** Format a skill list as a health table. */
export function formatSkillList(summary: ListSummary, cwd: string = process.cwd()): string {
  const rows = summary.entries.map((entry) => [
    statusBadge(entry.status),
    entry.name ?? pc.dim("(unnamed)"),
    String(entry.errors),
    String(entry.warnings),
    `~${entry.bodyTokens}`,
    relative(cwd, entry.path) || entry.path,
  ]);
  const table = renderTable(["STATUS", "NAME", "ERRORS", "WARNINGS", "~TOKENS", "PATH"], rows);
  const ok = summary.entries.filter((entry) => entry.status === "ok").length;
  const warn = summary.entries.filter((entry) => entry.status === "warn").length;
  const fail = summary.entries.filter((entry) => entry.status === "fail").length;
  const total = summary.entries.length;
  const counts = `${total} skill${total === 1 ? "" : "s"}: ${pc.green(`${ok} ok`)}, ${pc.yellow(
    `${warn} warn`
  )}, ${pc.red(`${fail} fail`)}`;
  return `${table}\n\n${counts}`;
}

function statusBadge(status: SkillStatus): string {
  switch (status) {
    case "ok":
      return pc.green("ok");
    case "warn":
      return pc.yellow("warn");
    case "fail":
      return pc.red("fail");
  }
}

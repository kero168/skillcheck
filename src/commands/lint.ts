import { existsSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import pc from "picocolors";
import { discoverSkills } from "../discover.js";
import { SkillcheckError } from "../errors.js";
import { parseSkillFile } from "../parse.js";
import { runRules } from "../rules/index.js";
import type { Finding } from "../types.js";

export interface LintOptions {
  /** Treat warnings as failures. */
  strict?: boolean;
}

export interface FileLintResult {
  /** Absolute path of the linted SKILL.md. */
  path: string;
  findings: Finding[];
}

export interface LintSummary {
  results: FileLintResult[];
  errors: number;
  warnings: number;
  exitCode: 0 | 1;
}

/**
 * Expand CLI targets into SKILL.md files. A file target is used as-is; a
 * directory target uses its direct SKILL.md when present, otherwise every
 * SKILL.md found underneath it.
 */
export function resolveSkillFiles(targets: string[]): string[] {
  const files: string[] = [];
  for (const target of targets) {
    const abs = resolve(target);
    const stats = statSync(abs, { throwIfNoEntry: false });
    if (stats === undefined) {
      throw new SkillcheckError(`path not found: ${target}`);
    }
    if (stats.isFile()) {
      files.push(abs);
      continue;
    }
    const direct = join(abs, "SKILL.md");
    if (existsSync(direct)) {
      files.push(direct);
      continue;
    }
    const found = discoverSkills(abs);
    if (found.length === 0) {
      throw new SkillcheckError(`no SKILL.md found under: ${target}`);
    }
    files.push(...found);
  }
  return [...new Set(files)];
}

/** Lint one or more targets and summarize the findings. */
export function lintTargets(targets: string[], options: LintOptions = {}): LintSummary {
  const files = resolveSkillFiles(targets);
  const results: FileLintResult[] = files.map((file) => ({
    path: file,
    findings: runRules(parseSkillFile(file)),
  }));
  const errors = countSeverity(results, "error");
  const warnings = countSeverity(results, "warning");
  const failed = errors > 0 || (options.strict === true && warnings > 0);
  return { results, errors, warnings, exitCode: failed ? 1 : 0 };
}

function countSeverity(results: FileLintResult[], severity: "error" | "warning"): number {
  return results.reduce(
    (sum, result) => sum + result.findings.filter((finding) => finding.severity === severity).length,
    0
  );
}

/** Format a lint summary for terminal output. */
export function formatLintSummary(summary: LintSummary, cwd: string = process.cwd()): string {
  const lines: string[] = [];
  for (const result of summary.results) {
    if (result.findings.length === 0) {
      continue;
    }
    lines.push(pc.underline(relative(cwd, result.path) || result.path));
    for (const finding of result.findings) {
      const badge = finding.severity === "error" ? pc.red("error  ") : pc.yellow("warning");
      const location = finding.line === undefined ? "" : pc.dim(` (line ${finding.line})`);
      lines.push(`  ${badge} ${pc.bold(finding.ruleId)} ${finding.message}${location}`);
    }
    lines.push("");
  }
  const checked = summary.results.length;
  const problems = summary.errors + summary.warnings;
  if (problems === 0) {
    lines.push(pc.green(`OK: ${checked} skill file${checked === 1 ? "" : "s"} checked, no problems found`));
  } else {
    lines.push(
      pc.red(
        `FAIL: ${problems} problem${problems === 1 ? "" : "s"} (${summary.errors} error${
          summary.errors === 1 ? "" : "s"
        }, ${summary.warnings} warning${summary.warnings === 1 ? "" : "s"}) in ${checked} skill file${
          checked === 1 ? "" : "s"
        }`
      )
    );
  }
  return lines.join("\n");
}

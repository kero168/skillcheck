import type { Finding, ParsedSkill, Rule, RunRulesOptions } from "../types.js";
import { bodyRules } from "./body.js";
import { frontmatterRules } from "./frontmatter.js";
import { linkRules } from "./links.js";

/**
 * The rule registry. To add a rule: implement the Rule interface in one of
 * the modules under src/rules/ (or a new module), give it the next free ID,
 * and add it to the module's exported array. IDs are stable and are never
 * reused once retired.
 */
export const rules: readonly Rule[] = [...frontmatterRules, ...bodyRules, ...linkRules].sort(
  (a, b) => a.id.localeCompare(b.id)
);

/** Look up a rule by its stable ID. */
export function getRule(id: string): Rule | undefined {
  return rules.find((rule) => rule.id === id);
}

/** Run every registered rule against a parsed skill. */
export function runRules(skill: ParsedSkill, options: RunRulesOptions = {}): Finding[] {
  const findings: Finding[] = [];
  for (const rule of rules) {
    if (options.include !== undefined && !options.include.includes(rule.id)) {
      continue;
    }
    if (options.exclude !== undefined && options.exclude.includes(rule.id)) {
      continue;
    }
    rule.check({
      skill,
      report(message, line) {
        const finding: Finding = {
          ruleId: rule.id,
          severity: rule.severity,
          message,
          file: skill.path,
        };
        if (line !== undefined) {
          finding.line = line;
        }
        findings.push(finding);
      },
    });
  }
  return findings.sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || a.ruleId.localeCompare(b.ruleId));
}

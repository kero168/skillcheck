#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { formatLintSummary, lintTargets } from "./commands/lint.js";
import { formatSkillList, listSkills } from "./commands/list.js";
import { formatTokenReport, tokenReport } from "./commands/tokens.js";
import { SkillcheckError } from "./errors.js";
import { rules } from "./rules/index.js";
import { VERSION } from "./version.js";

const program = new Command();

program
  .name("skillcheck")
  .description("Lint, validate, and measure the token cost of Agent Skills (SKILL.md)")
  .version(VERSION);

program
  .command("lint")
  .description("lint one or more skills (SKILL.md files or directories)")
  .argument("<paths...>", "SKILL.md files or directories to lint")
  .option("--json", "output machine-readable JSON", false)
  .option("--strict", "treat warnings as failures", false)
  .action((paths: string[], options: { json: boolean; strict: boolean }) => {
    run(() => {
      const summary = lintTargets(paths, { strict: options.strict });
      console.log(options.json ? JSON.stringify(summary, null, 2) : formatLintSummary(summary));
      process.exitCode = summary.exitCode;
    });
  });

program
  .command("tokens")
  .description("estimate token counts and loading cost for a skill")
  .argument("<path>", "skill directory or SKILL.md file")
  .option("--json", "output machine-readable JSON", false)
  .action((path: string, options: { json: boolean }) => {
    run(() => {
      const report = tokenReport(path);
      console.log(options.json ? JSON.stringify(report, null, 2) : formatTokenReport(report));
    });
  });

program
  .command("list")
  .description("discover skills under a directory and show a health table")
  .argument("[dir]", "directory to scan", ".")
  .option("--json", "output machine-readable JSON", false)
  .option("--strict", "treat warnings as failures", false)
  .action((dir: string, options: { json: boolean; strict: boolean }) => {
    run(() => {
      const summary = listSkills(dir, { strict: options.strict });
      console.log(options.json ? JSON.stringify(summary, null, 2) : formatSkillList(summary));
      process.exitCode = summary.exitCode;
    });
  });

program
  .command("rules")
  .description("list every lint rule with its stable ID and severity")
  .option("--json", "output machine-readable JSON", false)
  .action((options: { json: boolean }) => {
    if (options.json) {
      const catalog = rules.map(({ id, name, severity, description }) => ({ id, name, severity, description }));
      console.log(JSON.stringify(catalog, null, 2));
      return;
    }
    for (const rule of rules) {
      const badge = rule.severity === "error" ? pc.red("error  ") : pc.yellow("warning");
      console.log(`${pc.bold(rule.id)}  ${badge}  ${rule.name}`);
      console.log(`        ${rule.description}`);
    }
  });

function run(action: () => void): void {
  try {
    action();
  } catch (error) {
    if (error instanceof SkillcheckError) {
      console.error(pc.red(`error: ${error.message}`));
      process.exitCode = 2;
      return;
    }
    throw error;
  }
}

program.parse();

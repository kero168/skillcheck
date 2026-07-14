import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import pc from "picocolors";
import { SkillcheckError } from "../errors.js";
import { parseSkillFile } from "../parse.js";
import { collectReferences } from "../rules/links.js";
import { renderTable } from "../table.js";
import { estimateTokens } from "../tokenizer.js";

/**
 * Loading tiers follow the Agent Skills progressive-disclosure model:
 * metadata is always in context, the body loads when the skill triggers,
 * and referenced files load only when the agent decides to read them.
 */
export type TokenTier = "metadata" | "body" | "reference";

export interface TokenEntry {
  tier: TokenTier;
  label: string;
  /** Absolute file path, or null for the synthetic metadata entry. */
  path: string | null;
  bytes: number;
  tokens: number;
}

export interface TokenReport {
  skillPath: string;
  name: string | null;
  entries: TokenEntry[];
  metadataTokens: number;
  bodyTokens: number;
  referenceTokens: number;
  totalTokens: number;
}

/** Resolve a CLI target (skill directory or SKILL.md file) to a file path. */
export function resolveSkillFile(target: string): string {
  const abs = resolve(target);
  const stats = statSync(abs, { throwIfNoEntry: false });
  if (stats === undefined) {
    throw new SkillcheckError(`path not found: ${target}`);
  }
  if (stats.isFile()) {
    return abs;
  }
  const direct = join(abs, "SKILL.md");
  if (existsSync(direct)) {
    return direct;
  }
  throw new SkillcheckError(`no SKILL.md found in: ${target}`);
}

/** Build a token-cost report for one skill. */
export function tokenReport(target: string): TokenReport {
  const file = resolveSkillFile(target);
  const skill = parseSkillFile(file);
  const frontmatter = skill.frontmatter ?? {};
  const name = typeof frontmatter["name"] === "string" ? frontmatter["name"] : null;
  const description = typeof frontmatter["description"] === "string" ? frontmatter["description"] : "";
  const metadataText = `name: ${name ?? ""}\ndescription: ${description}`;

  const entries: TokenEntry[] = [
    {
      tier: "metadata",
      label: "frontmatter metadata (name + description)",
      path: null,
      bytes: Buffer.byteLength(metadataText, "utf8"),
      tokens: estimateTokens(metadataText),
    },
    {
      tier: "body",
      label: "SKILL.md body",
      path: skill.path,
      bytes: Buffer.byteLength(skill.body, "utf8"),
      tokens: estimateTokens(skill.body),
    },
  ];

  const seen = new Set<string>();
  for (const ref of collectReferences(skill)) {
    if (!ref.exists || seen.has(ref.resolved)) {
      continue;
    }
    seen.add(ref.resolved);
    const content = readFileSync(ref.resolved, "utf8");
    entries.push({
      tier: "reference",
      label: relative(skill.dir, ref.resolved).replaceAll("\\", "/"),
      path: ref.resolved,
      bytes: Buffer.byteLength(content, "utf8"),
      tokens: estimateTokens(content),
    });
  }

  const sumTier = (tier: TokenTier): number =>
    entries.filter((entry) => entry.tier === tier).reduce((total, entry) => total + entry.tokens, 0);
  const metadataTokens = sumTier("metadata");
  const bodyTokens = sumTier("body");
  const referenceTokens = sumTier("reference");
  return {
    skillPath: skill.path,
    name,
    entries,
    metadataTokens,
    bodyTokens,
    referenceTokens,
    totalTokens: metadataTokens + bodyTokens + referenceTokens,
  };
}

/** Format a token report for terminal output. */
export function formatTokenReport(report: TokenReport, cwd: string = process.cwd()): string {
  const rows = report.entries.map((entry) => [
    entry.tier,
    entry.label,
    String(entry.bytes),
    `~${entry.tokens}`,
  ]);
  const referenceCount = report.entries.filter((entry) => entry.tier === "reference").length;
  const lines: string[] = [];
  lines.push(pc.bold(`Token cost: ${relative(cwd, report.skillPath) || report.skillPath}`));
  lines.push("");
  lines.push(renderTable(["TIER", "FILE", "BYTES", "~TOKENS"], rows));
  lines.push("");
  lines.push(`${pc.cyan("always in context ")} metadata: ~${report.metadataTokens} tokens (preloaded so the agent can pick skills)`);
  lines.push(`${pc.cyan("loaded on trigger ")} SKILL.md body: ~${report.bodyTokens} tokens`);
  lines.push(
    `${pc.cyan("loaded on demand  ")} ${referenceCount} referenced file${referenceCount === 1 ? "" : "s"}: ~${report.referenceTokens} tokens`
  );
  lines.push("");
  lines.push(pc.bold(`total if fully loaded: ~${report.totalTokens} tokens`));
  lines.push(pc.dim("Counts are a local cl100k-style approximation, not exact tokenizer output."));
  return lines.join("\n");
}

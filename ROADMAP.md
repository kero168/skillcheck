# Roadmap

Directional, not a promise. Items move when someone (maintainer or
contributor) actually wants them enough to build them. Open an issue to
argue for reordering.

## 0.2 — configuration and CI ergonomics

- [ ] `.skillcheckrc.json` / `skillcheck` key in package.json: enable/disable
      rules by ID, tune thresholds (S006 minimum length, S012 token budget).
- [ ] Inline suppressions (`<!-- skillcheck-disable S008 -->`).
- [ ] SARIF output for GitHub code scanning integration.
- [ ] `--reporter` flag (text, json, sarif).

## 0.3 — AGENTS.md awareness

- [ ] `skillcheck tokens` for AGENTS.md files (they share the context budget).
- [ ] A small AGENTS.md rule set (broken links, size budget) behind a flag.
- [ ] Cross-checks: skills referenced from AGENTS.md that do not exist.

## 0.4 — deeper skill analysis

- [ ] Optional exact token counts via a pluggable tokenizer interface
      (bring-your-own tiktoken/o200k implementation; core stays local-only).
- [ ] Duplicate/overlapping skill detection across a tree (description
      similarity, no LLM: plain lexical similarity).
- [ ] `skillcheck fix` for mechanically safe fixes (rename folder to match
      name, normalize frontmatter key order).

## Explicit non-goals

- Calling LLMs or any network service from the core tool.
- Executing skill scripts to "verify" them.
- Becoming a general markdown linter; scope stays agent-skill-shaped.

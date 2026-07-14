# Architecture

skillcheck is a small pipeline: **parse → rules → format**. Everything is
synchronous, local, and pure except the filesystem reads.

```
                 src/cli.ts (commander)
                        |
        +---------------+----------------+
        |               |                |
  commands/lint.ts commands/tokens.ts commands/list.ts
        |               |                |
        +-------+-------+--------+-------+
                |                |
          src/parse.ts     src/discover.ts
                |
          src/rules/index.ts  (registry: runRules)
           |         |        |
   rules/frontmatter rules/body rules/links
   (S001-S008,       (S012-S013) (S009, S014)
    S010-S011)
                |
        src/tokenizer.ts (cl100k-style estimate, used by S012 + tokens)
                |
        src/table.ts / picocolors (presentation only)
```

## Modules

| Module | Responsibility |
| --- | --- |
| `src/parse.ts` | Split SKILL.md into frontmatter + body, parse YAML, record errors instead of throwing. Produces `ParsedSkill`. |
| `src/rules/` | One module per concern. Each exports `Rule[]`; `rules/index.ts` concatenates them into the registry and implements `runRules`. |
| `src/tokenizer.ts` | Local approximation of the cl100k_base pre-tokenizer plus per-segment heuristics. No network, no model files. |
| `src/discover.ts` | Recursive `SKILL.md` discovery, skipping `node_modules`, `.git`, `dist`, `coverage`. |
| `src/commands/` | One file per CLI subcommand. Each exposes a pure, testable function (`lintTargets`, `tokenReport`, `listSkills`) plus a `format*` function for terminal output. The CLI layer only wires flags, printing, and exit codes. |
| `src/table.ts` | ANSI-aware column alignment. |
| `src/index.ts` | The public library API. Everything the CLI can do is callable programmatically. |

## Design decisions

- **Rules are data, not switch statements.** A rule is `{ id, name, severity,
  description, check(ctx) }`. The registry sorts by ID and `runRules` handles
  include/exclude filtering and finding collection. Nothing else knows which
  rules exist.
- **Stable IDs.** `S001`-`S014` are contractual: CI configs and `--json`
  consumers pin them. Retired IDs are never reused; new rules take new IDs.
- **Errors vs warnings.** Spec violations (missing fields, format, size
  limits, broken links) are errors and fail the run. Authoring-quality
  guidance (trigger phrases, body budget, naming conventions) is warnings,
  escalatable with `--strict`.
- **Cascade suppression.** If frontmatter is missing (S001) or unparseable
  (S002), the field rules (S003+) stay silent instead of piling on noise.
- **Parse never throws on content.** Malformed YAML becomes
  `frontmatterError` on the `ParsedSkill`, so one broken file cannot abort a
  tree-wide `list`.
- **Token counts are estimates by design.** An exact BPE would need the
  cl100k merge table (~1.7 MB) or a native dependency; the approximation in
  `src/tokenizer.ts` keeps installs light and is good enough for budgeting.
  The interface is one function (`estimateTokens`), so swapping in an exact
  tokenizer later is a non-breaking change (see ROADMAP).
- **Exit codes are the API for CI.** `0` clean, `1` findings, `2` usage/IO
  error — chosen to match common linter conventions.

## Adding a rule

1. Pick the next free ID (check `skillcheck rules`).
2. Implement the `Rule` interface in the matching module under `src/rules/`
   (or add a new module and spread it into the registry in `rules/index.ts`).
3. Guard against cascades: return early when `skill.frontmatter` is `null`
   if your rule reads frontmatter fields.
4. Add tests in `tests/rules.test.ts` (a firing case and a non-firing case),
   and a fixture under `fixtures/` if the rule needs real files on disk.
5. Document the rule in the tables in `README.md` and `README.ja.md`.

## Testing strategy

The vitest suite tests the library functions directly (no subprocess
spawning), using `fixtures/` as a real on-disk corpus for filesystem-touching
rules (S009, S010, S014) and inline sources for the rest. CI additionally
smoke-tests the built CLI binary against the fixtures.

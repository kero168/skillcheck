# skillcheck

> Lint, validate, and measure the token cost of Agent Skills (`SKILL.md`) — fully local, no LLM, no API keys.

[![CI](https://github.com/kero168/skillcheck/actions/workflows/ci.yml/badge.svg)](https://github.com/kero168/skillcheck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

English | [日本語](README.ja.md)

Agent Skills are folders with a `SKILL.md` file that teach AI agents how to do
things. A skill with a vague description never triggers; a skill with a broken
reference wastes a tool call; a bloated skill quietly eats your context window.
**skillcheck** catches all three before you ship — in CI, with plain exit codes,
without ever calling a model.

- **`skillcheck lint`** — validates frontmatter (required `name` / `description`),
  name format, description quality (length and trigger phrases), broken relative
  links, and missing referenced files. Every rule has a stable ID (`S001`–`S014`).
- **`skillcheck tokens`** — estimates what a skill costs at each loading tier
  (metadata always in context → body on trigger → referenced files on demand),
  using a local cl100k-style approximation.
- **`skillcheck list`** — scans a directory tree and prints a health table.
- **`skillcheck rules`** — prints the full rule catalog.

## Install

```bash
npm install -g skillcheck     # global CLI
npx skillcheck list .claude/skills   # or run ad hoc
```

Requires Node.js >= 20. No other runtime dependencies beyond
`commander`, `yaml`, and `picocolors`.

## Usage

### Lint a skill

```console
$ skillcheck lint fixtures/broken-links
fixtures/broken-links/SKILL.md
  error   S009 broken link "references/missing.md": file does not exist (line 8)
  warning S014 referenced file "scripts/does-not-exist.py" does not exist (line 10)

FAIL: 2 problems (1 error, 1 warning) in 1 skill file
```

Exit codes: `0` clean, `1` findings failed the run, `2` usage/IO error.
`--strict` makes warnings fail; `--json` prints machine-readable output for CI.

### Measure token cost

```console
$ skillcheck tokens fixtures/pdf-extractor
Token cost: fixtures/pdf-extractor/SKILL.md

TIER       FILE                                       BYTES  ~TOKENS
---------  -----------------------------------------  -----  -------
metadata   frontmatter metadata (name + description)  152    ~40
body       SKILL.md body                              462    ~129
reference  references/forms.md                        480    ~129
reference  scripts/extract.py                         1061   ~316

always in context  metadata: ~40 tokens (preloaded so the agent can pick skills)
loaded on trigger  SKILL.md body: ~129 tokens
loaded on demand   2 referenced files: ~445 tokens

total if fully loaded: ~614 tokens
```

The three tiers mirror the progressive-disclosure model of Agent Skills:
only the metadata is always resident, so that is the number to keep smallest.

### List every skill in a tree

```console
$ skillcheck list fixtures
STATUS  NAME           ERRORS  WARNINGS  ~TOKENS  PATH
------  -------------  ------  --------  -------  -------------------------------
fail    broken-links   1       1         ~42      fixtures/broken-links/SKILL.md
fail    (unnamed)      1       0         ~17      fixtures/broken-yaml/SKILL.md
ok      commit-helper  0       0         ~134     fixtures/commit-helper/SKILL.md
fail    (unnamed)      1       1         ~22      fixtures/missing-name/SKILL.md
ok      pdf-extractor  0       0         ~129     fixtures/pdf-extractor/SKILL.md

5 skills: 2 ok, 0 warn, 3 fail
```

## Rules

Rule IDs are stable and never reused, so you can pin them in CI and in
`--json` consumers. New rules get new IDs.

| ID | Name | Severity | What it checks |
| --- | --- | --- | --- |
| S001 | missing-frontmatter | error | file starts with a `---` YAML frontmatter block |
| S002 | invalid-frontmatter-yaml | error | frontmatter parses as a YAML mapping |
| S003 | missing-name | error | required `name` field is a non-empty string |
| S004 | missing-description | error | required `description` field is a non-empty string |
| S005 | invalid-name-format | error | `name` is lowercase letters/digits/hyphens, <= 64 chars |
| S006 | description-too-short | warning | description has at least 20 characters |
| S007 | description-too-long | error | description stays within the 1024-character spec limit |
| S008 | no-trigger-phrase | warning | description says *when* to use the skill ("Use when ...") |
| S009 | broken-link | error | relative markdown links resolve to real files |
| S010 | name-directory-mismatch | warning | skill folder is named after the skill |
| S011 | unknown-frontmatter-field | warning | frontmatter uses only known fields |
| S012 | body-too-large | warning | body stays under ~5000 estimated tokens |
| S013 | empty-body | warning | SKILL.md has instructions after the frontmatter |
| S014 | missing-referenced-file | warning | inline-code file paths exist in the skill folder |

Run `skillcheck rules` (or `skillcheck rules --json`) for the same catalog
from the CLI. See [ARCHITECTURE.md](ARCHITECTURE.md) for how to add a rule.

## Spec compliance

skillcheck validates the [Agent Skills](https://code.claude.com/docs/en/skills)
format used by Claude Code, the Claude Agent SDK, and the
[anthropics/skills](https://github.com/anthropics/skills) collection: a
directory containing a `SKILL.md` whose YAML frontmatter has a `name`
(lowercase/digits/hyphens, max 64 chars) and a `description` (max 1024 chars),
with optional `license`, `allowed-tools`, and `metadata` fields. Structural
limits (S005, S007, S011) follow that spec; quality rules (S006, S008, S012)
encode its published authoring guidance and are warnings, not errors.

### What about AGENTS.md?

[AGENTS.md](https://agents.md) is a complementary convention: repository-level
instructions that many coding agents read on every run, while skills are
reusable capabilities that load on demand. skillcheck lints `SKILL.md` only
today. Since AGENTS.md files compete for the same context budget, extending
`tokens` and parts of `lint` to AGENTS.md is on the [roadmap](ROADMAP.md).

## Token estimation, honestly

`skillcheck tokens` uses a small local approximation of the `cl100k_base`
pre-tokenizer (see [`src/tokenizer.ts`](src/tokenizer.ts)) — no network, no
model download. It is deliberately an *estimate*: exact counts differ by
tokenizer and model. Use it to compare skills and catch bloat, not to bill by
the token. If you need exact counts, run your provider's tokenizer over the
same files; the `--json` output gives you the file list.

## Programmatic API

Everything the CLI does is exported as a library:

```ts
import { parseSkillFile, runRules, estimateTokens, discoverSkills } from "skillcheck";

const skill = parseSkillFile(".claude/skills/pdf-extractor/SKILL.md");
const findings = runRules(skill); // Finding[] with ruleId, severity, message, line
const cost = estimateTokens(skill.body);
```

## Development

```bash
git clone https://github.com/kero168/skillcheck.git
cd skillcheck
npm install
npm run build       # tsup -> dist/
npm test            # vitest, uses the skills in fixtures/
npm run typecheck   # tsc --noEmit
node dist/cli.js list fixtures
```

The five skills under [`fixtures/`](fixtures/) (two valid, three deliberately
broken) double as the test corpus and as living documentation of what each
rule catches.

See [CONTRIBUTING.md](CONTRIBUTING.md), [docs/quickstart.md](docs/quickstart.md),
and [ARCHITECTURE.md](ARCHITECTURE.md).

## License

[MIT](LICENSE) © kero168

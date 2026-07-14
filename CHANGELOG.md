# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(pre-1.0: minor versions may include breaking changes, always flagged here).

## [Unreleased]

Nothing yet.

## [0.1.0] - 2026-07-14

### Added

- `skillcheck lint`: validates SKILL.md frontmatter (required `name` /
  `description`), name format and length, description length and trigger-word
  quality, broken relative links, and missing referenced files. `--strict`
  and `--json` flags; exit codes 0/1/2.
- `skillcheck tokens`: per-tier token cost report (metadata / body /
  referenced files) using a local cl100k-style approximation. `--json` flag.
- `skillcheck list`: recursive skill discovery with a health table. `--strict`
  and `--json` flags.
- `skillcheck rules`: prints the rule catalog.
- Rules S001-S014 with stable IDs and an extensible registry.
- Programmatic API: `parseSkillFile`, `parseSkillSource`, `runRules`,
  `estimateTokens`, `discoverSkills`, `lintTargets`, `listSkills`,
  `tokenReport`, and friends.
- Fixture corpus: two valid and three intentionally broken skills, used by
  the vitest suite (50 tests).
- Documentation in English and Japanese; CI, CodeQL, Scorecard, Dependabot,
  and OIDC-based npm release workflows.

[Unreleased]: https://github.com/kero168/skillcheck/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kero168/skillcheck/releases/tag/v0.1.0

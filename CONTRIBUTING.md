# Contributing to skillcheck

Thanks for considering a contribution. This is a small project with a small
surface area; the bar for a good PR is correspondingly low, and reviews aim
to be fast.

## Ground rules

- Be kind. The [Code of Conduct](CODE_OF_CONDUCT.md) applies everywhere.
- Open an issue before large changes so we can agree on direction first.
- Everything must stay **fully local**: no network calls, no LLM calls, no
  telemetry. PRs that add any of these will be declined.
- Keep runtime dependencies minimal. `commander`, `yaml`, and `picocolors`
  are the intended ceiling; propose additions in an issue first.

## Getting set up

```bash
git clone https://github.com/kero168/skillcheck.git
cd skillcheck
npm install
npm run build && npm run typecheck && npm test
```

Node.js >= 20 is required. `node dist/cli.js list fixtures` is a quick smoke
test — it should report 2 ok / 3 fail.

## Making changes

1. Fork and branch from `main`.
2. Make the change, with tests. Rule changes must update `tests/rules.test.ts`;
   new rules need at least one fixture or inline source case that triggers
   them and one that does not.
3. Run `npm run build && npm run typecheck && npm test` locally.
4. Open a PR using the template. Describe *why*, not just *what*.

### Adding a lint rule

See [ARCHITECTURE.md](ARCHITECTURE.md#adding-a-rule). In short: implement the
`Rule` interface, take the next free `SXXX` ID, register it in the module
array, document it in both READMEs, and add tests. IDs are never reused.

### Fixtures

`fixtures/` contains two valid and three intentionally broken skills. Tests
assert their exact findings, so do not "fix" the broken ones. Add new fixtures
rather than mutating existing ones when possible.

## Commit and release conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) are
  appreciated but not enforced.
- Releases are tagged `vX.Y.Z` and published to npm by the release workflow
  (OIDC trusted publishing). See [GOVERNANCE.md](GOVERNANCE.md) for who cuts
  releases and [CHANGELOG.md](CHANGELOG.md) for the format.

## Reporting bugs and security issues

Bugs: use the bug-report issue template and include the SKILL.md that
reproduces the problem if you can share it. Security issues: **do not** open
a public issue; follow [SECURITY.md](SECURITY.md).

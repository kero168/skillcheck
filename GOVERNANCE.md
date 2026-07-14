# Governance

skillcheck is a small, single-maintainer open source project. This document
describes how decisions are made today and how that changes as the project
grows.

## Current model: maintainer-led

- The maintainer(s) listed in [MAINTAINERS.md](MAINTAINERS.md) have commit
  and release rights and make final decisions.
- Direction-setting happens in public: issues for proposals, PRs for changes.
  Substantive decisions are recorded in the issue or PR that made them.
- Anyone may propose anything. "No" always comes with a reason.

## Decision-making

1. **Routine changes** (bug fixes, docs, dependency bumps): one maintainer
   approval merges.
2. **User-facing behavior** (new rules, CLI flags, output changes): needs an
   issue first, so the design is discussed before code review.
3. **Breaking changes** (rule severity changes, removed flags, changed exit
   codes): require a deprecation note in the CHANGELOG one minor release in
   advance whenever practical.

## Becoming a maintainer

Sustained, high-quality contributions (code, review, triage) over a few
months are the path in. An existing maintainer nominates; consensus among
current maintainers confirms. Maintainers who are inactive for 12 months may
be moved to emeritus status after a private check-in.

## Releases

Any maintainer may cut a release: bump the version, update CHANGELOG.md,
tag `vX.Y.Z`, and let the release workflow publish to npm via OIDC trusted
publishing. Versioning follows semver; while the project is pre-1.0, minor
versions may contain breaking changes (flagged in the CHANGELOG).

## Changes to this document

By PR, approved by all current maintainers.

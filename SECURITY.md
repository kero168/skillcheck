# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | yes |

Only the latest minor release receives security fixes.

## Threat model

skillcheck runs entirely locally: it reads files you point it at, never
executes skill code, and makes no network requests. The main risks worth
reporting are:

- path traversal or unexpected filesystem access while resolving skill
  references;
- denial of service through crafted SKILL.md input (catastrophic regex
  backtracking, unbounded recursion in directory walking);
- anything that makes skillcheck execute content from a linted file.

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub private vulnerability reporting](https://github.com/kero168/skillcheck/security/advisories/new).
Do **not** open a public issue for security problems.

What to expect (best-effort commitments from a volunteer-maintained project):

- acknowledgement within 7 days;
- an assessment and, when confirmed, a fix or mitigation plan within 30 days;
- credit in the release notes unless you prefer otherwise.

If you have no GitHub account, contact the maintainer listed in
[MAINTAINERS.md](MAINTAINERS.md) through any channel published there.

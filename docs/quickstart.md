# Quickstart

Five minutes from install to a green CI check.

## 1. Install

```bash
npm install -g skillcheck
# or, per-project:
npm install --save-dev skillcheck
```

Node.js >= 20 required.

## 2. Point it at your skills

Skills usually live in `.claude/skills/` (project) or `~/.claude/skills/`
(personal), one directory per skill with a `SKILL.md` inside.

```bash
skillcheck list .claude/skills
```

You get a health table: `ok` (clean), `warn` (quality warnings), `fail`
(spec violations).

## 3. Fix what it found

```bash
skillcheck lint .claude/skills/my-skill
```

Each finding shows a stable rule ID. Look any of them up with:

```bash
skillcheck rules
```

The usual first offenders:

- **S003/S004** — frontmatter must have `name` and `description`.
- **S008** — the description never says *when* to use the skill. Add a
  phrase like `Use when the user asks to ...`; agents choose skills by
  description alone.
- **S009** — a relative link points at a file that does not exist.

## 4. Check the context cost

```bash
skillcheck tokens .claude/skills/my-skill
```

The `metadata` tier is always loaded into the agent's context, for every
skill you install — keep it lean. The body loads only when the skill
triggers, and referenced files only when read.

## 5. Wire it into CI

```yaml
# .github/workflows/skills.yml
name: skills
on: [push, pull_request]
jobs:
  skillcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npx skillcheck lint .claude/skills --strict
```

`--strict` fails on warnings too; drop it if you only want spec violations
to block merges. Add `--json` and archive the output if you want trend data.

## Troubleshooting

- `error: path not found` / `no SKILL.md found` — the path must be a
  SKILL.md, a skill directory, or an ancestor of one (exit code 2).
- A rule is wrong for your use case — file an issue; per-rule configuration
  is on the [roadmap](../ROADMAP.md).

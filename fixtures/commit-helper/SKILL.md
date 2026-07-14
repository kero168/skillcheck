---
name: commit-helper
description: Generates Conventional Commits style commit messages from staged changes. Use when the user asks for a commit message or wants staged diffs summarized.
---

# Commit Helper

Generate a commit message for the currently staged changes.

## Workflow

1. Inspect the staged diff with `git diff --staged`.
2. Group the changes by intent (feature, fix, refactor, docs, chore).
3. Write a Conventional Commits subject line under 72 characters.
4. Add a body that explains the "why" when the change is not obvious.

## Output format

Return only the commit message, wrapped in a fenced code block, so the user
can copy it directly into their editor or terminal.

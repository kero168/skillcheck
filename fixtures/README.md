# Fixture skills

Sample Agent Skills used by the test suite and by the README examples.

| Skill | Expected result |
| --- | --- |
| `commit-helper/` | valid: zero findings |
| `pdf-extractor/` | valid: zero findings, two referenced files |
| `missing-name/` | invalid: S003 (no `name`), S008 (no trigger phrase) |
| `broken-yaml/` | invalid: S002 (frontmatter is not valid YAML) |
| `broken-links/` | invalid: S009 (broken link), S014 (missing referenced file) |

Do not "fix" the invalid fixtures; the tests assert their exact findings.

import { estimateTokens } from "../tokenizer.js";
import type { Rule } from "../types.js";

/**
 * Soft budget for the SKILL.md body. The Agent Skills guidance is to keep
 * SKILL.md brief and push detail into files that are loaded on demand.
 */
export const BODY_TOKEN_BUDGET = 5000;

export const bodyRules: Rule[] = [
  {
    id: "S012",
    name: "body-too-large",
    severity: "warning",
    description: `SKILL.md body should stay under ~${BODY_TOKEN_BUDGET} estimated tokens; move detail into referenced files`,
    check({ skill, report }) {
      if (skill.frontmatterText === null) {
        return;
      }
      const tokens = estimateTokens(skill.body);
      if (tokens > BODY_TOKEN_BUDGET) {
        report(
          `body is ~${tokens} estimated tokens (budget ${BODY_TOKEN_BUDGET}); split detail into files that are loaded on demand`,
          skill.bodyStartLine
        );
      }
    },
  },
  {
    id: "S013",
    name: "empty-body",
    severity: "warning",
    description: "SKILL.md should contain instructions after the frontmatter",
    check({ skill, report }) {
      if (skill.frontmatterText === null) {
        return;
      }
      if (skill.body.trim().length === 0) {
        report("SKILL.md has no body; add the instructions the agent should follow", skill.bodyStartLine);
      }
    },
  },
];

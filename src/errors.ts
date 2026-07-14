/** Error type for expected, user-facing failures (bad paths, no skills found). */
export class SkillcheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillcheckError";
  }
}

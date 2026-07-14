/**
 * Local, dependency-free approximation of OpenAI's cl100k_base tokenizer.
 *
 * This is NOT an exact BPE implementation and never calls a network or an
 * LLM. It reproduces the cl100k pre-tokenizer segmentation (contractions,
 * letter runs, digit triples, punctuation runs, whitespace) and applies
 * per-segment heuristics:
 *
 * - short ASCII words count as one token, long words split roughly every
 *   six letters;
 * - non-Latin letters (CJK and similar scripts) count roughly one token
 *   per character;
 * - digit runs are pre-split into groups of three, like cl100k;
 * - punctuation and whitespace runs compress.
 *
 * Treat the result as an estimate for budgeting, not an exact count.
 */

const SEGMENT_RE = /'(?:[sdmt]|ll|ve|re)|\s?\p{L}+|\p{N}{1,3}|\s?[^\s\p{L}\p{N}]+|\s+/gu;

/** Estimate the number of cl100k-style tokens in a string. */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }
  const pieces = text.match(SEGMENT_RE);
  if (!pieces) {
    return 0;
  }
  let total = 0;
  for (const piece of pieces) {
    total += estimateSegment(piece);
  }
  return total;
}

function estimateSegment(piece: string): number {
  const core = piece.trim();
  if (core.length === 0) {
    // Pure whitespace runs (blank lines, indentation) compress well in BPE.
    return Math.max(1, Math.ceil(piece.length / 8));
  }
  if (/^\p{N}+$/u.test(core)) {
    // SEGMENT_RE already caps digit runs at three digits per piece.
    return 1;
  }
  if (/^\p{L}+$/u.test(core)) {
    let ascii = 0;
    let other = 0;
    for (const ch of core) {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp < 128) {
        ascii += 1;
      } else {
        other += 1;
      }
    }
    const asciiTokens = ascii === 0 ? 0 : ascii <= 6 ? 1 : 1 + Math.ceil((ascii - 6) / 6);
    return other + asciiTokens;
  }
  // Punctuation / symbol runs: short runs are usually a single token.
  return Math.max(1, Math.ceil(core.length / 3));
}

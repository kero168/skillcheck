import { describe, expect, it } from "vitest";
import { estimateTokens } from "../src/tokenizer.js";

describe("estimateTokens", () => {
  it("returns 0 for empty input", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("counts short English words as one token each", () => {
    expect(estimateTokens("hello world")).toBe(2);
  });

  it("splits digit runs into groups of three like cl100k", () => {
    expect(estimateTokens("2026")).toBe(2);
    expect(estimateTokens("42")).toBe(1);
  });

  it("counts CJK text at roughly one token per character", () => {
    expect(estimateTokens("こんにちは世界")).toBe(7);
  });

  it("is monotonic: more text never means fewer tokens", () => {
    const a = "Lint agent skills locally.";
    expect(estimateTokens(a + a)).toBeGreaterThanOrEqual(estimateTokens(a));
  });

  it("estimates English prose near one token per word plus punctuation", () => {
    const sentence =
      "The quick brown fox jumps over the lazy dog because it wants to reach the other side of the wide green field before sunset. ";
    const text = sentence.repeat(4);
    const words = text.trim().split(/\s+/).length;
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThanOrEqual(words * 0.8);
    expect(tokens).toBeLessThanOrEqual(words * 2);
  });

  it("stays within a plausible chars-per-token band for markdown", () => {
    const markdown = "## Heading\n\n- item one\n- item two\n\nSome `inline code` and a [link](https://example.com).\n";
    const tokens = estimateTokens(markdown);
    expect(tokens).toBeGreaterThanOrEqual(markdown.length / 8);
    expect(tokens).toBeLessThanOrEqual(markdown.length / 2);
  });
});

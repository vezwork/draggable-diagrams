import { describe, expect, it } from "vitest";
import { StringTagger } from "./string-tagger";

describe("StringTagger", () => {
  it("should tag and expand a simple string", () => {
    const tagger = new StringTagger();

    const tagged = tagger.tag("hello", "[", "]");

    // Should have the same length as original
    expect(tagged.length).toBe(5);

    // First and last chars should be PUA markers
    expect(tagged.charCodeAt(0)).toBeGreaterThanOrEqual(0xe000);
    expect(tagged.charCodeAt(4)).toBeGreaterThanOrEqual(0xe000);

    // Middle should be unchanged
    expect(tagged.substring(1, 4)).toBe("ell");

    // Expand it back
    const expanded = tagger.expand(tagged);

    expect(expanded).toBe("[hello]");
  });

  it("should handle multiple tagged spans", () => {
    const tagger = new StringTagger();

    const tagged1 = tagger.tag("red", "\x1b[31m", "\x1b[0m");
    const tagged2 = tagger.tag("blue", "\x1b[34m", "\x1b[0m");

    const combined = tagged1 + " and " + tagged2;

    const expanded = tagger.expand(combined);

    expect(expanded).toBe("\x1b[31mred\x1b[0m and \x1b[34mblue\x1b[0m");
  });

  it("should handle Unicode characters", () => {
    const tagger = new StringTagger();

    // Tag strings with various Unicode characters
    const tagged1 = tagger.tag("你好", "<red>", "</red>");
    const tagged2 = tagger.tag("🎨", "<blue>", "</blue>");
    const tagged3 = tagger.tag("café", "<green>", "</green>");

    const combined = tagged1 + " " + tagged2 + " " + tagged3;

    const expanded = tagger.expand(combined);

    expect(expanded).toBe(
      "<red>你好</red> <blue>🎨</blue> <green>café</green>"
    );
  });

  it("should handle single-character strings", () => {
    const tagger = new StringTagger();

    const tagged = tagger.tag("x", "*", "*");

    expect(tagged.length).toBe(1);

    const expanded = tagger.expand(tagged);

    expect(expanded).toBe("*x*");
  });

  it("should handle empty strings", () => {
    const tagger = new StringTagger();

    const tagged = tagger.tag("", "[", "]");

    expect(tagged).toBe("");

    const expanded = tagger.expand(tagged);

    expect(expanded).toBe("");
  });

  it("should preserve untagged text", () => {
    const tagger = new StringTagger();

    const tagged = tagger.tag("world", "(", ")");
    const combined = "hello " + tagged + " !";

    const expanded = tagger.expand(combined);

    expect(expanded).toBe("hello (world) !");
  });

  it("should handle adjacent tagged spans", () => {
    const tagger = new StringTagger();

    const tagged1 = tagger.tag("a", "[1:", "]");
    const tagged2 = tagger.tag("b", "[2:", "]");
    const tagged3 = tagger.tag("c", "[3:", "]");

    const combined = tagged1 + tagged2 + tagged3;

    const expanded = tagger.expand(combined);

    expect(expanded).toBe("[1:a][2:b][3:c]");
  });

  it("should throw when exceeding maximum spans", () => {
    const tagger = new StringTagger();

    // PUA range is 0xE000 to 0xF8FF (6400 codepoints)
    // We reserve one for the universal end marker, leaving 6399 for start markers
    const maxSpans = 0xf8ff - 0xe000;

    // Tag up to the limit
    for (let i = 0; i < maxSpans; i++) {
      tagger.tag("x", "", "");
    }

    // Next one should throw
    expect(() => tagger.tag("x", "", "")).toThrow("Exceeded maximum");
  });
});

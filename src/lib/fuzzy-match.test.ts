import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzy-match";

describe("fuzzyMatch", () => {
  it("matches an empty query against anything with score 0", () => {
    expect(fuzzyMatch("", "My Lists")).toEqual({ score: 0, indices: [] });
    expect(fuzzyMatch("   ", "My Lists")).toEqual({ score: 0, indices: [] });
  });

  it("returns null when the query cannot match", () => {
    expect(fuzzyMatch("xyz", "My Lists")).toBeNull();
    expect(fuzzyMatch("listss", "lists")).toBeNull();
    expect(fuzzyMatch("ba", "ab")).toBeNull(); // order matters
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("LISTS", "My Lists")).not.toBeNull();
    expect(fuzzyMatch("lists", "MY LISTS")).not.toBeNull();
  });

  it("returns matched indices for substring matches", () => {
    const result = fuzzyMatch("lists", "My Lists");
    expect(result).not.toBeNull();
    expect(result!.indices).toEqual([3, 4, 5, 6, 7]);
  });

  it("returns matched indices for subsequence matches", () => {
    const result = fuzzyMatch("mls", "My Lists");
    expect(result).not.toBeNull();
    expect(result!.indices).toEqual([0, 3, 5]);
  });

  it("scores exact matches above prefix matches", () => {
    const exact = fuzzyMatch("cite", "Cite")!;
    const prefix = fuzzyMatch("cite", "Cite this page")!;
    expect(exact.score).toBeGreaterThan(prefix.score);
  });

  it("scores substring matches above scattered subsequence matches", () => {
    const substring = fuzzyMatch("port", "Import BibTeX")!;
    const scattered = fuzzyMatch("port", "Projects orbit")!;
    expect(substring.score).toBeGreaterThan(scattered.score);
  });

  it("prefers word-start matches", () => {
    const wordStart = fuzzyMatch("ml", "My Lists")!;
    const midWord = fuzzyMatch("ml", "html")!;
    expect(wordStart.score).toBeGreaterThan(midWord.score);
  });

  it("prefers earlier substring matches", () => {
    const early = fuzzyMatch("doc", "Documentation")!;
    const late = fuzzyMatch("doc", "Read the docs")!;
    // Word-aligned both; earlier position wins.
    expect(early.score).toBeGreaterThan(late.score);
  });
});

import { describe, it, expect } from "vitest";
import { toRTF } from "./rtf";

describe("toRTF", () => {
  it("wraps output in an RTF document with header and footer", () => {
    const out = toRTF([{ formattedText: "Hello.", formattedHtml: "Hello." }]);
    expect(out.startsWith("{\\rtf1\\ansi")).toBe(true);
    expect(out.endsWith("}")).toBe(true);
    expect(out).toContain("\\fonttbl");
  });

  it("renders each citation as a hanging-indent paragraph", () => {
    const out = toRTF([
      { formattedText: "First.", formattedHtml: "First." },
      { formattedText: "Second.", formattedHtml: "Second." },
    ]);
    const matches = out.match(/\\li720\\fi-720/g) ?? [];
    expect(matches.length).toBe(2);
    expect(out).toContain("First.");
    expect(out).toContain("Second.");
  });

  it("converts <em> and <i> tags to RTF italic", () => {
    const out = toRTF([
      { formattedText: "Book title.", formattedHtml: "<em>Book title</em>." },
    ]);
    expect(out).toContain("{\\i Book title}");
    expect(out).not.toMatch(/<\/?em>/);
  });

  it("converts <strong> and <b> tags to RTF bold", () => {
    const out = toRTF([
      { formattedText: "Note.", formattedHtml: "<strong>Important</strong>." },
    ]);
    expect(out).toContain("{\\b Important}");
  });

  it("escapes RTF control characters (backslash, braces)", () => {
    const out = toRTF([
      { formattedText: "a\\b{c}d", formattedHtml: "a\\b{c}d" },
    ]);
    expect(out).toContain("a\\\\b\\{c\\}d");
  });

  it("escapes non-ASCII characters using RTF unicode form", () => {
    const out = toRTF([{ formattedText: "Café", formattedHtml: "Café" }]);
    expect(out).toContain("Caf\\u233?");
    expect(out).not.toContain("é");
  });

  it("handles signed 16-bit wrap for high unicode code points", () => {
    // U+FFFD (replacement char, decimal 65533) should wrap to -3
    const out = toRTF([{ formattedText: "�", formattedHtml: "�" }]);
    expect(out).toContain("\\u-3?");
  });

  it("falls back to formattedText when formattedHtml is missing", () => {
    const out = toRTF([{ formattedText: "Plain fallback.", formattedHtml: "" }]);
    expect(out).toContain("Plain fallback.");
  });

  it("renders the list name as a bold centered title when provided", () => {
    const out = toRTF(
      [{ formattedText: "x", formattedHtml: "x" }],
      "My Reading List",
    );
    expect(out).toContain("\\qc\\b\\fs28 My Reading List");
  });

  it("omits the title block when no list name is given", () => {
    const out = toRTF([{ formattedText: "x", formattedHtml: "x" }]);
    expect(out).not.toContain("\\qc\\b\\fs28");
  });

  it("collapses whitespace and strips unknown HTML tags", () => {
    const out = toRTF([
      {
        formattedText: "a b c",
        formattedHtml: "<p>a  <span>b</span>\n\nc</p>",
      },
    ]);
    expect(out).toContain("a b c");
    expect(out).not.toContain("<p>");
    expect(out).not.toContain("<span>");
  });

  it("decodes common HTML entities", () => {
    const out = toRTF([
      {
        formattedText: 'A & B < "C" > D',
        formattedHtml: "A &amp; B &lt; &quot;C&quot; &gt; D",
      },
    ]);
    expect(out).toContain('A & B < "C" > D');
    expect(out).not.toContain("&amp;");
  });

  it("produces empty citation body for an empty citations list", () => {
    const out = toRTF([]);
    expect(out).toContain("\\rtf1");
    expect(out).not.toContain("\\li720");
  });
});

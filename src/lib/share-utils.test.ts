import { describe, expect, it } from "vitest";
import { buildShareSegment, parseShareSegment, slugify } from "./share-utils";

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("Biology 101")).toBe("biology-101");
  });

  it("strips diacritics", () => {
    expect(slugify("Café — René's Notes")).toBe("cafe-rene-s-notes");
  });

  it("collapses runs of non-alphanumeric chars", () => {
    expect(slugify("a---b!!!c???d")).toBe("a-b-c-d");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("  -- hello -- ")).toBe("hello");
  });

  it("returns empty string for input with no slug-able chars", () => {
    expect(slugify("!!!???***")).toBe("");
  });

  it("truncates to 60 chars and trims trailing dash", () => {
    const long = "a".repeat(70) + " " + "b".repeat(10);
    const out = slugify(long);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("-")).toBe(false);
  });
});

describe("parseShareSegment", () => {
  it("returns just the code when no separator is present", () => {
    expect(parseShareSegment("abc123XYZdef")).toEqual({
      slug: null,
      code: "abc123XYZdef",
    });
  });

  it("splits slug and code on the double-dash separator", () => {
    expect(parseShareSegment("biology-101--abc123XYZdef")).toEqual({
      slug: "biology-101",
      code: "abc123XYZdef",
    });
  });

  it("uses the LAST separator when the slug itself contains '--'", () => {
    // Hypothetical edge case if a slug were to contain "--"; the last
    // separator is treated as canonical.
    expect(parseShareSegment("a--b--code")).toEqual({
      slug: "a--b",
      code: "code",
    });
  });
});

describe("buildShareSegment", () => {
  it("returns just the code when no slug is provided", () => {
    expect(buildShareSegment("abc123")).toBe("abc123");
  });

  it("returns just the code when slug is null or empty", () => {
    expect(buildShareSegment("abc123", null)).toBe("abc123");
    expect(buildShareSegment("abc123", "")).toBe("abc123");
  });

  it("joins slug and code with the double-dash separator", () => {
    expect(buildShareSegment("abc123", "biology-101")).toBe(
      "biology-101--abc123",
    );
  });

  it("round-trips with parseShareSegment", () => {
    const segment = buildShareSegment("xyz789", "my-thesis");
    expect(parseShareSegment(segment)).toEqual({
      slug: "my-thesis",
      code: "xyz789",
    });
  });
});

import { describe, expect, it } from "vitest";
import { hashSharePassword, verifySharePassword } from "./share-password";

describe("share-password", () => {
  it("verifies a correct password", () => {
    const hash = hashSharePassword("hunter2");
    expect(verifySharePassword("hunter2", hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = hashSharePassword("hunter2");
    expect(verifySharePassword("hunter3", hash)).toBe(false);
  });

  it("produces different hashes for the same password (unique salt)", () => {
    const a = hashSharePassword("hunter2");
    const b = hashSharePassword("hunter2");
    expect(a).not.toBe(b);
    expect(verifySharePassword("hunter2", a)).toBe(true);
    expect(verifySharePassword("hunter2", b)).toBe(true);
  });

  it("normalizes Unicode (NFKC) so visually-equal passwords match", () => {
    // U+00E9 (precomposed é) vs. U+0065 U+0301 (e + combining acute)
    const hash = hashSharePassword("café");
    expect(verifySharePassword("café", hash)).toBe(true);
  });

  it("returns false for a malformed hash string", () => {
    expect(verifySharePassword("anything", "not-a-real-hash")).toBe(false);
    expect(verifySharePassword("anything", "abc:def")).toBe(false);
  });
});

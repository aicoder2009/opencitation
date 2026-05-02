import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("dns", async () => {
  const actual = await vi.importActual<typeof import("dns")>("dns");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      lookup: vi.fn(),
    },
  };
});

import { promises as dns } from "dns";
import { assertSafeUrl, SafeFetchError } from "./safe-fetch";

const mockLookup = dns.lookup as unknown as ReturnType<typeof vi.fn>;

describe("assertSafeUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-http(s) protocols", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toMatchObject({
      code: "blocked_protocol",
    });
    await expect(assertSafeUrl("ftp://example.com")).rejects.toBeInstanceOf(SafeFetchError);
  });

  it("rejects literal loopback addresses", async () => {
    await expect(assertSafeUrl("http://127.0.0.1/")).rejects.toMatchObject({
      code: "blocked_address",
    });
    await expect(assertSafeUrl("http://[::1]/")).rejects.toMatchObject({
      code: "blocked_address",
    });
  });

  it("rejects literal AWS metadata IP", async () => {
    await expect(assertSafeUrl("http://169.254.169.254/latest/meta-data/")).rejects.toMatchObject({
      code: "blocked_address",
    });
  });

  it("rejects literal RFC1918 ranges", async () => {
    await expect(assertSafeUrl("http://10.0.0.1/")).rejects.toMatchObject({ code: "blocked_address" });
    await expect(assertSafeUrl("http://192.168.1.1/")).rejects.toMatchObject({ code: "blocked_address" });
    await expect(assertSafeUrl("http://172.16.0.1/")).rejects.toMatchObject({ code: "blocked_address" });
  });

  it("rejects hostnames that resolve to private IPs", async () => {
    mockLookup.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(assertSafeUrl("http://internal.evil.example/")).rejects.toMatchObject({
      code: "blocked_address",
    });
  });

  it("allows hostnames that resolve to public IPs", async () => {
    mockLookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    const result = await assertSafeUrl("https://example.com/");
    expect(result.hostname).toBe("example.com");
  });

  it("rejects when DNS lookup fails", async () => {
    mockLookup.mockRejectedValueOnce(new Error("nxdomain"));
    await expect(assertSafeUrl("https://does-not-exist.example/")).rejects.toMatchObject({
      code: "dns_failed",
    });
  });

  it("rejects malformed URLs", async () => {
    await expect(assertSafeUrl("not a url")).rejects.toMatchObject({ code: "invalid_url" });
  });
});

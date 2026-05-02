import { promises as dns } from "dns";
import net from "net";

function ipv4ToInt(ip: string): number {
  // 32-bit unsigned; use unsigned right shift to keep result non-negative.
  return ip
    .split(".")
    .reduce((acc, oct) => ((acc << 8) | parseInt(oct, 10)) >>> 0, 0);
}

const PRIVATE_IPV4_BLOCKS: Array<[number, number]> = [
  ["0.0.0.0", "0.255.255.255"],
  ["10.0.0.0", "10.255.255.255"],
  ["100.64.0.0", "100.127.255.255"],
  ["127.0.0.0", "127.255.255.255"],
  ["169.254.0.0", "169.254.255.255"],
  ["172.16.0.0", "172.31.255.255"],
  ["192.0.0.0", "192.0.0.255"],
  ["192.168.0.0", "192.168.255.255"],
  ["198.18.0.0", "198.19.255.255"],
  ["224.0.0.0", "239.255.255.255"],
  ["240.0.0.0", "255.255.255.255"],
].map(([s, e]) => [ipv4ToInt(s), ipv4ToInt(e)] as [number, number]);

function isBlockedIPv4(ip: string): boolean {
  const v = ipv4ToInt(ip);
  return PRIVATE_IPV4_BLOCKS.some(([s, e]) => v >= s && v <= e);
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  // Map IPv4-in-IPv6
  const v4Mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
  if (v4Mapped) return isBlockedIPv4(v4Mapped[1]);
  // fc00::/7 unique-local
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  // multicast ff00::/8
  if (lower.startsWith("ff")) return true;
  return false;
}

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
  allowedProtocols?: ReadonlyArray<"http:" | "https:">;
}

export class SafeFetchError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "SafeFetchError";
  }
}

/**
 * Validate that a user-supplied URL is safe to fetch from a server.
 * Rejects non-http(s) protocols and hostnames that resolve to private,
 * loopback, link-local, or otherwise reserved address space.
 *
 * Note: this is best-effort against SSRF. DNS rebinding (resolved IP
 * changing between this check and the actual connect) is not prevented.
 */
export async function assertSafeUrl(
  rawUrl: string,
  allowedProtocols: ReadonlyArray<"http:" | "https:"> = ["https:", "http:"]
): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("Invalid URL", "invalid_url");
  }

  if (!allowedProtocols.includes(parsed.protocol as "http:" | "https:")) {
    throw new SafeFetchError("Only http(s) URLs are allowed", "blocked_protocol");
  }

  const rawHostname = parsed.hostname;
  if (!rawHostname) {
    throw new SafeFetchError("Missing hostname", "invalid_url");
  }
  // Node's WHATWG URL keeps brackets around IPv6 hostnames; strip them
  // so the IP-classification helpers receive a bare address.
  const hostname =
    rawHostname.startsWith("[") && rawHostname.endsWith("]")
      ? rawHostname.slice(1, -1)
      : rawHostname;

  // Direct literal IP check
  if (net.isIP(hostname)) {
    if (net.isIPv4(hostname) ? isBlockedIPv4(hostname) : isBlockedIPv6(hostname)) {
      throw new SafeFetchError("Address is in a reserved range", "blocked_address");
    }
    return parsed;
  }

  // Resolve and check every returned address
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SafeFetchError("DNS lookup failed", "dns_failed");
  }

  for (const { address, family } of addrs) {
    const blocked = family === 4 ? isBlockedIPv4(address) : isBlockedIPv6(address);
    if (blocked) {
      throw new SafeFetchError("Hostname resolves to a reserved address", "blocked_address");
    }
  }

  return parsed;
}

/**
 * Fetch a remote URL with SSRF guards, a hard timeout, and a response-size cap.
 * Returns the body as text. Throws SafeFetchError on policy violations.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<{ status: number; ok: boolean; text: string; finalUrl: string }> {
  const {
    maxBytes = 5 * 1024 * 1024, // 5 MB default
    timeoutMs = 10_000,
    headers,
    allowedProtocols,
  } = options;

  const safe = await assertSafeUrl(rawUrl, allowedProtocols);

  const response = await fetch(safe.toString(), {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });

  // We requested redirect: manual so we can validate the next hop too.
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) {
      throw new SafeFetchError("Redirect without Location", "invalid_redirect");
    }
    const next = new URL(location, safe).toString();
    return safeFetchText(next, { ...options, timeoutMs });
  }

  const declared = Number(response.headers.get("content-length") || 0);
  if (declared && declared > maxBytes) {
    throw new SafeFetchError("Response too large", "too_large");
  }

  if (!response.body) {
    return { status: response.status, ok: response.ok, text: "", finalUrl: response.url };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      reader.cancel().catch(() => {});
      throw new SafeFetchError("Response too large", "too_large");
    }
    chunks.push(value);
  }

  const buf = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  return { status: response.status, ok: response.ok, text, finalUrl: response.url };
}

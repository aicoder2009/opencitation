## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-28 - [SSRF via Unrestricted Node.js fetch]
**Vulnerability:** The application used Node.js native `fetch` to scrape arbitrary URLs supplied by the user (`/api/lookup/url`) without checking the resolved IP address.
**Learning:** This exposes internal services (e.g., `127.0.0.1`, AWS metadata `169.254.169.254`, or VPC private subnets) to Server-Side Request Forgery (SSRF). Attackers can bypass domain-based blocklists by pointing their domain to an internal IP (DNS rebinding) or simply providing a local IP.
**Prevention:** To prevent SSRF when using native `fetch`, validate protocols (e.g., only `http:` and `https:`) and perform pre-fetch DNS validation using `dns.lookup`. Ensure the resolved IP does not fall within private, loopback, or reserved IP ranges before initiating the HTTP request.

## 2025-02-28 - [DNS Rebinding Mitigation Tradeoffs]
**Vulnerability:** Even when performing pre-fetch DNS validation before calling native `fetch(url)` in Node.js to protect against SSRF, an attacker can use DNS Rebinding to switch the IP address between the Time-Of-Check (TOC) and Time-Of-Use (TOU).
**Learning:** Fixing TOCTOU completely in native `fetch` by rewriting the URL to use the resolved IP breaks Server Name Indication (SNI) and TLS certificate validation for HTTPS requests, making it impractical without introducing other major flaws.
**Prevention:** Full protection against DNS rebinding while preserving SNI in Node.js requires using lower-level custom HTTP agents (like `undici` directly) with pinned DNS resolution. Since this is an architectural change, the initial pre-fetch validation check provides the best defense-in-depth tradeoff for this specific codebase constraints.

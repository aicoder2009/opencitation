## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.
## 2025-02-28 - [XSS via unsanitized marked output]
**Vulnerability:** The application was using the `marked` library to parse Markdown content into HTML (in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`) and subsequently rendering it using `dangerouslySetInnerHTML` without proper sanitization.
**Learning:** `marked` does not sanitize HTML by default. While this may seem safe for trusted inputs (like internal docs or GitHub releases), if malicious input manages to enter these sources, it leads directly to an XSS vulnerability.
**Prevention:** The output of `marked` (or any markdown parser) must always be wrapped with `DOMPurify.sanitize()` (using `isomorphic-dompurify` for SSR) before being passed to `dangerouslySetInnerHTML`.

## 2025-06-29 - Fix SSRF in bulk lookup API
**Vulnerability:** The bulk lookup API (`/api/lookup/bulk`) used `fetch()` with dynamically derived hostnames (`request.nextUrl.origin`) for loopback requests to internal route handlers. This is an SSRF vulnerability because `request.nextUrl.origin` is constructed using the user-controllable `Host` header.
**Learning:** Using `request.nextUrl.origin` inside internal `fetch` requests can allow attackers to spoof the `Host` header and redirect internal server requests to arbitrary domains.
**Prevention:** Call Next.js API route handlers directly as imported functions with synthetic `NextRequest` objects instead of performing HTTP loopback requests.

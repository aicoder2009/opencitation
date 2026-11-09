## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.
## 2025-02-28 - [XSS via unsanitized marked output]
**Vulnerability:** The application was using the `marked` library to parse Markdown content into HTML (in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`) and subsequently rendering it using `dangerouslySetInnerHTML` without proper sanitization.
**Learning:** `marked` does not sanitize HTML by default. While this may seem safe for trusted inputs (like internal docs or GitHub releases), if malicious input manages to enter these sources, it leads directly to an XSS vulnerability.
**Prevention:** The output of `marked` (or any markdown parser) must always be wrapped with `DOMPurify.sanitize()` (using `isomorphic-dompurify` for SSR) before being passed to `dangerouslySetInnerHTML`.
## 2025-03-08 - Fixed SSRF in bulk lookup API

**Vulnerability:** Server-Side Request Forgery (SSRF) risk in `src/app/api/lookup/bulk/route.ts` where it was using `fetch(\`\${request.nextUrl.origin}/api/lookup/...\`)`. `request.nextUrl.origin` is dynamically derived from the potentially attacker-controllable `Host` header.
**Learning:** Using loopback fetches to internal APIs based on request headers is a common SSRF vector. Next.js App Router exposes the route handler functions, so we can directly invoke them rather than doing loopback fetches.
**Prevention:** Always directly import and invoke internal Next.js Route Handler functions instead of performing loopback HTTP `fetch` requests with dynamically derived hostnames. Pass a synthetic `NextRequest` with only safe, required headers if invoking handlers directly.

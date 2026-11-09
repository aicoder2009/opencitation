## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.
## 2025-02-28 - [XSS via unsanitized marked output]
**Vulnerability:** The application was using the `marked` library to parse Markdown content into HTML (in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`) and subsequently rendering it using `dangerouslySetInnerHTML` without proper sanitization.
**Learning:** `marked` does not sanitize HTML by default. While this may seem safe for trusted inputs (like internal docs or GitHub releases), if malicious input manages to enter these sources, it leads directly to an XSS vulnerability.
**Prevention:** The output of `marked` (or any markdown parser) must always be wrapped with `DOMPurify.sanitize()` (using `isomorphic-dompurify` for SSR) before being passed to `dangerouslySetInnerHTML`.

## 2024-06-15 - Host-header SSRF via loopback fetch
**Vulnerability:** The bulk lookup API (`/api/lookup/bulk/route.ts`) used `request.nextUrl.origin` to construct loopback URLs for fetching individual metadata via `fetch()`. Because `request.nextUrl.origin` is derived from the user-controlled `Host` header, an attacker could spoof the `Host` header to route the `fetch` request to an internal private IP or internal metadata endpoints, bypassing typical SSRF safeguards on direct URL inputs.
**Learning:** Never rely on user-controlled headers (like `Host`) to build URLs for internal server-side `fetch` requests. Loopback calls via HTTP are intrinsically dangerous in this scenario.
**Prevention:** Instead of using HTTP loopback `fetch()`, dynamically import and directly invoke internal Next.js Route Handler functions (e.g., the `POST` method of a sibling route) by creating and passing a synthetic `NextRequest` object.

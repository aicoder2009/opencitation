## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-28 - [SSRF via unsanitized URL fetch]
**Vulnerability:** The application was making direct outgoing HTTP requests (`fetch`) based on user-supplied URLs without validating the resolved IP address in `/api/lookup/url/route.ts`.
**Learning:** This is a classic pattern for Server-Side Request Forgery (SSRF). An attacker could submit a URL pointing to internal or private IP addresses (like `127.0.0.1` or `169.254.169.254` AWS metadata service) causing the server to fetch and potentially expose internal service data to the attacker.
**Prevention:** Always validate the resolved IP address of any user-supplied URL prior to making backend requests. Abort the connection if the DNS resolution points to internal, loopback, or private network blocks. Note: Full DNS rebinding protection against native `fetch` requires dedicated client agents like `undici`.

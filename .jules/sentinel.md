## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.
## 2025-02-28 - [XSS via unsanitized marked output]
**Vulnerability:** The application was using the `marked` library to parse Markdown content into HTML (in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`) and subsequently rendering it using `dangerouslySetInnerHTML` without proper sanitization.
**Learning:** `marked` does not sanitize HTML by default. While this may seem safe for trusted inputs (like internal docs or GitHub releases), if malicious input manages to enter these sources, it leads directly to an XSS vulnerability.
**Prevention:** The output of `marked` (or any markdown parser) must always be wrapped with `DOMPurify.sanitize()` (using `isomorphic-dompurify` for SSR) before being passed to `dangerouslySetInnerHTML`.

## 2024-06-03 - Missing CSRF Protection on Mutating API Routes
**Vulnerability:** Several authenticated POST endpoints (e.g., creating lists, citations, projects, and share links) were missing the `isSameOrigin` check, leaving them vulnerable to Cross-Site Request Forgery (CSRF). While `stats/increment` was protected, core mutating routes were not.
**Learning:** Next.js Route Handlers do not automatically protect against CSRF attacks. Although Clerk provides authentication, an attacker could still forge cross-origin POST requests on behalf of an authenticated user to perform state mutations unless the Origin/Referer headers are explicitly validated against the host.
**Prevention:** Always enforce an `isSameOrigin` validation check (or use proper CSRF tokens) on all authenticated, state-mutating API routes (POST, PUT, DELETE, PATCH). Read-only or lookup routes without state mutation typically do not require it.

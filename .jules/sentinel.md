## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-14 - Unsanitized Markdown Rendering (XSS Risk)
**Vulnerability:** The application was using the `marked` library to parse markdown and then directly injecting the resulting HTML into React components via `dangerouslySetInnerHTML` in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`, without any sanitization.
**Learning:** `marked` does not sanitize HTML by default. If the markdown source is ever compromised (e.g., if a GitHub release contains a malicious payload, or if `docs/content` files are user-generated in the future), this would lead to a Cross-Site Scripting (XSS) vulnerability.
**Prevention:** Always wrap the output of `marked()` with `DOMPurify.sanitize()` (using `isomorphic-dompurify` for SSR compatibility) before passing it to `dangerouslySetInnerHTML`.

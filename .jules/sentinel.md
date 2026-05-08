## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-05-08 - [XSS via unsanitized dangerouslySetInnerHTML from marked]
**Vulnerability:** The application was passing unvalidated HTML variables returned by `marked` to React's `dangerouslySetInnerHTML` prop in multiple components like `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`.
**Learning:** `marked` does not sanitize HTML by default. If a markdown source (like GitHub release notes) contains malicious HTML payloads, it can execute arbitrary scripts via `dangerouslySetInnerHTML`.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. Wrap the `marked` library output with `DOMPurify.sanitize()` using a library like `isomorphic-dompurify`.

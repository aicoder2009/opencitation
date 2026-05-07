## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-28 - [XSS via unsanitized marked output]
**Vulnerability:** The application was using the `marked` library to parse Markdown content and passing the raw output to React's `dangerouslySetInnerHTML` prop in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts` without sanitization.
**Learning:** The `marked` library does not sanitize HTML by default. This is a common pattern for Cross-Site Scripting (XSS). If a GitHub release body or a Markdown file contained malicious scripts, an attacker could execute arbitrary scripts in a user's session.
**Prevention:** Always sanitize the output of `marked` using a library like `isomorphic-dompurify` (e.g., `DOMPurify.sanitize()`) before rendering it via `dangerouslySetInnerHTML` to safely strip malicious scripts from the HTML payload.

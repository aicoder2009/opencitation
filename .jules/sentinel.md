## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2024-05-28 - [XSS] Missing HTML Sanitization in Docs & Changelog Rendering
**Vulnerability:** The application was passing the output of `marked()` (which parses Markdown to HTML but does not sanitize it) directly into React's `dangerouslySetInnerHTML` in the changelog page (`src/app/docs/changelog/page.tsx`) and general docs (`src/lib/docs.ts`), introducing a Cross-Site Scripting (XSS) vulnerability if malicious Markdown was ever loaded (e.g. from GitHub release notes).
**Learning:** The `marked` library does not sanitize HTML by default. When rendering Markdown content fetched from external sources (like GitHub APIs) or local files into React, it must be sanitized, as it is a textbook XSS vector.
**Prevention:** Always wrap the output of `marked()` with `DOMPurify.sanitize()` (using `isomorphic-dompurify` in Next.js) before passing it to `dangerouslySetInnerHTML`.

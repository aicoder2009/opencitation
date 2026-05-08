## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-28 - [XSS via marked() and dangerouslySetInnerHTML in Docs]
**Vulnerability:** The application was parsing external markdown files (e.g. GitHub release notes in changelog) using `marked()` and passing the raw output directly into React's `dangerouslySetInnerHTML`.
**Learning:** `marked()` does not sanitize HTML by default. Content pulled from external APIs or potentially modifiable sources poses an XSS risk if rendered directly, even if it "looks" like safe markdown.
**Prevention:** Whenever parsing markdown to HTML (especially with `marked`), always sanitize the resulting HTML output using `isomorphic-dompurify` before passing it to `dangerouslySetInnerHTML`.

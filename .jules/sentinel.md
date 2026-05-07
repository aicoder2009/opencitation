## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2026-05-07 - [XSS via Unsanitized Markdown Parsing]
**Vulnerability:** The application was using the `marked` library to parse Markdown content and passing the raw HTML output directly to `dangerouslySetInnerHTML` in `src/app/docs/changelog/page.tsx` and rendering it through `src/lib/docs.ts`.
**Learning:** The `marked` library does not sanitize HTML by default. If the Markdown content (e.g., from GitHub releases or local files) contains malicious HTML or scripts, it will be executed when rendered by React, leading to a Cross-Site Scripting (XSS) vulnerability.
**Prevention:** Always wrap the output of Markdown parsers like `marked` with a sanitizer such as `DOMPurify` (using `isomorphic-dompurify` for SSR compatibility) before passing it to `dangerouslySetInnerHTML`.

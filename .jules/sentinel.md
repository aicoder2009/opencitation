## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2026-05-05 - [XSS via unsanitized marked library output]
**Vulnerability:** The application was parsing Markdown using the `marked` library and passing the resulting HTML directly to React's `dangerouslySetInnerHTML` prop in `src/app/docs/changelog/page.tsx` and `src/lib/docs.ts`.
**Learning:** The `marked` library does not sanitize HTML by default. If the source Markdown contains raw, malicious HTML tags (e.g., `<script>`), `marked` will pass them through untouched, leading to Cross-Site Scripting (XSS) when rendered by React. Even content from seemingly trusted sources like local files or GitHub release notes should be treated as untrusted.
**Prevention:** Always wrap the output of Markdown parsers like `marked` with a dedicated HTML sanitizer like `DOMPurify` (using `isomorphic-dompurify` in Next.js) before rendering it with `dangerouslySetInnerHTML`.

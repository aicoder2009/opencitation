## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-28 - Enforce XSS Sanitization on all Markdown Renders
**Vulnerability:** The application was using the `marked` library to parse Markdown content into HTML and rendering it via React's `dangerouslySetInnerHTML` without proper sanitization. Specifically, in `src/app/docs/changelog/page.tsx` (parsing untrusted external data from GitHub releases) and `src/lib/docs.ts` (parsing static markdown files).
**Learning:** `marked` does not sanitize HTML by default. When wrapping its output in `dangerouslySetInnerHTML`, it directly exposes the application to Cross-Site Scripting (XSS) vulnerabilities if the input is untrusted or tampered with.
**Prevention:** Always wrap the output of `marked()` with `DOMPurify.sanitize()` (via `isomorphic-dompurify` for SSR/Server Components) before passing it to `dangerouslySetInnerHTML`.

## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2024-05-10 - XSS Vulnerability in Markdown Rendering
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability via un-sanitized Markdown output from `marked` being passed into `dangerouslySetInnerHTML`.
**Learning:** By default, the `marked` library in this project returns raw, potentially malicious HTML. It does not sanitize the input. Passing its output directly to React's `dangerouslySetInnerHTML` exposes the application to XSS attacks.
**Prevention:** Always wrap the output of `marked` (or any markdown parser) with `DOMPurify.sanitize()` (using `isomorphic-dompurify` for server-side compatibility) before rendering it using `dangerouslySetInnerHTML`.

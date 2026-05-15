## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-05-01 - Missing Sanitization in Markdown Rendering
**Vulnerability:** Found multiple instances where the output of the `marked` library was directly passed to React's `dangerouslySetInnerHTML` without any HTML sanitization, introducing a critical Cross-Site Scripting (XSS) risk.
**Learning:** By default, the `marked` library only parses Markdown into HTML; it does not sanitize the output. Directly rendering its output exposes the application to XSS attacks if the source Markdown contains malicious embedded HTML or `<script>` tags.
**Prevention:** All parsed HTML output from Markdown libraries (like `marked`) must be strictly sanitized using a library like `isomorphic-dompurify` (calling `DOMPurify.sanitize()`) prior to being rendered in the DOM, especially when using potentially dangerous hooks like `dangerouslySetInnerHTML`.

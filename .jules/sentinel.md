## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-02-28 - [XSS via un-sanitized Markdown output]
**Vulnerability:** The markdown parsed HTML was being rendered directly via React's `dangerouslySetInnerHTML` in the `src/app/docs/changelog/page.tsx` and the `src/lib/docs.ts` utility that feeds multiple documentation pages. This is problematic since marked output is not inherently safe, allowing for Cross-Site Scripting (XSS) if untrusted content was processed.
**Learning:** Using libraries to parse markdown like `marked` without wrapping their outputs into a sanitizer when rendering through React properties like `dangerouslySetInnerHTML` can open up paths to execute arbitrary JS in a user's browser.
**Prevention:** It is required to sanitize untrusted markup. Using tools like `isomorphic-dompurify` to parse and strip out malicious payload effectively patches XSS vulnerabilities stemming from unsafe markdown parsing output.

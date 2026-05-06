## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-05-06 - [XSS via Unsanitized Markdown Parsing in Docs and Changelog]
**Vulnerability:** The application parsed external markdown data (such as GitHub release notes and local documentation files) using `marked` and directly injected the resulting HTML into the DOM via React's `dangerouslySetInnerHTML`.
**Learning:** `marked` does not sanitize the HTML it generates by default. If the source markdown contains malicious HTML or script tags, it will be evaluated when rendered. This gap applies both to API-fetched markdown (e.g., GitHub releases) and markdown read from the filesystem, if it's considered untrusted or externally modifiable.
**Prevention:** Always pipe the output of markdown parsers like `marked` through a sanitizer such as `isomorphic-dompurify` (using `DOMPurify.sanitize()`) before injecting it into the DOM with `dangerouslySetInnerHTML`.

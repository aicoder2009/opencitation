## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2025-05-03 - Cross-Site Scripting (XSS) via Unsanitized Markdown Rendering
**Vulnerability:** The application was passing the output of `marked()` directly into React's `dangerouslySetInnerHTML` in multiple documentation pages (`src/app/docs/changelog/page.tsx` and via `src/lib/docs.ts`).
**Learning:** The `marked` library does not sanitize HTML by default. If a user controlled the markdown input, or if an upstream source (like a GitHub release body) were compromised, malicious scripts could be executed in the victim's browser.
**Prevention:** Always wrap the output of markdown parsers (like `marked`) with a dedicated sanitizer (like `DOMPurify.sanitize()`) before injecting it into the DOM, even for internal or trusted-seeming sources (defense in depth).

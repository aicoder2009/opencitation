## 2025-02-28 - [XSS via unsanitized dangerouslySetInnerHTML]
**Vulnerability:** The application was passing unvalidated HTML variables, specifically `citation.formattedHtml`, to React's `dangerouslySetInnerHTML` prop in multiple components (`src/components/wiki/sortable-citation.tsx`, `src/app/cite/page.tsx`, `src/app/share/[code]/page.tsx`).
**Learning:** This is a classic pattern for Cross-Site Scripting (XSS). If a citation's contents originated from an untrusted source or were maliciously formatted, an attacker could execute arbitrary scripts in a user's session when the citation is rendered.
**Prevention:** Always sanitize any untrusted or dynamic HTML before rendering it in React. In a Next.js (SSR) application, use a library like `isomorphic-dompurify` to safely strip malicious scripts from the HTML payload on both the client and server side without hydration errors.

## 2026-04-30 - [XSS via unsanitized dangerouslySetInnerHTML in CitationAddModal]
**Vulnerability:** The `CitationAddModal` component in `src/components/wiki/citation-add-modal.tsx` was passing `generatedCitation.html` to React's `dangerouslySetInnerHTML` prop without sanitization.
**Learning:** This is an ongoing pattern in this codebase where dynamic HTML (e.g., formatted citations) is rendered unsanitized, posing a significant Cross-Site Scripting (XSS) risk if the source data is ever maliciously manipulated or derived from untrusted inputs.
**Prevention:** All instances of `dangerouslySetInnerHTML` in the application must be explicitly wrapped with `DOMPurify.sanitize()` (via `isomorphic-dompurify`), even for preview components. This ensures defense-in-depth against XSS.

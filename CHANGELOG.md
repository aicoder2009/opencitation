# Changelog

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.1.0] — 2026-05-10

### Added
- BibTeX file upload with multi-entry import
- In-app docs section (`/docs`) with changelog, citation style guide, and help articles
- Changelog page backed by GitHub Releases (falls back to recent commits)
- Edit on GitHub link on all docs pages
- Save-to-account clone and email sharing for shared lists and projects
- Access date calendar picker (future dates disabled)
- Month dropdown for publication date
- WikiSelect custom dropdown — replaces all native `<select>` elements
- Multi-select checkboxes and bulk actions on list page (copy BibTeX, delete, export)
- Citation add modal with rapid-entry mode
- Project labels on list pages
- Copy BibTeX button on bulk selection toolbar
- PostHog analytics integration with full coverage across all pages
- Wikipedia 2005-style restyle for sign-in and sign-up pages
- In-text citation display alongside full citations

### Fixed
- Citation engine audit: XSS href escaping, Harvard initial spacing, MLA unescaped fields
- Editors-only book citations, HTML escaping, and author separator formatting
- APA, MLA, and Chicago formatter accuracy across multiple edge cases
- In-text citation accuracy fixes for all four styles
- Drag handle had `rounded` class — removed to match no-radius design rule
- Hardcoded colors on home page replaced with `wiki-*` tokens

### Changed
- All inline card/table actions bracketed (`[copy]`, `[edit]`, `[delete]`) per design system
- Inline validation errors on create-name form fields
- Loading states replaced with `animate-spin` SVG spinners (no more plain text)
- Filled Save buttons replaced with `WikiButton`; tag actions bracketed
- Destructive confirmation dialogs now name the item being deleted
- Dropdown positioning fixed: More menu anchored below its button, right-aligned
- Save as Template button moved next to Generate Citation
- Concurrent bulk lookup for better performance; `Map`-based label lookup
- `WikiTabs` updated with ARIA roles for accessibility
- Cite page state messaging aligned with design system

### Security
- API surface hardened against SSRF, XSS, and abuse vectors
- URL lookup route: restricted allowlist, input sanitization
- Stats endpoint: auth required; raw DB query helper removed

### Performance
- `Cache-Control` headers on share, list, and project GET endpoints
- Memoized derived state and parallelized data fetch on list detail page

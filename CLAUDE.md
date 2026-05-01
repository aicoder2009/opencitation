# CLAUDE.md

## Project Overview

**OpenCitation** is a citation manager with a Wikipedia 2005-inspired UI. Target audience: students, researchers, professionals.

**Core features:** Generate citations from URLs / DOIs / ISBNs / PubMed IDs / arXiv IDs / Wikipedia, organize into Lists and Projects, share via public links, export in multiple formats, use offline (PWA + Electron).

## Commands

```bash
npm run dev             # Next dev server
npm run build           # Production build
npm run lint            # ESLint
npm run test            # Vitest (watch mode)
npm run test:run        # Vitest (single run, 225 tests)
npm run electron:dev    # Electron + Next dev together
npm run electron:build  # Package desktop app (mac/win/linux variants available)
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Auth:** Clerk
- **Database:** DynamoDB (AWS SDK v3, single-table design) + offline IndexedDB mirror
- **Desktop:** Electron 34 (wraps the same Next app)
- **PWA:** Service worker + offline store + sync manager
- **DnD:** `@dnd-kit` for reorderable citations
- **Testing:** Vitest + Testing Library (225 tests)

## Architecture

### Citation Engine (`src/lib/citation/`)
- **Styles:** APA 7th, MLA 9th, Chicago 17th, Harvard
- **Source types (11):** Book, Journal, Website, Blog, Newspaper, Video, Image, Film, TV Series, TV Episode, Miscellaneous
- **Access types (5):** Print, Database, Web, App, Archive
- **Exporters:** BibTeX (`.bib`), RIS (`.ris`), plain `.txt`
- Both full citations and in-text citations are formatted here (`generateInTextCitation`)

### API Routes (`src/app/api/`)
| Endpoint | Purpose |
|----------|---------|
| `/api/lookup/url` | Extract metadata via OpenGraph |
| `/api/lookup/doi` | Query CrossRef |
| `/api/lookup/isbn` | Query Open Library / Google Books |
| `/api/lookup/pubmed` | Query PubMed (biomedical) |
| `/api/lookup/arxiv` | Query arXiv (preprints) |
| `/api/lookup/wikipedia` | Query Wikipedia |
| `/api/lookup/bulk` | Batch lookup |
| `/api/lists/` | Lists CRUD (+ nested citations) |
| `/api/projects/` | Projects CRUD (+ nested lists) |
| `/api/share/` | Public share links (`/share/[code]`) |
| `/api/badge/` | Embeddable badge image |
| `/api/stats/` | Public usage stats (+ `/stats/increment`) |
| `/api/report-issue/` | Forward issue reports to GitHub |

### Data Model (DynamoDB, single-table in `src/lib/db/dynamodb.ts`)
```
User Account (Clerk)
├── Project (container for Lists)
│   └── List (collection of Citations)
│       └── Citation
└── Standalone Lists (no project)
```
Query helpers live in `src/lib/db/queries.ts`. Offline mirror and optimistic writes are in `src/lib/db/local-store.ts` (IndexedDB) and `src/lib/pwa/sync-manager.ts`.

### Key Directories
```
src/
├── app/                    # Next.js pages & API routes
│   ├── cite/               # Citation generator
│   ├── lists/              # Lists management
│   ├── projects/           # Projects management
│   ├── share/[code]/       # Public share pages
│   ├── embed/              # Embeddable citation widget
│   ├── home/               # Marketing / landing
│   ├── sign-in/, sign-up/  # Clerk auth pages
│   └── api/                # REST endpoints (see table above)
├── components/
│   ├── wiki/               # Wikipedia-style UI (layout, tabs, buttons, template picker, shortcut help, sortable citation)
│   ├── pwa/                # PWA provider, offline indicator, Safari install banner
│   └── retro/              # Retro ASCII print animation
├── lib/
│   ├── citation/           # Formatters + exporters
│   ├── db/                 # DynamoDB client, queries, offline store
│   ├── pwa/                # Service worker utils, offline store, sync manager
│   ├── templates.ts        # Citation templates (prefilled fields)
│   └── keyboard-shortcuts.ts
└── types/                  # TypeScript definitions

electron/                   # Electron main + preload (desktop app)
browser-extension/          # Chromium-style extension (one-click cite from any page)
```

## Design Philosophy

Early-mid 2000s Wikipedia aesthetic: clean, information-dense, utilitarian. Generous whitespace, serif body text, minimal chrome. Dark mode supported via CSS variables in `globals.css`.

## Common Tasks

### Adding a Citation Style
1. Create formatter in `src/lib/citation/formatters/<style>.ts`
2. Register it in `src/lib/citation/index.ts` (`formatCitation` switch + `getFormatter`) and add an in-text branch in `generateInTextCitation`
3. Add tests in `<style>.test.ts`
4. Add to `CITATION_STYLES` in `src/app/cite/page.tsx`

### Adding a Source Type
1. Add to `src/types/source-types.ts`
2. Add form fields in `src/app/cite/page.tsx` (`renderSourceFields`)
3. Handle in all 4 formatters + exporters (BibTeX, RIS)
4. Add tests

### Adding a Lookup Provider
1. New route at `src/app/api/lookup/<provider>/route.ts` that normalizes results into `CitationFields`
2. Wire into the lookup UI in `src/app/cite/page.tsx`
3. Add a route test

## Development Guidelines

- Favor simplicity; avoid over-engineering or speculative abstractions
- Write tests for citation formatting and API route logic
- Comments only where the *why* isn't self-evident
- Keep dependencies minimal — prefer a small helper over a new package
- All writes should go through the offline store so the app keeps working without network

## Design System

Full reference: `docs/design-system.md`

### Non-negotiables
- **No `border-radius` anywhere.** Not on buttons, inputs, cards, modals, avatars — nothing.
- **No filled/solid buttons.** Both `default` and `primary` variants are white background with a border. The only difference is `primary` uses `text-wiki-link` and `font-medium`.
- **No drop shadows by default.** Shadow is allowed only on: dragging citation cards (`shadow-lg`), modals (`shadow-lg`), and dropdowns (`shadow-md`).
- **No hard-coded colors.** Always use a `wiki-*` token or a Tailwind semantic utility (e.g. `text-wiki-link`, `bg-wiki-tab-bg`).

### Color tokens (always use these)
| Token (CSS var / Tailwind utility) | Light | Dark | Use |
|---|---|---|---|
| `wiki-white` | `#ffffff` | `#101418` | Page bg, card bg, input bg |
| `wiki-offwhite` | `#f8f8f8` | `#202122` | Section fills, code blocks |
| `wiki-tab-bg` | `#f0f0f0` | `#27292d` | Tab bg, button hover, drag handles |
| `wiki-border` | `#aaaaaa` | `#72777d` | Strong dividers (header, modal outer edge) |
| `wiki-border-light` | `#cccccc` | `#54595d` | Subtle borders (cards, inputs, dropdowns) |
| `wiki-text` | `#202122` | `#eaecf0` | All body text |
| `wiki-text-muted` | `#54595d` | `#a2a9b1` | Captions, placeholders, secondary labels |
| `wiki-link` | `#0645ad` | `#88a4d8` | Every interactive element |

### Typography
- Font stack: `Arial, Helvetica, sans-serif` for all UI; `"Courier New", Courier, monospace` for citation output only (use `.citation-text` class).
- Base: `14px / 1.6`. Never set a larger base; the compact density is intentional.
- Headings: `text-2xl font-bold` (page), `text-lg font-semibold` (section), `font-bold text-base` (modal). No display sizes.

### Interactive affordances
- **All clickable things that aren't buttons use the link pattern:** `text-wiki-link hover:underline`.
- Inline card actions (`[copy]`, `[edit]`, `[delete]`) are bracketed text links, not icon buttons.
- Focus ring on all interactive elements: `focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text`. Never remove this.
- Disabled: `opacity-50 cursor-not-allowed`.

### Components
- All new UI components go in `src/components/wiki/` and are named `Wiki*`.
- Buttons: `WikiButton` — use it, don't write inline button styles.
- Tabs: `WikiTabs` — active tab uses `-mb-px` trick to merge with border below.
- Dropdowns: `WikiDropdown` — menu is `absolute z-20 min-w-[200px] bg-wiki-white border border-wiki-border-light shadow-md`.
- Modals: overlay is `fixed inset-0 bg-black/50`, dialog is `max-w-xl shadow-lg border border-wiki-border-light` with header/body/footer regions separated by `border-wiki-border-light`.

### Tags
- Colors come from `src/lib/tag-colors.ts` — assigned by hashing tag name to one of 10 palette slots. Never hardcode a tag color.
- Manual override via `TagColorPicker` only.
- Tag shape: `inline-flex items-center px-2 py-0.5 text-xs border` + color classes from the tag-colors utility.

### Spacing cheatsheet
| Context | Classes |
|---|---|
| Button (default) | `px-4 py-2 text-sm` |
| Card body | `p-4` or `p-5` |
| Header bar | `px-4 py-3` |
| List item | `px-3 py-2` |
| Between form fields | `space-y-4` |
| Layout max-width | `max-w-[960px] mx-auto px-4` |

### Motion
- Hover transitions: `transition-colors` only. No transforms, no opacity transitions on hover.
- Loading: `animate-spin` on an inline SVG icon. No skeletons, no shimmer.
- Drag source while dragging: `opacity-50` (handled by dnd-kit, don't override).

# CLAUDE.md

## Project Overview

**OpenCitation** is a citation manager with a Wikipedia 2005-inspired UI. Target audience: students, researchers, professionals.

**Core Features:** Generate citations from URLs/DOIs/ISBNs, organize into Lists and Projects, share via public links, export in multiple formats.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (225 tests)
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4.0
- **Auth:** Clerk
- **Database:** DynamoDB (AWS SDK v3, single-table design)
- **Testing:** Vitest + Testing Library

## Architecture

### Citation Engine (`src/lib/citation/`)
- **Styles:** APA 7th, MLA 9th, Chicago 17th, Harvard
- **Source Types (11):** Books, Journals, Websites, Blogs, Newspapers, Videos, Images, Film, TV Series, TV Episode, Misc
- **Access Types (5):** Print, Database, Web, App, Archive

### API Routes (`src/app/api/`)
| Endpoint | Purpose |
|----------|---------|
| `/api/lookup/url` | Extract metadata via OpenGraph |
| `/api/lookup/doi` | Query CrossRef |
| `/api/lookup/isbn` | Query Open Library/Google Books |
| `/api/lists/` | Lists CRUD |
| `/api/projects/` | Projects CRUD |
| `/api/share/` | Share links |

### Data Model (DynamoDB)
```
User Account (Clerk)
├── Project (container for Lists)
│   └── List (collection of citations)
│       └── Citation
└── Standalone Lists (no project)
```

### Key Directories
```
src/
├── app/                    # Next.js pages & API routes
│   ├── cite/               # Citation generator page
│   ├── lists/              # Lists management
│   ├── projects/           # Projects management
│   ├── share/[code]/       # Public share pages
│   └── api/                # REST endpoints
├── components/
│   ├── wiki/               # Wikipedia-style UI components
│   ├── pwa/                # PWA/offline components
│   └── retro/              # Retro print animation
├── lib/
│   ├── citation/           # Formatters (apa, mla, chicago, harvard)
│   ├── db/                 # DynamoDB client
│   └── pwa/                # Service worker utilities
└── types/                  # TypeScript definitions
```

## Design Philosophy

Early-mid 2000s Wikipedia aesthetic: clean, information-focused, utilitarian. Think Wikipedia circa 2005-2010 with generous whitespace.

## Common Tasks

### Adding a Citation Style
1. Create formatter in `src/lib/citation/formatters/<style>.ts`
2. Add to formatter factory in `src/lib/citation/index.ts`
3. Add tests
4. Update style selector UI

### Adding a Source Type
1. Add type in `src/types/source-types.ts`
2. Update form fields in cite page
3. Add formatting rules to all 4 formatters
4. Add tests

## Development Guidelines

- Favor simplicity; avoid over-engineering
- Write tests for citation formatting logic
- Comments only where logic isn't self-evident
- Keep dependencies minimal

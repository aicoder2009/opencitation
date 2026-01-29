# CLAUDE.md

This file provides guidance for Claude Code when working with the OpenCitation project.

## Project Overview

**OpenCitation** is a citation manager, generator, and sharing tool with a Wikipedia 2005-inspired UI. Primary audience: students, with support for researchers and professionals.

### Core Value Proposition
- **Generate:** Create properly formatted citations from URLs, DOIs, ISBNs, or manual entry
- **Organize:** Save citations to Lists, organize Lists into Projects
- **Share:** Share Lists or Projects via public links
- **Export:** Copy or download citations in multiple formats

## Project Status

This is a new project in early development following a phased approach. See `PLAN.md` for the comprehensive development plan and current status.

**Current Implementation Status:**
- ✅ Sprint 1 Complete: Wikipedia-style UI foundation (components, layout, cite page shell)
- ✅ Sprint 2 Complete: Citation engine (APA, MLA, Chicago, Harvard), lookup APIs (URL, DOI, ISBN)
- ✅ Sprint 3 Complete: UI + Engine Integration (cite page fully functional)
- ✅ Sprint 4 Complete: Database & Lists System (DynamoDB, Lists API, Add to List)
- ✅ Sprint 5 Complete: Projects & Sharing (Projects API, Share links, Public pages)
- ✅ Sprint 6 Complete: Export & Polish (Mobile menu, Navigation, Share buttons)
- ✅ Chrome Extension: Manifest v3, Wikipedia 2000s styling, Citation generation
- ✅ Fun Features: Retro 2000s Print Animation with toggleable sounds

## Tech Stack

### Currently Installed
| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4.0 | ✅ Installed |
| UI Components | Custom wiki components (tabs, buttons, breadcrumbs, collapsible, layout) | ✅ Implemented |
| Citation Engine | 4 formatters (APA, MLA, Chicago, Harvard), 11 source types, 5 access types | ✅ Implemented |
| Lookup APIs | URL (OpenGraph), DOI (CrossRef), ISBN (Open Library/Google Books) | ✅ Implemented |
| Auth | Clerk (sign-in/sign-up pages, middleware) | ✅ Configured |
| Testing | Vitest + Testing Library (82 tests passing) | ✅ Configured |

### Additionally Implemented
| Layer | Technology | Status |
|-------|------------|--------|
| Database | DynamoDB (AWS SDK v3, single-table design) | ✅ Implemented |
| Chrome Extension | Manifest v3 browser extension | ✅ Implemented |
| Retro Features | Print Animation with Web Audio API sounds | ✅ Implemented |

### Planned (Not Yet Installed)
| Layer | Technology | Status |
|-------|------------|--------|
| AI Parsing | OpenAI GPT-4o-mini (data extraction fallback) | 🔲 Future |
| Hosting | Vercel | 🔲 Ready to deploy |

## Architecture

### Citation Engine
**Location:** `src/lib/citation/` ✅ Implemented

- **Source Types (11):** Books, Academic Journals, Websites, Blogs, Newspapers, Videos, Images, Film, TV Series, TV Episode, Miscellaneous
- **Access Types (5):** Print, Database, Web, App, Archive
- **Citation Styles (Core 4):** APA 7th, MLA 9th, Chicago 17th, Harvard

**Formatters:** Each style has a dedicated formatter (~700 lines each) handling all 11 source types with proper formatting rules.

**Lookup APIs:**
- `GET /api/lookup/url` - Extracts metadata from URLs via OpenGraph/meta tags
- `GET /api/lookup/doi` - Queries CrossRef for DOI metadata
- `GET /api/lookup/isbn` - Queries Open Library (with Google Books fallback)

**AI Usage (Fallback Only - Future):**
- AI (OpenAI GPT-4o-mini) will be used ONLY for data extraction when web crawler fails
- Not yet integrated; APIs currently use web scraping only

### Data Hierarchy
```
User Account (Clerk)
├── Project (container for Lists)
│   └── List (collection of citations)
│       └── Citation
└── Standalone Lists (no project)
```

### Database Schema (DynamoDB Single-Table)
```
PK                    | SK                      | Data
USER#<userId>         | PROFILE                 | {name, email, settings}
USER#<userId>         | PROJECT#<projectId>     | {name, description}
USER#<userId>         | LIST#<listId>           | {name, projectId?}
LIST#<listId>         | CITATION#<citationId>   | {type, style, fields}
SHARE#<shareCode>     | META                    | {type, targetId, expiry}
```

## Development Guidelines

### Code Style
- Write clean, readable code with meaningful variable names
- Add comments only where logic isn't self-evident
- Keep functions focused and single-purpose

### Architecture Principles
- Favor simplicity over complexity
- Avoid over-engineering; implement only what's needed
- Keep dependencies minimal

### UI Design Philosophy
Early-mid 2000s Wikipedia aesthetic: clean, information-focused, utilitarian. Think Wikipedia circa 2005-2010 with generous whitespace. See `PLAN.md` for detailed design specs.

### Testing
- Write tests for citation formatting logic
- Ensure edge cases are covered (special characters, missing fields, etc.)

## File Structure

### Current Structure (Implemented)
```
opencitation/
├── src/
│   ├── app/
│   │   ├── cite/page.tsx          # ✅ Citation page (interactive)
│   │   ├── page.tsx               # ✅ Home page
│   │   ├── layout.tsx             # ✅ Root layout with Clerk
│   │   ├── globals.css            # ✅ Tailwind + wiki styles
│   │   ├── sign-in/               # ✅ Clerk sign-in page
│   │   ├── sign-up/               # ✅ Clerk sign-up page
│   │   └── api/lookup/            # ✅ Lookup APIs
│   │       ├── url/route.ts       # ✅ URL metadata extraction
│   │       ├── doi/route.ts       # ✅ CrossRef DOI lookup
│   │       └── isbn/route.ts      # ✅ Open Library/Google Books
│   ├── components/
│   │   └── wiki/                  # ✅ Wikipedia-style design system
│   │       ├── wiki-tabs.tsx      # ✅
│   │       ├── wiki-button.tsx    # ✅
│   │       ├── wiki-breadcrumbs.tsx # ✅
│   │       ├── wiki-collapsible.tsx # ✅
│   │       ├── wiki-layout.tsx    # ✅
│   │       └── index.ts           # ✅
│   ├── lib/citation/              # ✅ Citation engine
│   │   ├── formatters/            # ✅ Style formatters
│   │   │   ├── apa.ts             # ✅ APA 7th (~670 lines)
│   │   │   ├── mla.ts             # ✅ MLA 9th (~694 lines)
│   │   │   ├── chicago.ts         # ✅ Chicago 17th (~696 lines)
│   │   │   └── harvard.ts         # ✅ Harvard (~740 lines)
│   │   ├── utils.ts               # ✅ Citation utilities
│   │   └── index.ts               # ✅ Formatter factory
│   ├── types/                     # ✅ TypeScript types
│   │   ├── citation.ts            # ✅ Citation types
│   │   ├── source-types.ts        # ✅ 11 source types
│   │   └── access-types.ts        # ✅ 5 access types
│   └── middleware.ts              # ✅ Clerk auth middleware
├── CLAUDE.md                      # ✅
├── PLAN.md                        # ✅
├── LICENSE                        # ✅
└── README.md                      # ✅
```

### Planned Structure (Not Yet Created)
```
opencitation/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── projects/          # 🔲 Project CRUD (Sprint 5)
│   │   │   ├── lists/             # 🔲 Lists & Citations CRUD (Sprint 4)
│   │   │   ├── export/            # 🔲 Export functionality (Sprint 6)
│   │   │   └── share/             # 🔲 Sharing system (Sprint 5)
│   │   ├── lists/                 # 🔲 Lists page (Sprint 4)
│   │   └── share/[code]/          # 🔲 Public shared views (Sprint 5)
│   ├── components/
│   │   ├── citation/              # 🔲 Citation components
│   │   └── lists/                 # 🔲 Lists UI components
│   └── lib/db/                    # 🔲 DynamoDB client (Sprint 4)
```

## Common Tasks

### Adding a New Citation Style
1. Create formatter in `src/lib/citation/formatters/<style>.ts`
2. Define field mapping for the style
3. Add tests for the new format
4. Update style selector component

### Adding a New Source Type
1. Add type definition in `src/types/source-types.ts`
2. Update form fields for the new type
3. Add formatting rules to each style formatter
4. Add tests

### Running the Project
```bash
npm install        # Install dependencies
npm run dev        # Start development server (✅ works)
npm run build      # Build for production (✅ works)
npm run lint       # Run ESLint (✅ works)
npm run test       # Run Vitest tests (✅ 82 tests passing)
```

**Testing:** Vitest + Testing Library configured. Tests cover citation utilities, all 4 formatters, and all 3 lookup APIs.

## Implementation Phases

1. **Sprint 1:** Wikipedia-Style UI Foundation ✅
2. **Sprint 2:** Citation Engine Core ✅
3. **Sprint 3:** UI + Engine Integration 🔲
4. **Sprint 4:** Database & Lists System 🔲
5. **Sprint 5:** Projects & Sharing 🔲
6. **Sprint 6:** Export & Polish 🔲

See `PLAN.md` for detailed sprint breakdown.

# OpenCitation - Development Plan

## Current Status: MVP Complete

All core features have been implemented. The project is ready for production deployment.

### Completed Features

#### Core Platform
- [x] Citation engine with 4 styles (APA, MLA, Chicago, Harvard)
- [x] 11 source types + 5 access types
- [x] Lookup APIs (URL/DOI/ISBN)
- [x] Wikipedia 2005-style UI
- [x] Clerk authentication
- [x] DynamoDB database (with local fallback for dev)
- [x] Lists & Projects CRUD
- [x] Share links for Lists and Projects
- [x] Export: text, BibTeX, RIS formats
- [x] 225 tests passing (Vitest + Testing Library)

#### Chrome Extension
- [x] Manifest v3
- [x] Wikipedia 2000s styling
- [x] Citation generation from current page
- [x] Right-click context menu
- [x] Content script for metadata extraction

#### PWA Support
- [x] Service worker for offline
- [x] Install prompts (iOS, Android, Desktop)
- [x] Safari-specific install banner
- [x] Offline storage and sync manager
- [x] Share target configuration

#### Electron Desktop App
- [x] Main process and preload scripts
- [x] Single instance lock
- [x] Development and production builds
- [x] Electron builder configuration

#### Special Features
- [x] Retro 2000s print animation with sounds
- [x] Embed badge page (`/embed`)
- [x] Statistics tracking
- [x] Report issue functionality

---

## Architecture

### Data Model
```
User Account (Clerk)
├── Project (container for Lists)
│   └── List (collection of citations)
│       └── Citation
└── Standalone Lists (no project)
```

### DynamoDB Schema (Single-Table)
```
PK                    | SK                      | Data
USER#<userId>         | PROFILE                 | {name, email, settings}
USER#<userId>         | PROJECT#<projectId>     | {name, description}
USER#<userId>         | LIST#<listId>           | {name, projectId?}
LIST#<listId>         | CITATION#<citationId>   | {type, style, fields}
SHARE#<shareCode>     | META                    | {type, targetId, expiry}
```

### API Routes
| Endpoint | Purpose |
|----------|---------|
| `/api/lookup/url` | Extract metadata via OpenGraph |
| `/api/lookup/doi` | Query CrossRef |
| `/api/lookup/isbn` | Query Open Library/Google Books |
| `/api/lookup/bulk` | Batch metadata lookup |
| `/api/lists/` | Lists CRUD |
| `/api/projects/` | Projects CRUD |
| `/api/share/` | Share links |
| `/api/stats` | Citation statistics |
| `/api/badge` | Embeddable badge generator |

---

## Future Roadmap

### Planned Enhancements
- [ ] AI fallback parsing (OpenAI GPT-4o-mini for failed crawls)
- [ ] Duplicate detection
- [ ] Citation verification
- [ ] Google Scholar integration
- [ ] PubMed database integration
- [ ] Zotero sync
- [ ] Notion/Obsidian export
- [ ] Advanced collaboration (edit permissions, real-time sync)
- [ ] Additional export formats (DOCX, PDF)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4.0 |
| UI | Custom Wikipedia-style components |
| Auth | Clerk |
| Database | DynamoDB (AWS SDK v3, single-table) |
| Testing | Vitest + Testing Library (225 tests) |
| Desktop | Electron |
| Extension | Chrome Manifest v3 |

---

## Cost Estimates (Monthly)

| Service | Estimated Cost |
|---------|---------------|
| Vercel | Free (Hobby) or $20/mo (Pro) |
| DynamoDB | ~$0-5/mo (On-Demand, low traffic) |
| Domain | ~$12/year |
| **Total** | **~$0-25/month** |

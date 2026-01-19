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

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| UI Components | Radix UI, shadcn/ui (customized retro theme) |
| Forms | React Hook Form + Zod |
| Auth | Clerk |
| Database | DynamoDB (On-Demand) |
| AI Parsing | OpenAI GPT-4o-mini (fallback only) |
| Hosting | Vercel |

## Architecture

### Citation Engine
**Location:** `src/lib/citation/`

- **Source Types (12):** Books, Academic Journals, Websites, Blogs, Newspapers, Videos, Images, Film, TV Series, TV Episode, Miscellaneous
- **Access Types (5):** Print, Database, Web, App, Archive
- **Citation Styles (Core 4):** APA 7th, MLA 9th, Chicago 17th, Harvard

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

```
opencitation/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── projects/          # Project CRUD
│   │   │   ├── lists/             # Lists & Citations CRUD
│   │   │   ├── lookup/            # ISBN, DOI, URL lookup
│   │   │   ├── export/            # Export functionality
│   │   │   └── share/             # Sharing system
│   │   ├── (auth)/                # Sign-in/Sign-up pages
│   │   ├── (dashboard)/           # Lists/Projects UI
│   │   ├── cite/                  # Citation creation
│   │   └── share/[code]/          # Public shared views
│   ├── components/
│   │   ├── wiki/                  # Wikipedia-style design system
│   │   ├── citation/              # Citation-specific components
│   │   └── lists/                 # Lists UI components
│   ├── lib/
│   │   ├── citation/
│   │   │   └── formatters/        # APA, MLA, Chicago, Harvard
│   │   └── db/                    # DynamoDB client & queries
│   └── types/                     # TypeScript types
├── CLAUDE.md
├── PLAN.md
├── LICENSE
└── README.md
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
npm run dev        # Start development server
npm run build      # Build for production
npm run test       # Run tests
```

## Implementation Phases

1. **Sprint 1:** Wikipedia-Style UI Foundation
2. **Sprint 2:** Citation Engine Core
3. **Sprint 3:** UI + Engine Integration
4. **Sprint 4:** Database & Lists System
5. **Sprint 5:** Projects & Sharing
6. **Sprint 6:** Export & Polish

See `PLAN.md` for detailed sprint breakdown.

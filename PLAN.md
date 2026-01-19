# OpenCitation - Comprehensive Development Plan

## Project Vision
A citation manager, generator, and sharing tool with a Wikipedia 2005-inspired UI. Primary audience: students, with support for researchers and professionals.

### Core Value Proposition
- **Generate:** Create properly formatted citations from URLs, DOIs, ISBNs, or manual entry
- **Organize:** Save citations to Lists, organize Lists into Projects
- **Share:** Share Lists or Projects via public links
- **Export:** Copy or download citations in multiple formats

---

## Phase 1: MVP Core Features

### 1.1 Citation Engine (Priority: HIGH)
**Location:** `src/lib/citation/`

#### Source Types (MVP - 11 types)
| Type | Description |
|------|-------------|
| Books | Physical and eBooks |
| Academic Journals | Peer-reviewed articles |
| Websites | General web pages |
| Blogs | Blog posts and articles |
| Newspapers | News articles |
| Videos | YouTube, Vimeo, online video |
| Images | Photographs, artwork, graphics |
| Film | Movies, documentaries |
| TV Series | Television shows (whole series) |
| TV Episode | Individual TV episodes |
| Miscellaneous | Catch-all for other sources |

#### Access Types (for each source)
| Access Type | Description |
|-------------|-------------|
| Print | Physical copy (book, newspaper, etc.) |
| Database | Academic database (JSTOR, ProQuest, etc.) |
| Web | Direct website access |
| App | Mobile/desktop application |
| Archive | Internet Archive, Wayback Machine, etc. |

#### Citation Styles (Core 4)
- **APA 7th Edition** (exists: `src/lib/citation/formatters/apa.ts`)
- **MLA 9th Edition** (to create)
- **Chicago 17th Edition** (to create)
- **Harvard** (to create)

#### Input Modes (MVP)

1. **Quick Add (URL-Based) - User provides:**
   - URL
   - Source type (book, journal, website, etc.)
   - Citation style (APA, MLA, Chicago, Harvard)

   **System processes with Hybrid Approach:**
   ```
   Step 1: Web Crawler (Free)
   ├── Fetch URL content
   ├── Extract OpenGraph meta tags
   ├── Extract JSON-LD / schema.org data
   ├── Extract <title>, author meta, date published
   └── If complete → format citation ✓

   Step 2: AI Fallback (if crawler incomplete)
   ├── Send page content to OpenAI GPT-4o
   ├── AI extracts: author, title, date, publisher, etc.
   └── Format citation with extracted data ✓
   ```

2. **DOI/ISBN Lookup**
   - DOI → CrossRef API (free, instant)
   - ISBN → Google Books / Open Library API (free)

3. **Manual Mode**
   - Form-based entry for each source type
   - Access type selector (Print/Database/Web/App/Archive)
   - Citation style selector at top
   - Auto-fill from Quick Add when available

#### AI Model for Fallback
- **OpenAI GPT-4o-mini** (cost-effective for parsing)
- Input: $0.15/1M tokens, Output: $0.60/1M tokens
- Estimated: ~$0.005-0.02 per citation (only when crawler fails)

#### Future Enhancements
- Paste raw citation text → AI parses into fields
- ISSN lookup for journals
- Batch URL processing

### 1.2 User Interface - "Classic Web 2005" Wikipedia-Inspired Design

#### Design Philosophy
Early-mid 2000s Wikipedia aesthetic: clean, information-focused, utilitarian. Think Wikipedia circa 2005-2010 with its iconic blue links, centered content, and functional simplicity - but with **more generous whitespace** to let content breathe. The dense Wikipedia look is a reference, not a copy.

#### Layout Structure (Centered 960px)
```
┌──────────────────────────────────────────────────────────────────────┐
│                         WHITE HEADER BAR                              │
│  [Logo: OpenCitation]                    [Sign In] [Create Account]  │
│  ─────────────────────────────────────────────────────────────────── │
│  Home > Projects > My Essay                        (Breadcrumb nav)  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─[Article]──[Discussion]──[Edit]──[History]─┐  (Tab navigation)  │
│   │                                             │                    │
│   │  OpenCitation                               │                    │
│   │  From OpenCitation, the free citation tool  │                    │
│   │                                             │                    │
│   │  ┌─────────────────────────────────┐       │                    │
│   │  │ Contents            [hide]      │       │  (Collapsible TOC) │
│   │  │ 1. Quick Add                    │       │                    │
│   │  │ 2. Manual Entry                 │       │                    │
│   │  │ 3. My Citations                 │       │                    │
│   │  └─────────────────────────────────┘       │                    │
│   │                                             │                    │
│   │  [Generated citation with blue links]       │                    │
│   │                                             │                    │
│   │  ─────────────────────────────────────────  │                    │
│   │  [Copy] [Export] [Add to Project]           │  (Flat buttons)   │
│   └─────────────────────────────────────────────┘                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Color Palette (Wikipedia 2005 Era)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Pure White | #FFFFFF |
| Content Area | Slight Off-White | #F8F8F8 |
| Header/Borders | Light Grey | #AAAAAA |
| Primary Links | Wikipedia Blue | #0645AD |
| Visited Links | Purple | #0B0080 |
| Active/Hover | Red (for emphasis) | #BA0000 |
| Tab Background | Light Blue/Grey | #F0F0F0 |
| Selected Tab | White | #FFFFFF |

#### Typography (Classic Web)
- **Font Family:** Arial, Helvetica, sans-serif (system fonts)
- **Body Text:** 14px, line-height 1.5
- **Headings:** Bold, same font family
- **Links:** Blue (#0645AD), underlined on hover
- **Monospace:** Courier New for code/citations

#### UI Components

**Tabs (Wikipedia-style):**
- Flat tabs with bottom border
- Selected tab: white background, no bottom border
- Hover: light grey background

**Buttons (Minimal/Flat 2005):**
- Simple bordered buttons
- No shadows, no gradients
- Grey border (#CCCCCC), white background
- Blue text for primary actions
- Hover: light grey background (#F0F0F0)

**Collapsible Sections:**
- `[show]` / `[hide]` text links
- Smooth collapse animation
- Bordered content boxes

**Breadcrumbs:**
- `Home > Section > Page` format
- Blue links with `>` separators
- Grey text for current page

#### Spacing & Breathing Room
Unlike the dense Wikipedia original, OpenCitation uses **generous spacing**:
- **Section margins:** 32px between major sections
- **Paragraph spacing:** 16px between paragraphs
- **Card padding:** 24px internal padding
- **Button spacing:** 12px gaps between buttons
- **Line height:** 1.6 for comfortable reading
- **Max content width:** 800px within the 960px container
- **Form field spacing:** 20px between fields

#### Interaction Details (Early Wikipedia)
- Links underline on hover only
- No fancy animations - instant state changes
- Focus outline: dotted border (accessibility)
- Form inputs: simple 1px borders, generous padding (12px)
- Hover states: subtle background color change
- Selected text: default browser highlight

### 1.3 Authentication (Clerk - Already Configured)
**Files:**
- `src/middleware.ts` - Auth middleware
- `src/app/(auth)/` - Sign-in/Sign-up pages

**Features:**
- Email/password authentication
- OAuth (Google, GitHub)
- User profile management

---

## Phase 2: Backend & Database

### 2.1 DynamoDB Setup (Cheapest Approach)

**Recommendation: On-Demand Pricing + Single-Table Design**

Why On-Demand:
- Pay only for what you use
- Perfect for unpredictable traffic (students before deadlines)
- No capacity planning needed
- Free tier: 25 WCU + 25 RCU always free

#### Single-Table Design Schema
```
PK                    | SK                      | Data
─────────────────────────────────────────────────────────────────────────
USER#<userId>         | PROFILE                 | {name, email, settings}
USER#<userId>         | PROJECT#<projectId>     | {name, description, createdAt}
USER#<userId>         | LIST#<listId>           | {name, projectId?, createdAt}
LIST#<listId>         | META                    | {name, ownerId, projectId?}
LIST#<listId>         | CITATION#<citationId>   | {type, style, accessType, fields}
SHARE#<shareCode>     | META                    | {type: "list"|"project", targetId, expiry}
```

**Data Relationships:**
- User owns Projects
- User owns Lists (optionally inside a Project)
- Lists contain Citations
- Share codes point to either Lists or Projects

**GSI (Global Secondary Index):**
- GSI1: Query lists by projectId
- GSI2: Query shared links by targetId

#### Setup Steps
1. Create DynamoDB table via AWS Console or IaC
2. Use `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`
3. Create API routes in `src/app/api/`

### 2.2 API Routes Structure
```
src/app/api/
├── projects/
│   ├── route.ts              # GET all user projects, POST new
│   └── [id]/route.ts         # GET, PUT, DELETE single project
├── lists/
│   ├── route.ts              # GET all user lists, POST new
│   ├── [id]/route.ts         # GET, PUT, DELETE single list
│   └── [id]/citations/
│       ├── route.ts          # GET all citations in list, POST new
│       └── [citationId]/route.ts  # PUT, DELETE single citation
├── lookup/
│   ├── isbn/route.ts         # (exists)
│   ├── doi/route.ts          # CrossRef lookup
│   └── url/route.ts          # OpenGraph/meta scraping
├── export/
│   └── route.ts              # Export list/project as .txt
└── share/
    ├── route.ts              # POST create share link
    └── [code]/route.ts       # GET shared list/project (public)
```

### 2.3 External APIs to Integrate
| API | Purpose | Cost |
|-----|---------|------|
| CrossRef | DOI metadata | Free |
| Open Library | Book data | Free |
| Google Books | ISBN lookup | Free (quota) |
| Web Crawler (DIY) | URL metadata extraction | Free (server) |
| OpenAI GPT-4o-mini | AI fallback parsing | ~$0.005-0.02 per failed crawl |

---

## Phase 3: Lists, Projects & Collaboration

### 3.1 Lists System (Core Unit)
**Lists are the fundamental organization unit:**
- A List = collection of citations
- Lists belong to a user's account
- Lists can be placed inside Projects
- Lists can be shared independently via link

### 3.2 Projects System
**Projects contain multiple Lists:**
- Project = container for related Lists
- Example: "Fall 2024 Semester" project contains:
  - "History Essay" list
  - "Biology Lab Report" list
  - "English Paper" list
- Projects can be shared (all lists inside become accessible)

### 3.3 Sharing (MVP)
- **Share a List:** Generate shareable link to single list
- **Share a Project:** Generate shareable link to entire project
- **Permissions:** View-only for MVP (edit permissions in future)

### 3.4 Data Hierarchy
```
User Account (Clerk)
├── Project: "Fall 2024"
│   ├── List: "History Essay"
│   │   ├── Citation 1
│   │   ├── Citation 2
│   │   └── Citation 3
│   └── List: "Bio Lab Report"
│       ├── Citation 1
│       └── Citation 2
├── Project: "Research Thesis"
│   └── List: "Literature Review"
└── Standalone Lists (no project)
    └── List: "Quick Saves"
```

### 3.5 Future Collaboration
- Edit permissions (Owner, Editor, Viewer roles)
- Real-time collaboration
- Activity history

---

## Phase 4: Export System

### 4.1 MVP Export Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| Copy to Clipboard | - | One-click copy formatted citation |
| Plain Text | .txt | Download as text file |

### 4.2 Future Export Formats
| Format | Extension | Use Case |
|--------|-----------|----------|
| Word | .docx | Direct editing |
| PDF | .pdf | Final submission |
| BibTeX | .bib | LaTeX users |
| RIS | .ris | Zotero/Mendeley import |
| EndNote | .enw | EndNote import |

### 4.3 Export Scope Options
- Export single citation
- Export entire list
- Export entire project (all lists combined)

---

## Phase 5: Future Roadmap

### 5.1 PWA Support
- Service worker for offline
- Install prompt
- Push notifications for collaboration

### 5.2 Browser Extension
- Chrome/Firefox extension
- "Cite This Page" button
- Direct insert into Google Docs

### 5.3 Advanced Features
- Duplicate detection
- Citation verification
- Related source suggestions
- Literature review helper

### 5.4 Integrations
- Google Scholar search
- PubMed database
- Notion/Obsidian export
- Zotero sync

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| UI Components | Radix UI, shadcn/ui (customized retro theme) |
| Forms | React Hook Form + Zod |
| Auth | Clerk |
| Database | DynamoDB (On-Demand) |
| AI Parsing | OpenAI GPT-4o-mini (fallback only) |
| Hosting | Vercel |
| Real-time (later) | Pusher or Vercel WebSockets |

---

## Implementation Order (MVP)

### Sprint 1: Wikipedia-Style UI Foundation
1. Create retro design system (colors, typography, CSS variables)
2. Build base components: tabs, buttons, breadcrumbs, collapsible sections
3. Build main layout: white header, centered 960px content, tab navigation
4. Build citation page shell with placeholder content
5. Implement responsive breakpoints for mobile

### Sprint 2: Citation Engine Core
1. Define TypeScript types for all 12 source types + 5 access types
2. Create MLA, Chicago, Harvard formatters (APA exists)
3. Build URL metadata scraper API (OpenGraph/meta tags)
4. Build DOI lookup API (CrossRef)

### Sprint 3: UI + Engine Integration
1. Build Quick Add tab with URL/DOI/ISBN input
2. Build Manual Entry tab with dynamic forms per source type
3. Add access type selector to all forms
4. Build citation preview with style switcher
5. Copy to clipboard functionality

### Sprint 4: Database & Lists System
1. Set up DynamoDB table (single-table design)
2. Create Lists API routes
3. Create Citations API routes (within lists)
4. Build Lists UI (create, rename, delete lists)
5. Migrate from localStorage to DynamoDB

### Sprint 5: Projects & Sharing
1. Create Projects API routes
2. Build Projects UI (create, manage projects)
3. Add Lists to Projects functionality
4. Implement share links for Lists and Projects
5. Build public shared view pages

### Sprint 6: Export & Polish
1. Export to .txt file (single citation, list, or project)
2. Mobile responsiveness polish
3. Testing & bug fixes
4. Performance optimization

---

## Files to Create/Modify

### New Files - Citation Engine
- `src/lib/citation/formatters/mla.ts`
- `src/lib/citation/formatters/chicago.ts`
- `src/lib/citation/formatters/harvard.ts`
- `src/types/source-types.ts` (12 source types)
- `src/types/access-types.ts` (5 access types)

### New Files - Database
- `src/lib/db/dynamodb.ts` (DynamoDB client)
- `src/lib/db/queries/` (query helpers)

### New Files - API Routes
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/lists/route.ts`
- `src/app/api/lists/[id]/route.ts`
- `src/app/api/lists/[id]/citations/route.ts`
- `src/app/api/lookup/doi/route.ts`
- `src/app/api/lookup/url/route.ts`
- `src/app/api/export/route.ts`
- `src/app/api/share/route.ts`
- `src/app/api/share/[code]/route.ts`

### New Files - UI Components
- `src/components/wiki/` (Wikipedia-style design system)
  - `wiki-tabs.tsx`
  - `wiki-button.tsx`
  - `wiki-breadcrumbs.tsx`
  - `wiki-collapsible.tsx`
  - `wiki-layout.tsx`
- `src/components/citation/` (citation-specific)
  - `quick-add.tsx`
  - `manual-form.tsx`
  - `style-selector.tsx`
  - `access-type-selector.tsx`
- `src/components/lists/` (lists UI)
  - `list-sidebar.tsx`
  - `list-view.tsx`
  - `citation-card.tsx`

### New Pages
- `src/app/share/[code]/page.tsx` (public shared view)

### Modify Files
- `src/types/citation.ts` - Update with new structure
- `src/app/cite/page.tsx` - Rebuild with Wiki UI
- `src/app/(dashboard)/` - Update for Lists/Projects
- `src/components/layout/header.tsx` - Wiki-style header
- `tailwind.config.ts` - Add Wiki color palette

---

## Cost Estimates (Monthly)

| Service | Estimated Cost |
|---------|---------------|
| Vercel | Free (Hobby) or $20/mo (Pro) |
| DynamoDB | ~$0-5/mo (On-Demand, low traffic) |
| OpenAI GPT-4o-mini | ~$1-5/mo (only for crawler failures) |
| Domain | ~$12/year |
| **Total MVP** | **~$1-15/month** |

### URL Processing Cost Breakdown
- **Web Crawler:** Free (most URLs succeed here)
- **AI Fallback:** ~$0.005-0.02 per citation (only ~20% of URLs)
- Example: 1,000 URLs/month, 200 need AI = ~$2-4/month

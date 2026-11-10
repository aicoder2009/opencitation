# Graph Report - opencitation  (2026-09-21)

## Corpus Check
- 283 files · ~289,067 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1670 nodes · 3431 edges · 130 communities (79 shown, 49 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.83)
- Token cost: 829,782 input · 0 output

## Community Hubs (Navigation)
- Citation Formatters & Tests
- BibTeX/RIS Export & Import
- App Shell & Marketing Pages
- Electron Builder Config
- DynamoDB Client & Benchmarks
- IndexedDB Offline Store
- CSL Engine & Styles
- Cite Page Form
- Local Store CRUD
- Badge, Stats & Issue APIs
- PWA Web Manifest
- List Detail & Reordering
- PostHog Integration Skill
- Docs Content & Changelog
- package.json Metadata
- Next Config & Layouts
- URL Lookup & SSRF Guard
- Auth Pages & Wiki UI Kit
- Share Link API
- Offline Indicator & Types
- Citation Options & Settings
- Label Lookup Benchmark
- Dev Dependencies
- API Routes Overview
- Electron Main Process
- Runtime Dependencies
- Docs & Keyboard Shortcuts
- Sync Manager
- npm Scripts
- TypeScript Config
- Vibe Security Skill
- Project Status & UI Snapshots
- Share Export Endpoint
- Share Creation API
- BibTeX Importer
- Electron TS Config
- List Citations API
- Single Citation API
- Lists API & Clone
- PWA Manager
- Citation Add Modal
- DOI Lookup (CrossRef)
- ISBN Lookup
- Single List API
- Search API
- Public Share Page
- Offline-First & Design Principles
- Single Project API
- Projects API
- Changelog & Release Notes
- Citation Styles Docs
- Color Tokens & Drag-Drop
- Citation Reorder API
- Project Lists API
- CI & Review Workflows
- Service Worker
- PubMed Lookup
- Wikipedia Lookup
- Root Layout & PWA Provider
- Share Embed & OG Image
- Barnstar Milestones
- Data Model & Sharing Docs
- XSS Hardening Notes
- arXiv Lookup
- Citeproc Types
- Barcode Scanner
- OG Image Messaging
- Docs Layout & Sidebar
- Offline React Hooks
- Logo Processing Script
- Share Dialog
- Accessibility Audit
- Delete Benchmark Sim
- CSL Style Fetcher
- Logo Artwork
- Bulk Lookup API
- App Icon
- Navigation & Dropdown
- Logo PNG
- Logo 1024
- Electron Types
- Concurrent Fetching Lessons
- ESLint Config
- Build Script
- Auth Middleware
- AI Spending Caps
- CVE-2025-29927 (Next.js Middleware Bypas
- Server Actions Are Public Endpoints
- Session & Token Storage
- aria-controls ARIA attribute pattern
- aria-label contextual labeling pattern
- Electron Platform Considerations
- postcss.config.mjs
- postinstall.mjs
- LLM Output Is Untrusted
- Prompt Injection Mitigation
- Tool/Function Calling Safety
- API Route Handlers Auth
- Data Leakage to Client Components
- ORM Safety (Prisma)
- Convex Auth Patterns
- Firebase Security Rules
- Firebase Subcollection Trap
- SECURITY DEFINER Functions
- Storage Bucket Policies
- CORS Configuration
- Pre-Ship Security Checks
- Security Headers
- Biometric Auth Cryptographic Verificatio
- Deep Link Security
- Checkout Session Metadata Validation
- Stripe Webhook Signature Verification
- Subscription Status Validation
- Per-IP and Per-User Limiting
- .gitignore for Env Files
- Secret Detection Patterns
- App Router vs Pages Router Integration
- Form Fields Spec
- Loading States Pattern
- Spacing System
- Typography System
- WikiBreadcrumbs Component Spec
- WikiCollapsible Component Spec
- WikiUserMenu Component Spec
- OpenCitation App Icon (192x192)
- OpenCitation App Icon (512×512)
- OpenCitation Apple App Icon
- {deleteSharesForTarget}

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 53 edges
2. `italic()` - 52 edges
3. `vitest` - 51 edges
4. `offlineStore` - 47 edges
5. `react` - 39 edges
6. `CitationFields` - 34 edges
7. `formatUrl()` - 33 edges
8. `BaseCitationFields` - 31 edges
9. `WikiBreadcrumbs()` - 23 edges
10. `syncManager` - 22 edges

## Surprising Connections (you probably didn't know these)
- `XSS via unsanitized dangerouslySetInnerHTML` --references--> `SortableCitation()`  [AMBIGUOUS]
  .jules/sentinel.md → src/components/wiki/sortable-citation.tsx
- `PostHogIdentify Clerk-to-PostHog Linking` --semantically_similar_to--> `posthog.identify() Function`  [INFERRED] [semantically similar]
  posthog-setup-report.md → .claude/skills/integration-nextjs-app-router/references/identify-users.md
- `MVP Complete Status` --conceptually_related_to--> `OpenCitation Project Overview`  [AMBIGUOUS]
  PLAN.md → CLAUDE.md
- `Chrome Extension Platform` --conceptually_related_to--> `OpenCitation Project Overview`  [AMBIGUOUS]
  README.md → CLAUDE.md
- `llms.txt AI Agent Overview` --semantically_similar_to--> `README Project Overview`  [INFERRED] [semantically similar]
  public/llms.txt → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vibe Security Multi-Domain Audit Checklist** — agents_skills_vibe_security_skill_vibesecurityskill, agents_skills_vibe_security_references_ai_integration_aiapikeysserversideonly, agents_skills_vibe_security_references_database_security_supabaserls, agents_skills_vibe_security_references_authentication_jwthandling, agents_skills_vibe_security_references_payments_clientsubmittedpricesvuln [INFERRED 0.85]
- **PostHog Setup Wizard Sequential Workflow** — claude_skills_integration_nextjs_app_router_references_basic_integration_1_0_begin_setupbeginphase, claude_skills_integration_nextjs_app_router_references_basic_integration_1_1_edit_setupeditphase, claude_skills_integration_nextjs_app_router_references_basic_integration_1_2_revise_setuprevisephase, claude_skills_integration_nextjs_app_router_references_basic_integration_1_3_conclude_setupconcludephase [EXTRACTED 1.00]
- **PostHog User Identity Correlation Pattern** — claude_skills_integration_nextjs_app_router_references_identify_users_identifyfunction, claude_skills_integration_nextjs_app_router_references_identify_users_distinctidconcept, posthog_setup_report_posthogidentifyclerkintegration, claude_skills_integration_nextjs_app_router_references_example_useridentificationpattern [INFERRED 0.85]
- **OpenCitation Wiki-style Component Library** — docs_design_system_wikibutton, docs_design_system_wikitabs, docs_design_system_wikidropdown, docs_design_system_wikicollapsible, docs_design_system_wikibreadcrumbs, docs_design_system_wikiusermenu, docs_design_system_modal [EXTRACTED 1.00]
- **WCAG 2.1 AA Compliance Effort** — docs_accessibility_audit_wcag, docs_accessibility_audit_jest_axe, docs_accessibility_audit_skip_nav, docs_accessibility_audit_focus_trap, docs_accessibility_audit_fixes_applied [EXTRACTED 1.00]
- **Quick Add Multi-Provider Lookup Flow** — docs_content_citations_quick_add, claude_md_api_lookup_url, claude_md_api_lookup_doi, claude_md_api_lookup_isbn, claude_md_api_lookup_pubmed, claude_md_api_lookup_arxiv, claude_md_api_lookup_wikipedia [EXTRACTED 1.00]
- **Automated CI/CD Quality & Review Pipeline** — github_workflows_ci_ci, depot_workflows_health_check_full_app_health_check, depot_workflows_pr_review_pr_review, coderabbit_config [INFERRED 0.80]
- **XSS Prevention via DOMPurify Sanitization** — jules_sentinel_xss_via_unsanitized_dangerouslysetinnerhtml, jules_sentinel_xss_via_unsanitized_marked_output, concept_isomorphic_dompurify [INFERRED 0.85]
- **ARIA Accessibility Best Practices** — jules_palette_react_conditional_unmounting_and_aria_controls, jules_palette_generic_visual_text_buttons_and_aria_context, concept_aria_controls, concept_aria_label [INFERRED 0.80]
- **Visual Brand Identity System** — opencitation_png_logo, opencitation_png_puzzle_sphere, opencitation_png_knowledge_symbols, opencitation_png_wikipedia_inspired_aesthetic [EXTRACTED 1.00]
- **Core Value Propositions** — public_og_image_free_and_open_source, public_og_image_no_ads_ever, public_og_image_no_gen_ai, public_og_image_no_fees [INFERRED 0.95]
- **OpenCitation Icon Visual Design System** — src_app_icon_wikipedia_puzzle_sphere, src_app_icon_knowledge_symbols, src_app_icon_book_icon, src_app_icon_quotation_marks [INFERRED 0.85]

## Communities (130 total, 49 thin omitted)

### Community 0 - "Citation Formatters & Tests"
Cohesion: 0.07
Nodes (120): vitest, isCslStyle(), formatAPA(), formatBlog(), formatBook(), formatFilm(), formatImage(), formatJournal() (+112 more)

### Community 1 - "BibTeX/RIS Export & Import"
Cohesion: 0.06
Nodes (46): BIBTEX_ESCAPE_MAP, BIBTEX_MONTHS, escapeBibTeX(), formatAuthors(), generateBibKey(), getBibType(), toBibTeX(), toBibTeXMultiple() (+38 more)

### Community 2 - "App Shell & Marketing Pages"
Cohesion: 0.09
Nodes (34): @clerk/nextjs, posthog-js, react, metadata, Dashboard(), List, Project, relativeDate() (+26 more)

### Community 3 - "Electron Builder Config"
Cohesion: 0.04
Nodes (48): appId, copyright, Categories, Comment, Keywords, Name, directories, buildResources (+40 more)

### Community 4 - "DynamoDB Client & Benchmarks"
Cohesion: 0.08
Nodes (35): @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb, benchmark(), populateList(), testDynamoDB(), addCitation(), CitationQuote, client (+27 more)

### Community 6 - "CSL Engine & Styles"
Cohesion: 0.07
Nodes (28): citeproc, groups, metadata, firstEntry(), formatCsl(), inTextCsl(), makeEngine(), article (+20 more)

### Community 7 - "Cite Page Form"
Cohesion: 0.08
Nodes (36): ACCESS_LABELS, AuthorInput, CitePageContent(), detectResearchType(), emptyAuthor(), FormData, initialFormData, List (+28 more)

### Community 8 - "Local Store CRUD"
Cohesion: 0.10
Nodes (27): addCitation(), CitationQuote, createList(), createProject(), createShareLink(), deleteCitation(), deleteList(), deleteProject() (+19 more)

### Community 9 - "Badge, Stats & Issue APIs"
Cohesion: 0.10
Nodes (21): OpenCitation Embeddable Badge, GET(), mockGetStats, ALLOWED_ISSUE_TYPES, POST(), GITHUB_ISSUE_RESPONSE, mockAuth, validBody (+13 more)

### Community 10 - "PWA Web Manifest"
Cohesion: 0.06
Nodes (31): background_color, categories, description, dir, display, display_override, edge_side_panel, preferred_width (+23 more)

### Community 11 - "List Detail & Reordering"
Cohesion: 0.09
Nodes (26): @dnd-kit/sortable, @dnd-kit/utilities, Citation, CitationQuote, List, ListDetailPage(), ReadingStatus, useKeyboardShortcuts() (+18 more)

### Community 12 - "PostHog Integration Skill"
Cohesion: 0.08
Nodes (30): PostHog Setup Wizard: Begin Phase, PostHog Setup Wizard: Edit Phase, PostHog Setup Wizard: Revise Phase, PostHog Setup Wizard: Conclude Phase, Error Tracking Pattern (captureException), Event Tracking Pattern (burrito_considered), Client-Side Initialization (instrumentation-client.ts), PostHog Next.js App Router Example Project (+22 more)

### Community 13 - "Docs Content & Changelog"
Cohesion: 0.10
Nodes (22): marked, ChangelogPage(), commitTitle(), formatDate(), metadata, revalidate, Citations(), metadata (+14 more)

### Community 14 - "package.json Metadata"
Cohesion: 0.07
Nodes (28): build, extends, main, name, private, version, concurrently, @dnd-kit/core (+20 more)

### Community 15 - "Next Config & Layouts"
Cohesion: 0.08
Nodes (9): baseSecurityHeaders, nextConfig, next, metadata, metadata, metadata, metadata, metadata (+1 more)

### Community 16 - "URL Lookup & SSRF Guard"
Cohesion: 0.16
Nodes (19): APIResponse, decodeHtmlEntities(), detectSourceTypeFromUrl(), extractJsonLd(), extractMetaTags(), extractTitle(), fetchArxivMetadata(), parseMetadata() (+11 more)

### Community 17 - "Auth Pages & Wiki UI Kit"
Cohesion: 0.10
Nodes (13): wikiAppearance, wikiAppearance, WikiCollapsible(), WikiCollapsibleProps, PaletteCommand, WikiCommandPalette(), WikiCommandPaletteProps, Tab (+5 more)

### Community 18 - "Share Link API"
Cohesion: 0.12
Nodes (19): DELETE(), READ_RATE, RouteParams, mockAuth, mockDeleteShareLink, mockFindListById, mockFindProjectById, mockGetListCitations (+11 more)

### Community 19 - "Offline Indicator & Types"
Cohesion: 0.15
Nodes (19): OfflineIndicator(), OfflineIndicatorProps, CacheMeta, OfflineCitation, OfflineList, OfflineProject, STORES, BeforeInstallPromptEvent (+11 more)

### Community 20 - "Citation Options & Settings"
Cohesion: 0.15
Nodes (19): MetadataResult, UrlDetection, CitationFields, SettingsPage(), STYLE_OPTIONS, SourceTypeGroup, SourceTypeOption, SourceTypePicker() (+11 more)

### Community 21 - "Label Lookup Benchmark"
Cohesion: 0.13
Nodes (21): ACCESS_TYPES, accessTypeMap, accessTypeMapObj, CITATION_STYLES, citationStyleMap, citationStyleMapObj, getAccessLabelBaseline(), getAccessLabelOptimized() (+13 more)

### Community 22 - "Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, concurrently, electron, electron-builder, eslint, eslint-config-next, jest-axe, sharp (+13 more)

### Community 23 - "API Routes Overview"
Cohesion: 0.19
Nodes (20): API Security Hardening (SSRF/XSS), Adding a Lookup Provider (workflow), /api/badge embeddable badge endpoint, /api/lookup/arxiv endpoint, /api/lookup/doi endpoint, /api/lookup/isbn endpoint, /api/lookup/pubmed endpoint, /api/lookup/url endpoint (+12 more)

### Community 24 - "Electron Main Process"
Cohesion: 0.11
Nodes (12): createMenu(), createWindow(), electron_1, gotTheLock, path, url, electron_1, createMenu() (+4 more)

### Community 25 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb, citeproc, @clerk/nextjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+12 more)

### Community 26 - "Docs & Keyboard Shortcuts"
Cohesion: 0.16
Nodes (13): metadata, ShortcutTable(), DocsIndex(), metadata, quickAddRows, sections, styleRows, ShortcutHelp() (+5 more)

### Community 27 - "Sync Manager"
Cohesion: 0.22
Nodes (3): SyncQueueItem, syncManager, useSyncManager()

### Community 28 - "npm Scripts"
Cohesion: 0.11
Nodes (19): scripts, build, dev, electron:build, electron:build:linux, electron:build:mac, electron:build-ts, electron:build:win (+11 more)

### Community 29 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 30 - "Vibe Security Skill"
Cohesion: 0.11
Nodes (18): Vibe Security OpenAI Agent Interface Config, AI API Keys Server-Side Only, JWT Handling, Mass Assignment Prevention, SQL Injection Prevention, Supabase Row-Level Security (RLS), Environment Separation, Production Configuration Hardening (+10 more)

### Community 31 - "Project Status & UI Snapshots"
Cohesion: 0.12
Nodes (18): In-app Changelog Page (GitHub Releases-backed), OpenCitation Project Overview, MVP Complete Status, PWA Support Feature Set, Retro 2000s Print Animation, Clerk Keyless Dev Mode Prompt, Home Page UI Snapshot, Cite Page Initial Snapshot (Clerk keyless prompt) (+10 more)

### Community 32 - "Share Export Endpoint"
Cohesion: 0.18
Nodes (15): EXPORT_RATE, Format, FORMATS, GET(), safeFilename(), computeEtag(), GET(), toCSLJSON() (+7 more)

### Community 33 - "Share Creation API"
Cohesion: 0.20
Nodes (13): GET(), POST(), mockAuth, mockCreateShareLink, mockGetList, mockGetProject, mockGetUserLists, mockGetUserProjects (+5 more)

### Community 34 - "BibTeX Importer"
Cohesion: 0.24
Nodes (15): BibTeXParseResult, bibtexTypeToSourceType(), cleanBibTeXString(), isBraceWrappedName(), MONTH_NAMES, normalizePages(), parseAllBibTeX(), parseAuthors() (+7 more)

### Community 35 - "Electron TS Config"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir (+7 more)

### Community 36 - "List Citations API"
Cohesion: 0.17
Nodes (11): posthog-node, GET(), POST(), RouteParams, mockAddCitation, mockAuth, mockGetList, mockGetListCitations (+3 more)

### Community 37 - "Single Citation API"
Cohesion: 0.17
Nodes (13): DELETE(), GET(), PUT(), RouteParams, mockAuth, mockDeleteCitation, mockGetCitation, mockGetList (+5 more)

### Community 38 - "Lists API & Clone"
Cohesion: 0.20
Nodes (11): GET(), POST(), mockAuth, mockCreateList, mockGetUserLists, POST(), {createList}, {getUserLists} (+3 more)

### Community 40 - "Citation Add Modal"
Cohesion: 0.19
Nodes (11): isomorphic-dompurify, CITATION_STYLES, CitationAddModal(), CitationAddModalProps, detectEndpoint(), WikiSelect(), WikiSelectOption, WikiSelectProps (+3 more)

### Community 41 - "DOI Lookup (CrossRef)"
Cohesion: 0.20
Nodes (10): APIResponse, Author, CrossRefResponse, DOIMetadataResult, CROSSREF_BASE, extractDOI(), GET(), mapCrossRefType() (+2 more)

### Community 42 - "ISBN Lookup"
Cohesion: 0.23
Nodes (13): APIResponse, Author, cleanISBN(), fetchFromGoogleBooks(), fetchFromOpenLibrary(), GET(), GoogleBooksVolume, ISBNMetadataResult (+5 more)

### Community 43 - "Single List API"
Cohesion: 0.21
Nodes (11): DELETE(), GET(), PUT(), RouteParams, mockAuth, mockDeleteList, mockGetList, mockUpdateList (+3 more)

### Community 44 - "Search API"
Cohesion: 0.19
Nodes (11): citationMatches(), GET(), matches(), CITATIONS_LIST_1, LISTS, mockAuth, mockGetListCitations, mockGetUserLists (+3 more)

### Community 45 - "Public Share Page"
Cohesion: 0.21
Nodes (11): formatShareFooter(), SaveResult, SharedCitation, SharedData, SharedList, ShareMeta, SharePage(), CitationLike (+3 more)

### Community 46 - "Offline-First & Design Principles"
Cohesion: 0.18
Nodes (13): Development Guidelines, Offline-first Write Rule, Modal Focus Trap (CitationAddModal, ShareDialog), PWA Install Flow, Offline Support (IndexedDB mirror), Elevation & Borders (flat-first), Modal / Dialog Pattern, Design System Principles (5) (+5 more)

### Community 47 - "Single Project API"
Cohesion: 0.22
Nodes (10): DELETE(), GET(), PUT(), RouteParams, mockAuth, mockDeleteProject, mockGetProject, mockUpdateProject (+2 more)

### Community 48 - "Projects API"
Cohesion: 0.27
Nodes (10): GET(), POST(), mockAuth, mockCreateProject, mockGetUserProjects, {createProject}, {getUserProjects}, isListNameTaken() (+2 more)

### Community 49 - "Changelog & Release Notes"
Cohesion: 0.18
Nodes (12): Concurrent Bulk Lookup Performance Fix, Keep a Changelog Convention (external), Drag Handle Rounded-class Removal (design rule fix), PostHog Analytics Integration, Changelog v0.1.0 Release, WikiSelect Custom Dropdown, /api/lookup/bulk endpoint, Design System Non-negotiables (+4 more)

### Community 50 - "Citation Styles Docs"
Cohesion: 0.17
Nodes (12): Adding a Citation Style (workflow), Adding a Source Type (workflow), Citation Engine (src/lib/citation/), Export Formats (txt/BibTeX/RIS), APA 7th Edition Style, Chicago 17th Edition Style, Harvard Style, MLA 9th Edition Style (+4 more)

### Community 51 - "Color Tokens & Drag-Drop"
Cohesion: 0.17
Nodes (12): Wiki Color Tokens, Tag Color System, Color Contrast Verification, Citation Reordering (drag/keyboard), List/Project Tags, Citation Card (SortableCitation), Semantic Color Tokens, Drag & Drop Pattern (dnd-kit) (+4 more)

### Community 52 - "Citation Reorder API"
Cohesion: 0.21
Nodes (9): APIResponse, ReorderRequest, Citation, PREFIXES, Citation, Project, ShareLink, CitationFields (+1 more)

### Community 53 - "Project Lists API"
Cohesion: 0.23
Nodes (9): GET(), POST(), RouteParams, mockAuth, mockCreateList, mockGetProject, mockGetProjectLists, {getProject} (+1 more)

### Community 54 - "CI & Review Workflows"
Cohesion: 0.27
Nodes (11): CodeRabbit Review Configuration, actions/checkout@v4 (GitHub Action), actions/setup-node@v4 (Node 20, GitHub Action), anthropic-ai/claude-code-action (GitHub Action), GitHub CLI (gh) issue reporting, Full App Health Check Workflow (Depot), PR Review Workflow (Depot), Release Workflow (Depot) (+3 more)

### Community 55 - "Service Worker"
Cohesion: 0.22
Nodes (6): CACHEABLE_API_ROUTES, handleApiRequest(), handleCacheFirstRequest(), handleNetworkFirstRequest(), NETWORK_FIRST_ROUTES, PRECACHE_ASSETS

### Community 56 - "PubMed Lookup"
Cohesion: 0.29
Nodes (8): APIResponse, decodeXMLEntities(), extractPMID(), GET(), parseMonth(), parsePubMedXML(), POST(), PubMedMetadataResult

### Community 57 - "Wikipedia Lookup"
Cohesion: 0.25
Nodes (8): APIResponse, GET(), parseWikipediaUrl(), POST(), SAMPLE_WIKI_RESPONSE, transformWikipediaData(), WikiApiResponse, WikipediaMetadataResult

### Community 58 - "Root Layout & PWA Provider"
Cohesion: 0.22
Nodes (6): metadata, viewport, PostHogIdentify(), PWAProvider(), PWAProviderProps, SafariInstallBanner()

### Community 59 - "Share Embed & OG Image"
Cohesion: 0.22
Nodes (9): SharedCitation, SharedData, SharedList, ShareEmbedPage(), contentType, runtime, ShareOgImage(), size (+1 more)

### Community 60 - "Barnstar Milestones"
Cohesion: 0.25
Nodes (8): BarnstarToast(), BarnstarState, Milestone, MILESTONES, readState(), recordCitationSave(), useBarnstarAward(), writeState()

### Community 61 - "Data Model & Sharing Docs"
Cohesion: 0.31
Nodes (10): /api/lists CRUD endpoint, /api/projects CRUD endpoint, DynamoDB Single-Table Data Model, Getting Started Quickstart Guide, Lists Entity, Projects Entity, Public Share Links, Monthly Cost Estimates (+2 more)

### Community 62 - "XSS Hardening Notes"
Cohesion: 0.25
Nodes (9): isomorphic-dompurify (DOMPurify sanitization library), marked (Markdown-to-HTML parser library), XSS via unsanitized dangerouslySetInnerHTML, XSS via unsanitized marked output, Cite page component (referenced re: XSS risk, entity name unverified), Docs changelog page component (referenced re: XSS risk, entity name unverified), Share page component (referenced re: XSS risk, entity name unverified), SortableCitation() (+1 more)

### Community 63 - "arXiv Lookup"
Cohesion: 0.33
Nodes (6): APIResponse, ArxivMetadataResult, extractArxivId(), GET(), parseArxivXML(), POST()

### Community 64 - "Citeproc Types"
Cohesion: 0.22
Nodes (4): citeproc, CiteprocEngine, CiteprocStatic, CiteprocSys

### Community 65 - "Barcode Scanner"
Cohesion: 0.29
Nodes (5): @zxing/browser, @zxing/library, BarcodeScanner(), BarcodeScannerProps, isIsbn()

### Community 66 - "OG Image Messaging"
Cohesion: 0.39
Nodes (8): Citation Generator, Free and Open Source, GitHub Open Source Identity, No Ads Ever, No Fees, No Gen AI, OpenCitation OG Image, Wikipedia 2005 Aesthetic

### Community 67 - "Docs Layout & Sidebar"
Cohesion: 0.36
Nodes (4): DocsEditLink(), pathToFile(), DOCS_NAV, WikiDocsSidebar()

### Community 68 - "Offline React Hooks"
Cohesion: 0.57
Nodes (6): useOfflineCitations(), useOfflineLists(), useOfflineProjects(), useOnlineStatus(), usePWA(), useSyncState()

### Community 69 - "Logo Processing Script"
Cohesion: 0.29
Nodes (5): sharp, __dirname, __filename, inputPath, projectRoot

### Community 70 - "Share Dialog"
Cohesion: 0.33
Nodes (6): ActiveShare, ShareDialog(), ShareDialogProps, ShareListEntry, SlugMode, targetNoun()

### Community 71 - "Accessibility Audit"
Cohesion: 0.33
Nodes (6): WikiTabs Component, ADA Compliance Note, Accessibility Fixes Applied (this cycle), jest-axe Automated Testing, WCAG 2.1 AA Compliance Audit, WikiTabs Component Spec

### Community 72 - "Delete Benchmark Sim"
Cohesion: 0.73
Nodes (5): main(), mockApiCall(), runBatch(), runParallel(), runSequential()

### Community 73 - "CSL Style Fetcher"
Cohesion: 0.47
Nodes (5): fetchText(), HEADER(), main(), outDir, STYLES

### Community 74 - "Logo Artwork"
Cohesion: 0.50
Nodes (5): Collaborative Knowledge Assembly, Knowledge Symbols, OpenCitation Logo, Puzzle Sphere Design, Wikipedia-Inspired Aesthetic

### Community 76 - "App Icon"
Cohesion: 0.60
Nodes (5): Book Icon (Academic Reference), Knowledge and Citation Symbols, OpenCitation Application Icon, Quotation Marks (Citation Indicator), Wikipedia-style Puzzle Sphere

### Community 77 - "Navigation & Dropdown"
Cohesion: 0.50
Nodes (4): WikiDropdown Component, Skip Navigation Link, Navigation Layout (WikiLayout), WikiDropdown Component Spec

### Community 78 - "Logo PNG"
Cohesion: 0.50
Nodes (4): Wikipedia 2005 Aesthetic - Utilitarian Design, Interconnected Citations Metaphor, Knowledge Assembly through Citation, OpenCitation Logo - Puzzle Globe

### Community 79 - "Logo 1024"
Cohesion: 0.50
Nodes (4): OpenCitation Logo, Academic and Research Symbols, Knowledge Assembly via Puzzle Pieces, Wikipedia 2005-inspired Visual Design

### Community 80 - "Electron Types"
Cohesion: 0.50
Nodes (3): ElectronAPI, ElectronVersions, Window

### Community 81 - "Concurrent Fetching Lessons"
Cohesion: 1.00
Nodes (3): Promise.all concurrent data-fetching pattern, Concurrent Fetching with Owner IDs in Share Links, Resolve Data-Fetching Waterfalls

## Ambiguous Edges - Review These
- `SortableCitation()` → `XSS via unsanitized dangerouslySetInnerHTML`  [AMBIGUOUS]
  .jules/sentinel.md · relation: references
- `OpenCitation Project Overview` → `MVP Complete Status`  [AMBIGUOUS]
  PLAN.md · relation: conceptually_related_to
- `OpenCitation Project Overview` → `Chrome Extension Platform`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Citation Engine (src/lib/citation/)` → `AI Fallback Parsing (GPT-4o-mini) roadmap item`  [AMBIGUOUS]
  PLAN.md · relation: conceptually_related_to
- `XSS via unsanitized dangerouslySetInnerHTML` → `Cite page component (referenced re: XSS risk, entity name unverified)`  [AMBIGUOUS]
  .jules/sentinel.md · relation: references
- `XSS via unsanitized dangerouslySetInnerHTML` → `Share page component (referenced re: XSS risk, entity name unverified)`  [AMBIGUOUS]
  .jules/sentinel.md · relation: references
- `XSS via unsanitized marked output` → `Docs changelog page component (referenced re: XSS risk, entity name unverified)`  [AMBIGUOUS]
  .jules/sentinel.md · relation: references
- `XSS via unsanitized marked output` → `docs.ts module (referenced re: XSS risk, entity name unverified)`  [AMBIGUOUS]
  .jules/sentinel.md · relation: references

## Knowledge Gaps
- **598 isolated node(s):** `electron_1`, `path`, `url`, `gotTheLock`, `electron_1` (+593 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 719 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `SortableCitation()` and `XSS via unsanitized dangerouslySetInnerHTML`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `OpenCitation Project Overview` and `MVP Complete Status`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `OpenCitation Project Overview` and `Chrome Extension Platform`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Citation Engine (src/lib/citation/)` and `AI Fallback Parsing (GPT-4o-mini) roadmap item`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `XSS via unsanitized dangerouslySetInnerHTML` and `Cite page component (referenced re: XSS risk, entity name unverified)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `XSS via unsanitized dangerouslySetInnerHTML` and `Share page component (referenced re: XSS risk, entity name unverified)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `XSS via unsanitized marked output` and `Docs changelog page component (referenced re: XSS risk, entity name unverified)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
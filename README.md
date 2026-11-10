# OpenCitation

**A free, open-source citation manager for students, researchers, and curious minds.** Generate accurate citations, organize sources into lists and projects, and share or export your work—without ads or a paywall.

[![CI](https://github.com/aicoder2009/opencitation/actions/workflows/ci.yml/badge.svg)](https://github.com/aicoder2009/opencitation/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Web App](https://img.shields.io/badge/try-opencitation.app-2a4b8d)](https://opencitation.app)
[![Installable PWA](https://img.shields.io/badge/install-PWA-5a3fc0)](https://opencitation.app)
[![Support OpenCitation](https://img.shields.io/badge/%E2%99%A5%20Support%20OpenCitation-%243%20one--time-ea4aaa?style=for-the-badge)](https://github.com/sponsors/aicoder2009/sponsorships?frequency=one-time&amount=3)

OpenCitation is free to use. If it saves you time, you can optionally support its development with a [one-time contribution](https://github.com/sponsors/aicoder2009?frequency=one-time). No subscription or paid features are required.

## Why OpenCitation?

Most citation tools are ad-heavy, locked behind paywalls, or require an account just to format a URL. OpenCitation is different:

- **Free and open source** — no ads, no paywalls, no tracking beyond anonymous usage stats
- **Works offline** — installable as a PWA or Electron desktop app; citations you've saved are always available
- **No lock-in** — export everything as BibTeX, RIS, or plain text at any time
- **Built for real workflows** — bulk import from BibTeX/RIS, public share links, embeddable badges, and a command palette (⌘K)
- **Clean UI** — information-dense, Wikipedia-inspired design that gets out of your way

## Features

- **Generate Citations** - Create properly formatted citations from URLs, DOIs, ISBNs, or manual entry
- **Organize** - Save citations to Lists, organize Lists into Projects
- **Share** - Share Lists or Projects via public links
- **Export** - Copy to clipboard or download as text, BibTeX, or RIS

### Supported Citation Styles
- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- Harvard
- Journal & discipline styles via the Citation Style Language: IEEE, Vancouver, AMA, ACS, Nature, APSA, Chicago (Author-Date)

### Supported Source Types
Books, Academic Journals, Websites, Blogs, Newspapers, Videos, Images, Film, TV Series, TV Episodes, and Miscellaneous.

## Platforms

| Platform | Status |
|----------|--------|
| Web App | Ready |
| Chrome Extension | Ready |
| PWA (installable) | Ready |
| Electron Desktop | Ready |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4.0 |
| UI | Custom Wikipedia-style design system |
| Auth | Clerk |
| Database | DynamoDB (AWS SDK v3, single-table) |
| Testing | Vitest + Testing Library (695 tests) |
| Desktop | Electron |
| Extension | Chrome Manifest v3 |

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/aicoder2009/opencitation.git
cd opencitation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AWS DynamoDB (optional - uses local store if not set)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

### Commands

```bash
npm run quick-start  # First-time setup (installs deps, copies .env.example)
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests (695 tests)
```

## How It Works

### Citation Generation
1. **Quick Add:** Paste a URL, DOI, or ISBN - metadata is extracted automatically
2. **Manual Entry:** Form-based entry for full control over all fields
3. **Style Selection:** Choose from APA, MLA, Chicago, or Harvard — plus journal/discipline styles (IEEE, Vancouver, AMA, ACS, Nature, APSA, Chicago author-date) powered by the Citation Style Language

### Organization
- **Lists:** Collections of citations (like a bibliography)
- **Projects:** Containers for multiple Lists (like a semester or thesis)
- **Tags:** Color-coded tags for categorization

### Sharing & Export
- Generate public links for Lists or Projects
- Export as plain text, BibTeX (.bib), or RIS (.ris)
- Embed badge on external sites

## Project Structure

```
opencitation/
├── src/
│   ├── app/                 # Next.js pages & API routes
│   │   ├── cite/            # Citation generator
│   │   ├── lists/           # Lists management
│   │   ├── projects/        # Projects management
│   │   ├── share/[code]/    # Public share pages
│   │   ├── embed/           # Embed badge page
│   │   └── api/             # REST endpoints
│   ├── components/
│   │   ├── wiki/            # Wikipedia-style UI
│   │   ├── pwa/             # PWA components
│   │   └── retro/           # Retro print animation
│   ├── lib/
│   │   ├── citation/        # Formatters & exporters
│   │   ├── db/              # DynamoDB client
│   │   └── pwa/             # Service worker utilities
│   └── types/               # TypeScript definitions
├── electron/                # Desktop app
└── public/                  # Static assets
```

## Contributing

Contributions are welcome! Please read the development guidelines in `CLAUDE.md` before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspired by Wikipedia circa 2005-2010
- Built for students who hate citation generators with ads

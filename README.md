# OpenCitation

An open source citation manager, generator, and sharing tool. Ad-free, easy to use, with a clean Wikipedia 2005-inspired design.

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
| Testing | Vitest + Testing Library (225 tests) |
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
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run tests (225 tests)
```

## How It Works

### Citation Generation
1. **Quick Add:** Paste a URL, DOI, or ISBN - metadata is extracted automatically
2. **Manual Entry:** Form-based entry for full control over all fields
3. **Style Selection:** Choose from APA, MLA, Chicago, or Harvard

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
├── browser-extension/       # Chrome extension
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

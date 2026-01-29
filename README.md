# OpenCitation

An open source citation manager, generator, and sharing tool. Ad-free, easy to use, with a clean Wikipedia 2005-inspired design.

## Features

- **Generate Citations** - Create properly formatted citations from URLs, DOIs, ISBNs, or manual entry
- **Organize** - Save citations to Lists, organize Lists into Projects
- **Share** - Share Lists or Projects via public links
- **Export** - Copy to clipboard or download in multiple formats

### Supported Citation Styles
- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- Harvard

### Supported Source Types
Books, Academic Journals, Websites, Blogs, Newspapers, Videos, Images, Film, TV Series, TV Episodes, and more.

## Development Status

| Feature | Status |
|---------|--------|
| Citation Engine (4 styles, 11 types) | ✅ Complete |
| URL/DOI/ISBN Lookup APIs | ✅ Complete |
| Wikipedia-style UI | ✅ Complete |
| Authentication (Clerk) | ✅ Configured |
| Test Suite (82 tests) | ✅ Passing |
| Lists & Projects | 🔲 In Progress |
| Sharing | 🔲 Planned |
| Export | 🔲 Planned |

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4.0 | ✅ |
| UI Components | Custom Wikipedia-style design system | ✅ |
| Auth | Clerk | ✅ |
| Testing | Vitest + Testing Library | ✅ |
| Database | DynamoDB | 🔲 |
| AI Parsing | OpenAI GPT-4o-mini (fallback) | 🔲 |
| Hosting | Vercel | 🔲 |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

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

# AWS DynamoDB
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# OpenAI (for AI fallback parsing)
OPENAI_API_KEY=
```

## How It Works

### Citation Generation
1. **Quick Add (URL-Based):** Paste a URL, select source type and citation style
   - Web crawler extracts OpenGraph/meta tags (free)
   - AI fallback if crawler is incomplete (~$0.01 per citation)
2. **DOI/ISBN Lookup:** Direct lookup via CrossRef and Open Library APIs
3. **Manual Entry:** Form-based entry for full control

### Organization
- **Lists:** Collections of citations (like a bibliography)
- **Projects:** Containers for multiple Lists (like a semester or thesis)
- **Sharing:** Generate public links for Lists or Projects

## Project Structure

```
opencitation/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   ├── cite/            # Citation creation
│   │   └── share/           # Public shared views
│   ├── components/          # React components
│   │   ├── wiki/            # Wikipedia-style design system
│   │   └── citation/        # Citation components
│   ├── lib/
│   │   ├── citation/        # Citation formatters
│   │   └── db/              # Database utilities
│   └── types/               # TypeScript definitions
├── PLAN.md                  # Development plan & status
└── CLAUDE.md                # AI assistant guidelines
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
- Built with love for students everywhere who hate citation generators with ads

# DiffChecker

A browser-based tool for comparing text and Excel/CSV files side by side. It is statically exported by Next.js and deployed through the existing Cloudflare Pages Git integration.

All comparison and history processing stays in the browser. Text, code, and spreadsheet contents are never uploaded by this application.

## Features

- **Text Compare** — Paste two texts and instantly see word-level or character-level diffs in a split view
- **Excel Compare** — Upload `.xlsx`, `.xls`, or `.csv` files to compare spreadsheets cell by cell
  - Table view with color-coded additions, removals, and modifications
  - Text (CSV) view for raw line-by-line comparison
  - Configurable header line and sheet selection
- **Diff History** — Saves comparison summaries and results locally in IndexedDB for later review
- **Responsive Glance-style UI** — Designed for both standalone use and narrow dashboard iframes
- **Dark / Light Theme** — Follows the system color preference

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript |
| Diff Engine | [diff](https://www.npmjs.com/package/diff) (text), custom engine (Excel) |
| Spreadsheet | [SheetJS (xlsx)](https://sheetjs.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Storage | Native IndexedDB (browser-side) |
| Deployment | [Cloudflare Pages](https://pages.cloudflare.com/) using Next.js static export |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with shared navigation
│   ├── globals.css             # CSS variables and theme definitions
│   ├── page.tsx                # Default text comparison page
│   ├── text-compare/page.tsx   # Text comparison page
│   └── excel-compare/page.tsx  # Excel comparison page
├── components/
│   ├── navigation.tsx          # Tab navigation (Next.js Link-based routing)
│   ├── text-compare-editor/    # Text diff editor component
│   └── excel-compare-editor/
│       ├── index.tsx           # Main orchestration component
│       ├── diff-engine.ts      # Pure diff computation logic
│       ├── drop-zone.tsx       # File drag & drop upload
│       ├── spreadsheet-preview.tsx
│       ├── table-diff-view.tsx
│       ├── text-diff-view.tsx
│       └── styles.module.css   # Responsive component styles
├── diff-store/
│   ├── index.ts                # IndexedDB storage layer (native API)
│   └── types.ts                # Saved diff and summary types
├── lib/
│   └── sequence-diff.ts        # Bounded sequence alignment helper
└── types/
    └── excel-diff.ts           # DiffRow, DiffHeader, DiffData types
```

## Getting Started

### Prerequisites

- Node.js 20.9+
- npm (or pnpm / yarn)

### Local Development

```bash
# Clone
git clone https://github.com/MeiTetsuH/diffchecker.git
cd diffchecker

# Install dependencies
npm install

# Start dev server (Turbopack)
npm run dev
```

Open http://localhost:3000 to view the app.

### Cloudflare Deployment

```bash
# Build & deploy directly to the existing Cloudflare Pages project
npm run deploy

# Or preview locally with Wrangler
npm run preview
```

## License

MIT

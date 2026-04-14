# DiffChecker

A web-based tool to compare text and Excel/CSV files, highlighting differences side by side. Built with Next.js and deployed on Cloudflare Pages via [OpenNext](https://opennext.js.org/cloudflare).

## Features

- **Text Compare** — Paste two texts and instantly see word-level or character-level diffs in a split view
- **Excel Compare** — Upload `.xlsx`, `.xls`, or `.csv` files to compare spreadsheets cell by cell
  - Table view with color-coded additions, removals, and modifications
  - Text (CSV) view for raw line-by-line comparison
  - Configurable header line and sheet selection
- **Diff History** — Automatically saves comparison results to IndexedDB for later review
- **Dark / Light Theme** — Follows system preference with manual override support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript |
| Diff Engine | [diff](https://www.npmjs.com/package/diff) (text), custom engine (Excel) |
| Spreadsheet | [SheetJS (xlsx)](https://sheetjs.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Storage | Native IndexedDB (browser-side) |
| Deployment | [Cloudflare Pages](https://pages.cloudflare.com/) via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with shared navigation
│   ├── globals.css             # CSS variables and theme definitions
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
│       └── styles.ts           # Shared inline style objects
├── diff-store/
│   ├── index.ts                # IndexedDB storage layer (native API)
│   └── types.ts                # SavedDiff / SavedDiffDTO types
└── types/
    └── excel-diff.ts           # DiffRow, DiffHeader, DiffData types
```

## Getting Started

### Prerequisites

- Node.js 18+
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
# Build & deploy to Cloudflare Pages
npm run deploy

# Or preview locally with Wrangler
npm run preview
```

## License

MIT
# DiffChecker

A browser-based tool for comparing text and Excel/CSV files side by side. It is statically exported by Next.js and deployed through the existing Cloudflare Pages Git integration.

## Privacy

Every comparison runs inside your browser. Files you pick are read with the File API, parsed in the page, diffed in the page, and — if you save one — stored in your own browser's IndexedDB. Nothing is sent to a server, because there is no server: the deployment is a bundle of static files.

That claim is enforced rather than merely stated. `public/_headers` ships a Content-Security-Policy whose `connect-src 'self'` directive means no script on the page can open a request to any external host; `default-src 'self'` and `object-src 'none'` close the usual side doors. If a future change ever tried to phone home, the browser would block it.

In the UI this shows up as the quiet **Local only** badge in the top-right of the navigation bar — hover it for the full explanation. It is deliberately understated: a persistent banner spends a strip of vertical space on every page, and the space belongs to the diff.

## Features

- **Text Compare** — Paste two texts and see word-level or character-level diffs in a split view
- **Excel Compare** — Load `.xlsx`, `.xls`, `.csv`, or `.tsv` files to compare spreadsheets cell by cell
  - Table view with color-coded additions, removals, and modifications
  - Text (CSV) view for raw line-by-line comparison
  - Configurable header line and sheet selection
- **Diff History** — Saves comparisons locally in IndexedDB; re-running the same pair of files updates that entry instead of appending a duplicate
- **Aligned split view** — Both sides of a row live in a single grid row, so they stay level even when a long line wraps, and scroll together as one surface
- **Honest degradation** — When two inputs are too different to align exactly, the bounded diff falls back to positional pairing and says so rather than presenting the result as an exact match
- **Embeddable** — Works standalone or inside a narrow dashboard iframe
- **Dark / Light Theme** — Follows the system color preference

## Behaviour worth knowing

- **Column detection.** Column count comes from the widest row in the sheet, not from the header row. Data rows routinely run past the last labelled header cell; unlabelled columns are named `Column N` and are compared like any other. (A narrower rule would silently hide real differences.)
- **Blank rows.** Both the table view and the CSV view skip blank rows, so row numbering agrees between the two tabs.
- **Value comparison.** Cells are compared as strings, so the number `1` and the text `"1"` count as equal.
- **File size limit.** Spreadsheets are parsed on the main thread, so files above 25 MB are refused rather than freezing the tab. (Turbopack does not compile web workers under `output: export` — it emits the worker source uncompiled — so off-thread parsing is not available yet.)
- **Diff bound.** Alignment uses a `maxEditLength` of 2000. Past that the engine pairs rows by position and surfaces a notice.
- **Embedding.** The CSP restricts framing with `frame-ancestors` rather than
  blocking it, because this app is embedded in a dashboard iframe. The allowlist
  currently covers our own origin plus `mingzhe.uk` and its subdomains — add any
  new embedding host there, in `public/_headers`. There is intentionally no
  `X-Frame-Options` header: it is all-or-nothing in modern browsers, so a `DENY`
  there would silently override the allowlist.

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

SheetJS is code-split: the ~500 KB parser chunk is fetched only when you actually load a spreadsheet, so neither page pays for it up front.

## Project Structure

```
public/
└── _headers                    # Cloudflare Pages: CSP, security headers, caching
src/
├── app/
│   ├── layout.tsx              # Root layout with shared navigation
│   ├── globals.css             # CSS variables and theme definitions
│   ├── page.tsx                # Default text comparison page
│   ├── text-compare/page.tsx   # Text comparison page (canonical → /)
│   └── excel-compare/
│       ├── layout.tsx          # Route metadata (client page cannot export it)
│       └── page.tsx            # Excel comparison page
├── components/
│   ├── navigation.tsx          # Tab navigation + "Local only" privacy badge
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
git clone https://github.com/MeiTetsuH/diffchecker.git
cd diffchecker
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

Note that `next dev` does not apply `public/_headers`. To exercise the real
Content-Security-Policy, use the Wrangler preview below.

### Checks

```bash
npm run check
```

Runs `typecheck`, `lint`, and `build` in sequence.

### Cloudflare Deployment

```bash
# Build & deploy directly to the existing Cloudflare Pages project
npm run deploy

# Or preview locally with Wrangler, headers and all
npm run preview
```

## License

MIT

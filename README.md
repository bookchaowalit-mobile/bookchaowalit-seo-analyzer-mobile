# Seo Analyzer — Mobile

Ionic + React cross-platform mobile app for **Seo Analyzer**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Features

- **On-page SEO audit** (Home tab): paste a page's HTML (and optionally a focus
  keyword) to get a 0-100 score and pass/warn/fail checks for title and meta
  description length, a single H1, image alt text, `lang`, mobile viewport,
  canonical URL, Open Graph title, `noindex`, content length, and keyword
  presence/density. Everything runs on-device; no page is fetched.
- Analysis lives in `src/lib/seo.ts` (pure TypeScript, unit-tested).

## Tech Stack

- **Framework:** Ionic 8 + React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI:** Ionic Components + Ionicons

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev         # Vite dev server
npm run typecheck   # tsc (noEmit)
npm run lint        # ESLint flat config (typescript-eslint + react-hooks)
npm test            # vitest unit tests for src/lib
npm run build       # tsc && vite build
```

CI (`.github/workflows/build.yml`) runs all of the above with `npm ci`; failures
are not masked.

## Build

```bash
npm run build
# Deploy as native app via Capacitor or as PWA
```

## Related

- **Frontend:** [bookchaowalit-website/seo-analyzer-frontend](https://github.com/bookchaowalit-website/seo-analyzer-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT

# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working on-device SEO audit of pasted HTML (11+ checks,
score, keyword density) with tested logic and honest CI; cannot fetch URLs yet.

## Backlog

- P0: Analyze by URL via the seo-analyzer backend (browser CORS blocks direct fetches;
  do not add a client-side proxy).
- P1: Code-split Ionic (bundle is ~1 MB; Vite warns about chunk size).
- P2: More checks: heading hierarchy gaps, duplicate titles, structured data (JSON-LD), link counts.
- P2: Capacitor config for native builds; PWA manifest.

## Done in this pass

- Fixed missing `setupIonicReact()` and the missing `padding.css`/`text-alignment.css`
  imports (so `ion-padding` actually applied).
- Analyzer screen backed by pure `src/lib/seo.ts` (tolerant attribute parsing,
  visible-text extraction, Unicode word/keyword counting, weighted score) with 7 vitest tests.
- `npm run lint` was broken (ESLint not installed); added ESLint 9 flat config.
- CI runs `npm ci`, typecheck, lint, tests and build without `|| true`; lockfile committed.

## Done in this pass (pass 2)

Score: 6/10 (was 5/10) — reports can be shared/copied, recent analyses are kept, and the Home page has component tests.

- History: each analysis stores a summary (title, score, words, failed checks, keyword — never the pasted HTML) in localStorage, newest first, capped at 20; parsing is defensive (`src/lib/history.ts`, tested). Clear button included.
- Export: "Share / copy report" uses the Web Share API when present, else the clipboard, with a status message; text built by tested `formatReport`.
- Component tests: `src/pages/__tests__/Home.test.tsx` (Vitest + jsdom + @testing-library/react) — analyze + history, clipboard fallback, clear. 13 tests total.
- Advisories: `npm audit --omit=dev` is clean; dev-only vite 5/esbuild/vitest findings need major upgrades.
- Verified: typecheck, lint, vitest, `npm run build`.

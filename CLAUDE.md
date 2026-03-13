# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Electron desktop app (hot reload) — builds server first, then runs Vite + Electron
npm run dev:web      # Browser only — runs Vite + Express (no Electron)
```

### Build & Package
```bash
npm run build        # Build UI → server/public, then build Docker image
npm run package      # Build UI + server, then produce Electron installer via electron-builder
```

### Testing
```bash
npm test -w packages/server          # Run all server unit tests (vitest)
npm run test:watch -w packages/server  # Watch mode
npm run test:coverage -w packages/server
```

### Code Quality
```bash
npm run lint         # ESLint across all packages
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier across all packages
npm run format:check
```

### Single test file
```bash
cd packages/server && npx vitest run tests/cbzParser.test.ts
```

## Architecture

This is a **npm workspaces monorepo** with three packages:

```
packages/
  server/   Node.js + Express + TypeScript — all business logic lives here
  ui/       React + Vite + TypeScript + Tailwind — no knowledge of Electron
  desktop/  Electron only (~20 lines) — thin wrapper that spawns the server
```

### Key architectural rules
- **No business logic in `desktop/`** — it only imports `start()` from `@cbz-tool/server`, creates a `BrowserWindow`, and points it at either Vite (dev) or Express (prod).
- **`server/public/`** is a build artifact (git-ignored) — Vite builds into it. The server serves it in production via `join(__dirname, '..', 'public')` (one level up from `dist/`).
- **`server/dist/`** is also git-ignored — TypeScript compiles here. The server `"main"` points to `dist/index.js`.
- The server exports `start(port)` for Electron and `bin.ts` as the standalone Docker entry point.

### Server internals (`packages/server/`)
- `index.ts` — Express app factory, mounts the CBZ router, serves static UI in prod
- `routes/cbz.ts` — Four endpoints: `POST /api/cbz/upload`, `GET /api/cbz/:bookId/page/:index`, `DELETE /api/cbz/:bookId/page/:index` (returns updated `{ pageCount, pages }`), `DELETE /api/cbz/:bookId` (204)
- `services/cbzParser.ts` — Core logic: reads a ZIP buffer with yauzl, filters images (jpg/png/webp), natural-sorts pages, parses `ComicInfo.xml` with fast-xml-parser. `getMime`, `isImageEntry`, and `parseMetadata` are exported for unit testing.
- `services/cbzStore.ts` — In-memory `Map<bookId, Book>` storing raw image buffers. Single-user, no persistence.

### Data flow
1. UI uploads a `.cbz` file via `POST /api/cbz/upload` (multer, 50 MB limit)
2. Server extracts ZIP → stores `Book` (with page `Buffer`s) in memory → returns page manifest
3. UI renders `<img src="/api/cbz/:bookId/page/:index">` — browser fetches each image directly, server streams the buffer

### UI internals (`packages/ui/src/`)
- `hooks/useCbzUpload.ts` — manages upload state (`book`, `loading`, `error`); exposes `upload` and `removePage`
- `components/FileUpload.tsx` — file picker + drag-and-drop zone
- `components/PageList.tsx` — collapsible metadata panel + responsive image grid with per-page delete (hover overlay → confirmation modal)
- Image `src` URLs include `?v={filename}` as a cache-buster so the browser refetches after pages are renumbered server-side

### Testing (`packages/server/tests/`)
- Uses **Vitest** with `pool: 'forks'` (required for NodeNext ESM)
- `tests/helpers/makeZip.ts` — creates real in-memory ZIP buffers via jszip for `parseCbz` tests
- No mocking of yauzl — tests use real ZIP buffers to catch actual parsing failures

### Deployment targets
- **Electron**: `npm run dev` / `npm run package` → NSIS installer in `packages/desktop/release/`
- **Docker**: `npm run build` → image `LuzAramburo/cbz-tool`; self-hosters use `docker-compose.yml`
- Code signing is disabled for local builds (`CSC_IDENTITY_AUTO_DISCOVERY=false`)

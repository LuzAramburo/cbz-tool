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
- The server exports `start(port)` and `initStore(dir)` for Electron, and `bin.ts` as the standalone Docker entry point. Both entry points must call `initStore` before `start`.

### Environment variables
- `DATA_DIR` — directory for persistent book storage (default: `./data`). Each book gets `DATA_DIR/bookId/manifest.json` + `DATA_DIR/bookId/pages/`.
- `MAX_FILE_SIZE_MB` — multer upload size limit (default: `100`). Used by both server (multer) and UI (via `GET /api/config`).
- `NODE_ENV` — `development` vs production (controls static file serving, Vite proxy)

### Server internals (`packages/server/`)
- `index.ts` — Express app factory; `GET /api/config` returns `{ maxFileSizeMb }`; mounts the book router at `/api/books`; serves static UI in prod
- `routes/cbz.ts` — Thin router: multer setup, route-to-controller wiring, and the multer error handler. All book endpoints mounted at `/api/books`:
  - `GET /` — list all books → `BookSummary[]`
  - `POST /upload` — multer `array('files')` → parse each CBZ → `BulkUploadResponse { succeeded: UploadResponse[], failed: { filename, error }[] }`; UI opens book only if exactly 1 succeeded
  - `POST /merge` — body `{ bookIds: string[], metadata? }` → merge books in order → `UploadResponse`; must be declared BEFORE `GET /:bookId` (else "merge" is captured as a bookId param)
  - `GET /:bookId` — single book details → `UploadResponse`
  - `GET /:bookId/page/:index` — serve page image via `sendFile` from disk
  - `POST /:bookId/pages` — multer `array('files')`, body `insertAt` → add pages → `{ pageCount, pages }`
  - `PATCH /:bookId/page/:index` — body `{ toIndex }` → move page → `{ pageCount, pages }`
  - `DELETE /:bookId/page/:index` — remove page → `{ pageCount, pages }`
  - `PATCH /:bookId/metadata` — body `{ metadata: Record<string,string> | null }` → replace all → `{ metadata }`
  - `PUT /:bookId/metadata/:key` — body `{ value }` → set single key → `{ metadata }`
  - `DELETE /:bookId/metadata/:key` — remove key → `{ metadata }`
  - `GET /:bookId/download` — rebuild ZIP with JSZip, re-embed `ComicInfo.xml`; filename: `Series #N - Title.cbz`
  - `DELETE /:bookId` — delete book from disk and cache → 204
- `controllers/books.ts` — handlers for book-level operations: `getBooks`, `uploadBooks`, `mergeBook`, `bulkDeleteBooks`, `getBookById`, `downloadBook`, `deleteBookById`
- `controllers/pages.ts` — handlers for page operations: `getPage`, `addPagesToBook`, `moveBookPage`, `deleteBookPage`
- `controllers/metadata.ts` — handlers for metadata operations: `patchMetadata`, `setMetadataKey`, `deleteMetadataKey`
- `services/cbzParser.ts` — Core logic: reads a ZIP buffer with yauzl, filters images (jpg/png/webp), natural-sorts pages, parses `ComicInfo.xml` with fast-xml-parser. `getMime`, `isImageEntry`, and `parseMetadata` are exported for unit testing.
- `services/cbzStore.ts` — Persistent store backed by disk (`DATA_DIR`) with an in-memory `Map<bookId, Book>` cache. `initStore(dir)` creates the data directory and loads existing manifests on startup. Pages are stored as individual files on disk; `getPagePath(bookId, filename)` resolves the full path for `sendFile`. `addPages` splices entries at `insertAt` and resolves filename collisions via `uniqueFilename`; `movePage` splices the page out and re-inserts at `toIndex`; `updateMetadata`/`setMetadataProperty`/`removeMetadataProperty` mutate metadata; all page `index` fields are rewritten after every mutation. Every mutation writes an updated `manifest.json` to disk.

### Data flow
1. On startup, `initStore(DATA_DIR)` scans for existing books (directories with `manifest.json`) and populates the in-memory cache
2. UI uploads a `.cbz` file via `POST /api/books/upload` → server extracts ZIP → writes pages to disk + caches `Book` → returns page manifest
3. UI renders `<img src="/api/books/:bookId/page/:index">` — server resolves the page file path via `getPagePath` and serves it with `res.sendFile`
4. UI can also browse the library (`GET /api/books`) and open an existing book (`GET /api/books/:bookId`) without re-uploading

### UI internals (`packages/ui/src/`)
- `views/HomeView.tsx` — feature launcher home page (square cards per feature)
- `views/EditorView.tsx` — full upload/edit flow (book state, modals, scroll behavior)
- `views/MergeView.tsx` — merge books page: library grid with selection order, metadata pre-fill from first selected book, merge + download result
- `hooks/useBookOperations.ts` — shared base hook for `upload` (returns `BulkUploadResponse`) and `remove` (deletes by bookId); takes a `setError` callback so callers unify error state; used by both `useEditorBooks` and `useMergeBooks`
- `hooks/useEditorBooks.ts` — editor hook; wraps `useBookOperations` for upload/delete, adds `openBook`, `removePage`, `addPages`, `movePage`, `saveMetadata`, `downloadBook` (patches metadata first); owns `refreshKey` state and calls `refresh()` after every mutation
- `hooks/useMergeBooks.ts` — merge hook; wraps `useBookOperations`, adds `listBooks` (with refresh), `merge`, `downloadMerged`, `mergedBook` state
- `clients/booksClient.ts` — typed fetch wrappers for all `/api/books` endpoints; shared `apiFetch<T>()` helper for error handling
- `components/` is organised into subfolders by responsibility:
  - `layout/` — app shell: `NavHeader.tsx`, `ActionBar.tsx`, `ToggleThemeButton.tsx`
  - `editor/` — components owned by EditorView: `FileUpload.tsx`, `BookLibrary.tsx`, `BookCard.tsx`, `BookMetadata.tsx`, `PageGrid.tsx`, `PageThumbnail.tsx`
  - `modals/` — modal system: `Modal.tsx`, `CloseButton.tsx`, `UploadBookModal.tsx`, `AddPagesModal.tsx`, `LibraryModal.tsx`
  - `icons/` — SVG icon components (see Icons gotcha below)
- `components/editor/FileUpload.tsx` — file picker + drag-and-drop zone; validates `.cbz` extension on drop
- `components/editor/BookLibrary.tsx` — fetches and displays library as a grid of `BookCard`s; accepts `onEmpty` callback for auto-closing modals when the last book is deleted; re-fetches on `refreshKey` change
- `components/modals/LibraryModal.tsx` — wraps `BookLibrary` in a modal; threads `onEmpty` to auto-close
- `components/editor/BookCard.tsx` — single book entry showing cover image, title, series/number, page count; hover reveals delete button
- `components/editor/BookMetadata.tsx` — collapsible metadata panel with editable fields; `summary` key gets a `<textarea>`, all others `<input>`; calls `onMetadataChange(fullMetadataObject)` on every field change; supports add/delete of individual properties
- `components/editor/PageGrid.tsx` — responsive image grid with move and delete modals; owns all page-interaction state (`pendingIndex`, `movingIndex`, `moveToSource`)
- `components/modals/UploadBookModal.tsx` — wraps `FileUpload` in a modal; uses `handleUploadAndClose` in `EditorView.tsx` so the modal closes only on successful upload
- `components/modals/AddPagesModal.tsx` — stages image files (jpg/png/webp), picks insert position, calls `addPages`; filters unsupported formats on select/drop
- **Cache-busting for images**: use content-derived values (filename), never `refreshKey`, as the `?v=` cache-buster. `refreshKey` resets to 0 on every fresh component mount (e.g. HomeView), so `?v=0` can be served from browser cache with stale content. `PageThumbnail` uses `page.filename`; `BookCard` uses `book.coverFilename` (the actual filename of page 0, returned by `GET /api/books`). `refreshKey` is still needed to trigger `BookLibrary` re-fetches via its `useEffect([refreshKey])` — just never as the `?v=` value in an `<img src>`.
- Modals lock `document.body` scroll on mount via a `useEffect` cleanup pattern

### Testing (`packages/server/tests/`)
- Uses **Vitest** with `pool: 'forks'` (required for NodeNext ESM)
- `tests/helpers/makeZip.ts` — creates real in-memory ZIP buffers via jszip for `parseCbz` tests
- No mocking of yauzl — tests use real ZIP buffers to catch actual parsing failures

### Deployment targets
- **Electron**: `npm run dev` / `npm run package` → NSIS installer in `packages/desktop/release/`
- **Docker**: self-hosters just run `docker compose up` — the multi-stage `Dockerfile` builds the UI and server internally with no local build step required. Publishing is automated: pushing a `v*.*.*` tag triggers the `docker-publish` GitHub Actions workflow, which builds and pushes both the versioned tag and `latest` to Docker Hub.
- Code signing is disabled for local builds (`CSC_IDENTITY_AUTO_DISCOVERY=false`)
- **Releasing**: follow `RELEASING.md` — update `CHANGELOG.md`, bump version in all three `package.json` files, build Docker, package Electron, commit, tag, push.

### Gotchas
- **Routing**: Uses **Wouter v3** with browser History API (no hashes). Default `<Router>` is sufficient — no custom hook needed. Vite dev server and the Express `*` catch-all both serve `index.html` for deep links automatically. Routes: `/` → Home, `/editor` → Editor, `/merge` → Merge.
- **Icons**: `components/icons/` — action icons use `size: IconSize` + `iconSizes` map. Standalone display icons (e.g. used large in cards) accept a `className` prop instead. Do not mix patterns.
- **ESM + dotenv hoisting**: Static `import` statements are hoisted before any code runs, so `process.env` values set by `dotenv.config()` arrive too late for module-level constants. Always use `await import('./module.js')` (dynamic import) for server modules that read env vars at load time — see `bin.ts` and `desktop/index.js`.
- **Two server entry points**: `npm run dev:web` goes through `packages/server/bin.ts`; `npm run dev` (Electron) goes through `packages/desktop/index.js`. Any env/startup logic (e.g. dotenv) must be in **both**.
- **Vite/Express startup race**: In `dev:web`, Vite opens the browser before Express is ready. UI fetches to `/api/*` on mount will get `ECONNREFUSED` and should include retry logic rather than failing silently once.
- **Electron version bumps**: `packages/desktop/package.json` has the version in **two** places — `devDependencies.electron` and `build.electronVersion`. Both must be updated together.
- **`BookMetadata` type vs component name clash**: `types/cbz` exports a `BookMetadata` type and `components/editor/BookMetadata.tsx` is a component of the same name. Importing both in the same file causes `TS2300`. Fix: alias the component — `import BookMetadataPanel from '../components/editor/BookMetadata'`.

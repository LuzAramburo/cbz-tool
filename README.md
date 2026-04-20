# CBZ Tool

A tool for editing CBZ (Comic Book Zip) files. Upload one or more CBZs, edit pages and metadata, then download the result.

Available as a desktop app (Electron), a self-hosted web app (Docker), or a local dev server.

## Features

**Editor**
- Upload one or more CBZ files at once via file picker or drag and drop
- Browse and reopen books from a persistent library, sorted by title
- Bulk delete books from the library
- View all pages as a responsive image grid with fast-loading thumbnails
- Zoom into any page at full resolution with a keyboard-navigable image viewer
- Reorder pages by drag-and-drop (activate reorder mode, then drag any page to its new position) or by moving them to any position
- Delete individual pages or bulk-delete multiple pages at once
- Add new pages (JPG, PNG, WEBP) at any position
- Edit embedded ComicInfo.xml metadata — add, edit, or remove individual fields
- Download the modified CBZ with changes applied

**Merge**
- Select two or more books from the library and set the merge order
- Customize the merged book's metadata before combining
- Download the result or open it directly in the editor

---

## Project structure
```
cbz-tool/
├── package.json           ← workspace root, dev scripts
├── Dockerfile             ← multi-stage build: server + baked UI
├── docker-compose.yml     ← for self-hosters
├── .env.example           ← documents available environment variables
└── packages/
    ├── server/
    │   ├── index.ts       ← Express app factory, mounts API routes, serves UI in prod
    │   ├── bin.ts         ← entry point for Docker/standalone (loads .env, starts server)
    │   └── public/        ← built UI output (git-ignored, generated at build time)
    ├── ui/
    │   ├── vite.config.ts ← proxies /api to Express in dev, builds into server/public
    │   └── src/
    └── desktop/
        └── index.js       ← Electron entry: loads .env, spawns server, opens window
```

---

# Running the app

## Self-hosting with Docker

Download the compose file and start the container:

```bash
curl -O https://raw.githubusercontent.com/LuzAramburo/cbz-tool/main/docker-compose.yml
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000).

### Configuration

Set environment variables in `docker-compose.yml` to override defaults:

```yaml
services:
  app:
    image: luzaramburo/cbz-tool:latest
    ports:
      - "3000:3000"
    environment:
      - MAX_FILE_SIZE_MB=100  # default is 100
      - DATA_DIR=/app/data
    volumes:
      - app-data:/app/data   # persist library across restarts

volumes:
  app-data:
```

| Variable | Default | Description |
|---|---|---|
| `MAX_FILE_SIZE_MB` | `100` | Maximum upload size in MB. Reflected in both the server limit and the UI hint. |
| `DATA_DIR` | `./data` | Directory where books are stored on disk. Mount a volume here to persist your library. |

## Desktop app (Electron)

Download the installer from the [releases page](https://github.com/LuzAramburo/cbz-tool/releases).

## Development

```bash
npm install
npm run dev        # Electron desktop app with hot reload
npm run dev:web    # Browser only at http://localhost:5173
```

To override configuration locally, copy `.env.example` to `.env` at the project root:

```bash
cp .env.example .env
# then edit .env
```

Other useful commands:

```bash
npm run lint                          # ESLint across all packages
npm run format                        # Prettier across all packages
npm test -w packages/server           # Run server unit tests
npm run package                       # Build Electron installer
```

## Publishing

See `RELEASING.md` for the full release checklist.

```bash
npm run build                         # build UI + bake into Docker image
docker push luzaramburo/cbz-tool:<version>
docker push luzaramburo/cbz-tool:latest
```

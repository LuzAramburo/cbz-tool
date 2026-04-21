# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2026-04-20

### Fixed
- Electron crash ("Invalid response status code 204") when deleting a book; the custom `cbz://` protocol proxy now passes a null body for 204 responses, as required by the Fetch spec

## [1.3.0] - 2026-04-19

### Added
- Full-size page viewer: click the zoom icon on any thumbnail to open an image lightbox with prev/next navigation and keyboard arrow key support
- Drag-and-drop page reordering: activate "Reorder pages" mode and drag thumbnails to rearrange them; moves are applied optimistically for instant feedback
- Server-side thumbnail generation for the page grid and library covers — images are resized to 300 px wide JPEG and cached on disk, significantly reducing load times for large CBZ files
- Electron production builds no longer occupy any TCP port — Express now listens on a named pipe (Windows) or Unix socket (Mac/Linux) and the renderer uses a custom `cbz://` protocol; dev mode remains on TCP and is configurable via a `PORT` environment variable

### Changed
- `start()` in `packages/server` now accepts a string path (named pipe / Unix socket) in addition to a port number, enabling port-free operation in Electron

### Fixed
- Server crash on Windows when deleting a page while a thumbnail was being generated for it (EBUSY file lock); thumbnail generation now reads the file into memory before processing so the file handle is released before sharp begins work

## [1.2.1] - 2026-04-17

### Added
- GitHub Actions workflow (`docker-publish.yml`) automatically builds and pushes the Docker image to Docker Hub on `v*.*.*` tags
- Book library displayed on the home page; clicking a book opens it directly in the editor
- Bulk delete pages: "Bulk delete pages" mode in the editor selects multiple pages at once and removes them in a single operation

### Fixed
- Book cover images now update correctly after deleting the first page, for real this time, I think.

### Changed
- Default `MAX_FILE_SIZE_MB` raised from 50 to 100
- Electron updated to 41.2.1 (Chromium 146, V8 14.6, Node 24.14.0)

## [1.2.0] - 2026-04-15

### Added
- Bulk upload: multiple CBZ files can be uploaded at once; each file succeeds or fails independently
- Bulk delete: "Select for Bulk Delete" mode in the library with "Select All / Deselect All" and a confirmation prompt before deletion
- `POST /api/books/delete` endpoint accepting `{ bookIds: string[] }` and returning `{ deleted, notFound }`
- Library books are now sorted alphabetically by title with natural number ordering (e.g. Chapter 2 before Chapter 10), in both the Editor and Merge views

### Changed
- Single-file upload auto-opens the book; multi-file upload adds all to the library without opening any
- Upload button now shows "Uploading…" and is disabled while files are being processed
- Switching to a different book scrolls the page back to the top automatically

### Fixed
- Cover images in the library now refresh correctly after page mutations (add, remove, move) and single-file uploads

## [1.1.0] - 2026-04-12

### Added
- Merge view: select two or more books and merge them into a single CBZ in order
- Merged book inherits metadata from the first selected book by default, with the option to override before merging
- `POST /api/books/merge` endpoint
- Book metadata panel in the editor is now collapsible and supports adding and removing individual fields
- Open a book from the library without re-uploading (`GET /api/books/:bookId`)
- URL sync: opening a book sets `?open=<bookId>` so reloading the page reopens it

### Changed
- Editor and Merge views accessible from a feature launcher home page

## [1.0.0] - Initial release - 2026-03-16

### Added
- Upload CBZ files and view page thumbnails
- Reorder and delete individual pages
- Edit ComicInfo.xml metadata fields
- Download the edited book as a new CBZ
- Docker image and Electron desktop app packaging

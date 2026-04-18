# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflow (`docker-publish.yml`) automatically builds and pushes the Docker image to Docker Hub on `v*.*.*` tags
- Book library displayed on the home page; clicking a book opens it directly in the editor
- Bulk delete pages: "Bulk delete pages" mode in the editor selects multiple pages at once and removes them in a single operation

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

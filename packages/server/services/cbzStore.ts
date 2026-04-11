import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Book, BookMetadata, PageEntry, PageData } from '../types/cbz.js';

let dataDir = '';
const cache = new Map<string, Book>();

export function initStore(dir: string): void {
  dataDir = path.resolve(dir);
  cache.clear();
  fs.mkdirSync(dir, { recursive: true });

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(dir, entry.name, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const book: Book = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        cache.set(book.bookId, book);
      } catch {
        console.warn(`[cbzStore] Failed to load manifest for ${entry.name}, skipping`);
      }
    }
  }
}

function bookDir(bookId: string): string {
  return path.join(dataDir, bookId);
}

function pagesDir(bookId: string): string {
  return path.join(dataDir, bookId, 'pages');
}

function manifestPath(bookId: string): string {
  return path.join(dataDir, bookId, 'manifest.json');
}

export function getPagePath(bookId: string, filename: string): string {
  return path.join(dataDir, bookId, 'pages', filename);
}

async function writeManifest(book: Book): Promise<void> {
  const target = manifestPath(book.bookId);
  const tmp = target + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(book, null, 2));
  await fsp.rename(tmp, target);
}

function reindex(pages: PageEntry[]): void {
  pages.forEach((p, i) => { p.index = i; });
}

function uniqueFilename(existing: Set<string>, filename: string): string {
  if (!existing.has(filename)) return filename;
  const dotIndex = filename.lastIndexOf('.');
  const basename = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex !== -1 ? filename.slice(dotIndex) : '';
  let counter = 1;
  let candidate: string;
  do {
    candidate = `${basename}-${counter}${ext}`;
    counter++;
  } while (existing.has(candidate));
  return candidate;
}

export function listBooks(): Book[] {
  return Array.from(cache.values());
}

export async function saveBook(book: Book, pageFiles: PageData[]): Promise<void> {
  const dir = pagesDir(book.bookId);
  await fsp.mkdir(dir, { recursive: true });

  await Promise.all(
    pageFiles.map((pf) => fsp.writeFile(path.join(dir, pf.filename), pf.data))
  );

  cache.set(book.bookId, book);
  await writeManifest(book);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const cached = cache.get(id);
  if (cached) return cached;

  const mp = manifestPath(id);
  try {
    const book: Book = JSON.parse(await fsp.readFile(mp, 'utf-8'));
    cache.set(id, book);
    return book;
  } catch {
    return undefined;
  }
}

export async function deleteBook(id: string): Promise<void> {
  cache.delete(id);
  const dir = bookDir(id);
  await fsp.rm(dir, { recursive: true, force: true });
}

export async function removePage(bookId: string, index: number): Promise<Book | undefined> {
  const book = cache.get(bookId);
  if (!book) return undefined;

  const [removed] = book.pages.splice(index, 1);
  if (removed) {
    const filePath = getPagePath(bookId, removed.filename);
    await fsp.rm(filePath, { force: true });
  }

  reindex(book.pages);
  await writeManifest(book);
  return book;
}

export async function addPages(
  bookId: string,
  insertAt: number,
  newPages: PageData[],
): Promise<Book | undefined> {
  const book = cache.get(bookId);
  if (!book) return undefined;

  const existing = new Set(book.pages.map((p) => p.filename));
  const resolved: PageEntry[] = [];
  const dir = pagesDir(bookId);

  for (const p of newPages) {
    const filename = uniqueFilename(existing, p.filename);
    existing.add(filename);
    await fsp.writeFile(path.join(dir, filename), p.data);
    resolved.push({ filename, index: 0, mimeType: p.mimeType });
  }

  book.pages.splice(insertAt, 0, ...resolved);
  reindex(book.pages);
  await writeManifest(book);
  return book;
}

export async function mergeBooks(
  bookIds: string[],
  metadata?: BookMetadata | null,
): Promise<Book | undefined> {
  const books: Book[] = [];
  for (const id of bookIds) {
    const book = cache.get(id);
    if (!book) return undefined;
    books.push(book);
  }

  const resolvedMetadata: BookMetadata | null =
    metadata !== undefined ? metadata : (books[0]!.metadata ?? null);

  const newId = randomUUID();
  const existing = new Set<string>();
  const pages: PageEntry[] = [];
  const pageFiles: PageData[] = [];

  for (const book of books) {
    for (const page of book.pages) {
      const data = await fsp.readFile(getPagePath(book.bookId, page.filename));
      const filename = uniqueFilename(existing, page.filename);
      existing.add(filename);
      pages.push({ index: 0, filename, mimeType: page.mimeType });
      pageFiles.push({ filename, data, mimeType: page.mimeType });
    }
  }

  reindex(pages);
  const newBook: Book = { bookId: newId, pages, metadata: resolvedMetadata };
  await saveBook(newBook, pageFiles);
  return newBook;
}

export async function movePage(bookId: string, fromIndex: number, toIndex: number): Promise<Book | undefined> {
  const book = cache.get(bookId);
  if (!book) return undefined;

  const [page] = book.pages.splice(fromIndex, 1);
  book.pages.splice(toIndex, 0, page);
  reindex(book.pages);
  await writeManifest(book);
  return book;
}

export async function updateMetadata(bookId: string, metadata: BookMetadata | null): Promise<Book | undefined> {
  const book = cache.get(bookId);
  if (!book) return undefined;
  book.metadata = metadata;
  await writeManifest(book);
  return book;
}

export async function setMetadataProperty(bookId: string, key: string, value: string): Promise<Book | undefined> {
  const book = cache.get(bookId);
  if (!book) return undefined;
  book.metadata = { ...(book.metadata ?? {}), [key]: value };
  await writeManifest(book);
  return book;
}

export async function removeMetadataProperty(bookId: string, key: string): Promise<Book | undefined> {
  const book = cache.get(bookId);
  if (!book) return undefined;
  if (book.metadata) {
    const { [key]: _, ...rest } = book.metadata;
    book.metadata = Object.keys(rest).length ? rest : null;
  }
  await writeManifest(book);
  return book;
}

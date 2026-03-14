import type { Book, PageEntry } from '../types/cbz.js';

const store = new Map<string, Book>();

export function saveBook(book: Book): void {
  store.set(book.bookId, book);
}

export function getBook(id: string): Book | undefined {
  return store.get(id);
}

export function deleteBook(id: string): void {
  store.delete(id);
}

export function removePage(bookId: string, index: number): Book | undefined {
  const book = store.get(bookId);
  if (!book) return undefined;
  book.pages = book.pages
    .filter((_, i) => i !== index)
    .map((page, i) => ({ ...page, index: i }));
  return book;
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

export function movePage(bookId: string, fromIndex: number, toIndex: number): Book | undefined {
  const book = store.get(bookId);
  if (!book) return undefined;
  const [page] = book.pages.splice(fromIndex, 1);
  book.pages.splice(toIndex, 0, page);
  book.pages.forEach((p, i) => { p.index = i; });
  return book;
}

export function addPages(
  bookId: string,
  insertAt: number,
  newPages: Omit<PageEntry, 'index'>[],
): Book | undefined {
  const book = store.get(bookId);
  if (!book) return undefined;
  const existing = new Set(book.pages.map((p) => p.filename));
  const resolved: PageEntry[] = newPages.map((p) => {
    const filename = uniqueFilename(existing, p.filename);
    existing.add(filename);
    return { ...p, filename, index: 0 };
  });
  book.pages.splice(insertAt, 0, ...resolved);
  book.pages.forEach((page, i) => {
    page.index = i;
  });
  return book;
}

import type { Book } from '../types/cbz.js';

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

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

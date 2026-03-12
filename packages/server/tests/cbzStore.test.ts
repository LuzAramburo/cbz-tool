import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { saveBook, getBook, deleteBook } from '../services/cbzStore.js';
import type { Book } from '../types/cbz.js';

function makeBook(overrides?: Partial<Book>): Book {
  return { bookId: randomUUID(), pages: [], metadata: null, ...overrides };
}

describe('cbzStore', () => {
  it('saveBook + getBook round-trip returns the saved book', () => {
    const book = makeBook();
    saveBook(book);
    expect(getBook(book.bookId)).toEqual(book);
  });

  it('getBook returns undefined for unknown id', () => {
    expect(getBook(randomUUID())).toBeUndefined();
  });

  it('retrieves the correct book when multiple are saved', () => {
    const a = makeBook();
    const b = makeBook();
    saveBook(a);
    saveBook(b);
    expect(getBook(a.bookId)).toEqual(a);
    expect(getBook(b.bookId)).toEqual(b);
  });

  it('deleteBook removes the book', () => {
    const book = makeBook();
    saveBook(book);
    deleteBook(book.bookId);
    expect(getBook(book.bookId)).toBeUndefined();
  });

  it('deleteBook on unknown id does not throw', () => {
    expect(() => deleteBook(randomUUID())).not.toThrow();
  });
});

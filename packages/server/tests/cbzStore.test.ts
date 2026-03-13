import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { saveBook, getBook, deleteBook, removePage } from '../services/cbzStore.js';
import type { Book, PageEntry } from '../types/cbz.js';

function makePage(index: number, filename: string): PageEntry {
  return { index, filename, data: Buffer.from('x'), mimeType: 'image/jpeg' };
}

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

  describe('removePage', () => {
    it('removes the page at the given index', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      saveBook(book);
      removePage(book.bookId, 1);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'c.jpg']);
    });

    it('reindexes remaining pages starting from 0', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      saveBook(book);
      removePage(book.bookId, 0);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.index)).toEqual([0, 1]);
    });

    it('returns the updated book', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      saveBook(book);
      const result = removePage(book.bookId, 0);
      expect(result?.pages).toHaveLength(1);
      expect(result?.pages[0].filename).toBe('b.jpg');
    });

    it('returns undefined for an unknown bookId', () => {
      expect(removePage(randomUUID(), 0)).toBeUndefined();
    });

    it('persists the change so subsequent calls see the updated state', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      saveBook(book);
      removePage(book.bookId, 0); // removes a.jpg, b→0, c→1
      removePage(book.bookId, 0); // removes b.jpg, c→0
      const updated = getBook(book.bookId)!;
      expect(updated.pages).toHaveLength(1);
      expect(updated.pages[0].filename).toBe('c.jpg');
      expect(updated.pages[0].index).toBe(0);
    });
  });
});

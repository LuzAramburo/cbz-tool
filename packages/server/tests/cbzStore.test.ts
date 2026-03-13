import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { saveBook, getBook, deleteBook, removePage, addPages } from '../services/cbzStore.js';
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

  describe('addPages', () => {
    function makeNewPage(filename: string) {
      return { filename, data: Buffer.from('x'), mimeType: 'image/jpeg' as const };
    }

    it('appends when insertAt equals book.pages.length', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      saveBook(book);
      addPages(book.bookId, 2, [makeNewPage('c.jpg')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });

    it('inserts at index 0, existing pages shift right', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      saveBook(book);
      addPages(book.bookId, 0, [makeNewPage('new.jpg')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['new.jpg', 'a.jpg', 'b.jpg']);
    });

    it('inserts in the middle', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'c.jpg')] });
      saveBook(book);
      addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });

    it('reindexes all pages to 0..N-1 after insert', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      saveBook(book);
      addPages(book.bookId, 1, [makeNewPage('x.jpg')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.index)).toEqual([0, 1, 2]);
    });

    it('conflicting filename gets renamed to -1 suffix', () => {
      const book = makeBook({ pages: [makePage(0, 'file001.webp')] });
      saveBook(book);
      addPages(book.bookId, 1, [makeNewPage('file001.webp')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['file001.webp', 'file001-1.webp']);
    });

    it('second conflict gets -2 suffix', () => {
      const book = makeBook({ pages: [makePage(0, 'file001.webp'), makePage(1, 'file001-1.webp')] });
      saveBook(book);
      addPages(book.bookId, 2, [makeNewPage('file001.webp')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages[2].filename).toBe('file001-2.webp');
    });

    it('keeps filename as-is when no conflict', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg')] });
      saveBook(book);
      addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages[1].filename).toBe('b.jpg');
    });

    it('multiple files in one call, some conflicting, each resolved in order', () => {
      const book = makeBook({ pages: [makePage(0, 'img.jpg')] });
      saveBook(book);
      addPages(book.bookId, 1, [makeNewPage('img.jpg'), makeNewPage('img.jpg')]);
      const updated = getBook(book.bookId)!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['img.jpg', 'img-1.jpg', 'img-2.jpg']);
    });

    it('returns undefined for unknown bookId', () => {
      expect(addPages(randomUUID(), 0, [])).toBeUndefined();
    });

    it('returns the updated book matching getBook', () => {
      const book = makeBook({ pages: [makePage(0, 'a.jpg')] });
      saveBook(book);
      const result = addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      expect(result).toBe(getBook(book.bookId));
      expect(result?.pages).toHaveLength(2);
    });
  });
});

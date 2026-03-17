import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  initStore,
  saveBook,
  getBook,
  deleteBook,
  removePage,
  addPages,
  movePage,
  updateMetadata,
  listBooks,
  getPagePath,
} from '../services/cbzStore.js';
import type { Book, PageEntry, PageData } from '../types/cbz.js';

let tmpDir: string;

function makePage(index: number, filename: string): PageEntry {
  return { index, filename, mimeType: 'image/jpeg' };
}

function makePageData(filename: string): PageData {
  return { filename, data: Buffer.from('x'), mimeType: 'image/jpeg' };
}

function makeBook(overrides?: Partial<Book>): { book: Book; pageFiles: PageData[] } {
  const pages = overrides?.pages ?? [];
  const book: Book = { bookId: randomUUID(), pages, metadata: null, ...overrides };
  const pageFiles = pages.map((p) => makePageData(p.filename));
  return { book, pageFiles };
}

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cbzstore-'));
  initStore(tmpDir);
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true, force: true });
});

describe('cbzStore', () => {
  it('saveBook + getBook round-trip returns the saved book', async () => {
    const { book, pageFiles } = makeBook();
    await saveBook(book, pageFiles);
    expect(await getBook(book.bookId)).toEqual(book);
  });

  it('getBook returns undefined for unknown id', async () => {
    expect(await getBook(randomUUID())).toBeUndefined();
  });

  it('retrieves the correct book when multiple are saved', async () => {
    const a = makeBook();
    const b = makeBook();
    await saveBook(a.book, a.pageFiles);
    await saveBook(b.book, b.pageFiles);
    expect(await getBook(a.book.bookId)).toEqual(a.book);
    expect(await getBook(b.book.bookId)).toEqual(b.book);
  });

  it('deleteBook removes the book', async () => {
    const { book, pageFiles } = makeBook();
    await saveBook(book, pageFiles);
    await deleteBook(book.bookId);
    expect(await getBook(book.bookId)).toBeUndefined();
  });

  it('deleteBook on unknown id does not throw', async () => {
    await expect(deleteBook(randomUUID())).resolves.not.toThrow();
  });

  it('persists books across initStore calls', async () => {
    const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg')] });
    await saveBook(book, pageFiles);

    initStore(tmpDir); // re-init, simulating restart
    const loaded = await getBook(book.bookId);
    expect(loaded).toEqual(book);
  });

  it('writes page files to disk', async () => {
    const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg')] });
    await saveBook(book, pageFiles);
    const filePath = getPagePath(book.bookId, 'a.jpg');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  describe('removePage', () => {
    it('removes the page at the given index', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await removePage(book.bookId, 1);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'c.jpg']);
    });

    it('reindexes remaining pages starting from 0', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await removePage(book.bookId, 0);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.index)).toEqual([0, 1]);
    });

    it('returns the updated book', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      await saveBook(book, pageFiles);
      const result = await removePage(book.bookId, 0);
      expect(result?.pages).toHaveLength(1);
      expect(result?.pages[0].filename).toBe('b.jpg');
    });

    it('returns undefined for an unknown bookId', async () => {
      expect(await removePage(randomUUID(), 0)).toBeUndefined();
    });

    it('deletes the page file from disk', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      await saveBook(book, pageFiles);
      await removePage(book.bookId, 0);
      expect(fs.existsSync(getPagePath(book.bookId, 'a.jpg'))).toBe(false);
    });

    it('persists the change so subsequent calls see the updated state', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await removePage(book.bookId, 0);
      await removePage(book.bookId, 0);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages).toHaveLength(1);
      expect(updated.pages[0].filename).toBe('c.jpg');
      expect(updated.pages[0].index).toBe(0);
    });
  });

  describe('addPages', () => {
    function makeNewPage(filename: string): PageData {
      return { filename, data: Buffer.from('x'), mimeType: 'image/jpeg' as const };
    }

    it('appends when insertAt equals book.pages.length', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 2, [makeNewPage('c.jpg')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });

    it('inserts at index 0, existing pages shift right', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 0, [makeNewPage('new.jpg')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['new.jpg', 'a.jpg', 'b.jpg']);
    });

    it('inserts in the middle', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });

    it('reindexes all pages to 0..N-1 after insert', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 1, [makeNewPage('x.jpg')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.index)).toEqual([0, 1, 2]);
    });

    it('conflicting filename gets renamed to -1 suffix', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'file001.webp')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 1, [makeNewPage('file001.webp')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['file001.webp', 'file001-1.webp']);
    });

    it('second conflict gets -2 suffix', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'file001.webp'), makePage(1, 'file001-1.webp')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 2, [makeNewPage('file001.webp')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages[2].filename).toBe('file001-2.webp');
    });

    it('keeps filename as-is when no conflict', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages[1].filename).toBe('b.jpg');
    });

    it('multiple files in one call, some conflicting, each resolved in order', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'img.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 1, [makeNewPage('img.jpg'), makeNewPage('img.jpg')]);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['img.jpg', 'img-1.jpg', 'img-2.jpg']);
    });

    it('returns undefined for unknown bookId', async () => {
      expect(await addPages(randomUUID(), 0, [])).toBeUndefined();
    });

    it('returns the updated book matching getBook', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg')] });
      await saveBook(book, pageFiles);
      const result = await addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      expect(result).toEqual(await getBook(book.bookId));
      expect(result?.pages).toHaveLength(2);
    });

    it('writes new page files to disk', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg')] });
      await saveBook(book, pageFiles);
      await addPages(book.bookId, 1, [makeNewPage('b.jpg')]);
      expect(fs.existsSync(getPagePath(book.bookId, 'b.jpg'))).toBe(true);
    });
  });

  describe('updateMetadata', () => {
    it('sets metadata on a book that had null', async () => {
      const { book, pageFiles } = makeBook({ metadata: null });
      await saveBook(book, pageFiles);
      await updateMetadata(book.bookId, { Title: 'My Comic' });
      expect((await getBook(book.bookId))!.metadata).toEqual({ Title: 'My Comic' });
    });

    it('replaces existing metadata with new values', async () => {
      const { book, pageFiles } = makeBook({ metadata: { Title: 'Old Title' } });
      await saveBook(book, pageFiles);
      await updateMetadata(book.bookId, { Title: 'New Title', Series: 'My Series' });
      expect((await getBook(book.bookId))!.metadata).toEqual({ Title: 'New Title', Series: 'My Series' });
    });

    it('sets metadata to null (clears it)', async () => {
      const { book, pageFiles } = makeBook({ metadata: { Title: 'Something' } });
      await saveBook(book, pageFiles);
      await updateMetadata(book.bookId, null);
      expect((await getBook(book.bookId))!.metadata).toBeNull();
    });

    it('returns the updated book', async () => {
      const { book, pageFiles } = makeBook({ metadata: null });
      await saveBook(book, pageFiles);
      const result = await updateMetadata(book.bookId, { Title: 'Test' });
      expect(result).toBeDefined();
      expect(result!.metadata).toEqual({ Title: 'Test' });
    });

    it('returns undefined for unknown bookId', async () => {
      expect(await updateMetadata(randomUUID(), { Title: 'Test' })).toBeUndefined();
    });

    it('persists the change so getBook sees it', async () => {
      const { book, pageFiles } = makeBook({ metadata: null });
      await saveBook(book, pageFiles);
      await updateMetadata(book.bookId, { Title: 'Persisted' });
      expect((await getBook(book.bookId))!.metadata).toEqual({ Title: 'Persisted' });
    });
  });

  describe('movePage', () => {
    it('moves from first to last position', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await movePage(book.bookId, 0, 2);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['b.jpg', 'c.jpg', 'a.jpg']);
    });

    it('moves from last to first position', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await movePage(book.bookId, 2, 0);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['c.jpg', 'a.jpg', 'b.jpg']);
    });

    it('moves within the middle (adjacent swap)', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await movePage(book.bookId, 1, 2);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.filename)).toEqual(['a.jpg', 'c.jpg', 'b.jpg']);
    });

    it('reindexes all pages to 0..N-1 after move', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      await movePage(book.bookId, 0, 2);
      const updated = (await getBook(book.bookId))!;
      expect(updated.pages.map((p) => p.index)).toEqual([0, 1, 2]);
    });

    it('fromIndex === toIndex is a no-op and still returns the book', async () => {
      const { book, pageFiles } = makeBook({ pages: [makePage(0, 'a.jpg'), makePage(1, 'b.jpg'), makePage(2, 'c.jpg')] });
      await saveBook(book, pageFiles);
      const result = await movePage(book.bookId, 1, 1);
      expect(result?.pages.map((p) => p.filename)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });

    it('returns undefined for unknown bookId', async () => {
      expect(await movePage(randomUUID(), 0, 1)).toBeUndefined();
    });
  });

  describe('listBooks', () => {
    it('returns empty array when no books saved', () => {
      expect(listBooks()).toEqual([]);
    });

    it('returns all saved books', async () => {
      const a = makeBook({ pages: [makePage(0, 'a.jpg')] });
      const b = makeBook({ pages: [makePage(0, 'b.jpg')] });
      await saveBook(a.book, a.pageFiles);
      await saveBook(b.book, b.pageFiles);
      const result = listBooks();
      expect(result).toHaveLength(2);
      const ids = result.map((b) => b.bookId).sort();
      expect(ids).toEqual([a.book.bookId, b.book.bookId].sort());
    });

    it('excludes deleted books', async () => {
      const a = makeBook({ pages: [makePage(0, 'a.jpg')] });
      const b = makeBook({ pages: [makePage(0, 'b.jpg')] });
      await saveBook(a.book, a.pageFiles);
      await saveBook(b.book, b.pageFiles);
      await deleteBook(a.book.bookId);
      const result = listBooks();
      expect(result).toHaveLength(1);
      expect(result[0].bookId).toBe(b.book.bookId);
    });

    it('reflects metadata updates', async () => {
      const { book, pageFiles } = makeBook({ metadata: { title: 'Original' } });
      await saveBook(book, pageFiles);
      await updateMetadata(book.bookId, { title: 'Updated' });
      const result = listBooks();
      expect(result[0].metadata).toEqual({ title: 'Updated' });
    });
  });
});

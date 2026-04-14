import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { initStore, getBook, saveBook, deleteBook } from '../services/cbzStore.js';
import type { Book, BulkDeleteResponse } from '../types/cbz.js';
import { makeZip, FAKE_JPEG } from './helpers/makeZip.js';
import { parseCbz } from '../services/cbzParser.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'bulk-delete-'));
  initStore(tmpDir);
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true, force: true });
});

async function createBook(): Promise<string> {
  const zip = await makeZip([{ name: 'page1.jpg', content: FAKE_JPEG }]);
  const parsed = await parseCbz(zip);
  const book: Book = {
    bookId: parsed.bookId,
    pages: parsed.pages.map((p, index) => ({ index, filename: p.filename, mimeType: p.mimeType })),
    metadata: parsed.metadata,
  };
  await saveBook(book, parsed.pages);
  return book.bookId;
}

// Mirrors the logic in DELETE /bulk
async function runBulkDelete(bookIds: string[]): Promise<BulkDeleteResponse> {
  const results = await Promise.allSettled(
    bookIds.map(async (id) => {
      const book = await getBook(id);
      if (!book) throw new Error('not found');
      await deleteBook(id);
      return id;
    }),
  );

  const response: BulkDeleteResponse = { deleted: [], notFound: [] };
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      response.deleted.push(result.value);
    } else {
      response.notFound.push(bookIds[i]!);
    }
  });
  return response;
}

describe('POST /delete', () => {
  it('deletes all books when all IDs exist', async () => {
    const id1 = await createBook();
    const id2 = await createBook();

    const { deleted, notFound } = await runBulkDelete([id1, id2]);

    expect(notFound).toHaveLength(0);
    expect(deleted).toHaveLength(2);
    expect(deleted).toContain(id1);
    expect(deleted).toContain(id2);
    expect(await getBook(id1)).toBeUndefined();
    expect(await getBook(id2)).toBeUndefined();
  });

  it('deletes the valid book and reports the missing one in notFound', async () => {
    const id1 = await createBook();
    const missingId = 'does-not-exist';

    const { deleted, notFound } = await runBulkDelete([id1, missingId]);

    expect(deleted).toEqual([id1]);
    expect(notFound).toEqual([missingId]);
    expect(await getBook(id1)).toBeUndefined();
  });

  it('returns all IDs in notFound when none exist', async () => {
    const { deleted, notFound } = await runBulkDelete(['ghost-1', 'ghost-2']);

    expect(deleted).toHaveLength(0);
    expect(notFound).toEqual(['ghost-1', 'ghost-2']);
  });
});

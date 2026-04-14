import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { initStore, getBook } from '../services/cbzStore.js';
import { parseCbz } from '../services/cbzParser.js';
import { saveBook } from '../services/cbzStore.js';
import type { Book, UploadResponse, BulkUploadResponse } from '../types/cbz.js';
import { makeZip, FAKE_JPEG } from './helpers/makeZip.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'bulk-upload-'));
  initStore(tmpDir);
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true, force: true });
});

// Mirrors the logic in POST /upload
async function runUpload(
  files: Array<{ originalname: string; buffer: Buffer }>,
): Promise<BulkUploadResponse> {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const parsed = await parseCbz(file.buffer);
      const book: Book = {
        bookId: parsed.bookId,
        pages: parsed.pages.map((p, index) => ({
          index,
          filename: p.filename,
          mimeType: p.mimeType,
        })),
        metadata: parsed.metadata,
      };
      await saveBook(book, parsed.pages);
      return {
        bookId: book.bookId,
        pageCount: book.pages.length,
        pages: book.pages.map(({ index, filename }) => ({ index, filename })),
        metadata: book.metadata,
      } satisfies UploadResponse;
    }),
  );

  const response: BulkUploadResponse = { succeeded: [], failed: [] };
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      response.succeeded.push(result.value);
    } else {
      response.failed.push({
        filename: files[i]!.originalname,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });
  return response;
}

describe('POST /upload', () => {
  it('processes a single file and returns it in succeeded', async () => {
    const zip = await makeZip([{ name: 'page1.jpg', content: FAKE_JPEG }]);

    const { succeeded, failed } = await runUpload([{ originalname: 'book.cbz', buffer: zip }]);

    expect(failed).toHaveLength(0);
    expect(succeeded).toHaveLength(1);
    expect(succeeded[0]!.pageCount).toBe(1);
    expect(await getBook(succeeded[0]!.bookId)).toBeDefined();
  });

  it('processes multiple files and returns all as succeeded', async () => {
    const zip1 = await makeZip([{ name: 'page1.jpg', content: FAKE_JPEG }]);
    const zip2 = await makeZip([
      { name: 'page1.jpg', content: FAKE_JPEG },
      { name: 'page2.jpg', content: FAKE_JPEG },
    ]);

    const { succeeded, failed } = await runUpload([
      { originalname: 'book1.cbz', buffer: zip1 },
      { originalname: 'book2.cbz', buffer: zip2 },
    ]);

    expect(failed).toHaveLength(0);
    expect(succeeded).toHaveLength(2);
    expect(succeeded[0]!.pageCount).toBe(1);
    expect(succeeded[1]!.pageCount).toBe(2);
    expect(await getBook(succeeded[0]!.bookId)).toBeDefined();
    expect(await getBook(succeeded[1]!.bookId)).toBeDefined();
  });

  it('records failed entry for a corrupt file while succeeding for the valid one', async () => {
    const validZip = await makeZip([{ name: 'page1.jpg', content: FAKE_JPEG }]);

    const { succeeded, failed } = await runUpload([
      { originalname: 'good.cbz', buffer: validZip },
      { originalname: 'bad.cbz', buffer: Buffer.from('not a zip') },
    ]);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0]!.filename).toBe('bad.cbz');
    expect(failed[0]!.error).toBeTruthy();
  });

  it('returns all failed when every file is corrupt', async () => {
    const { succeeded, failed } = await runUpload([
      { originalname: 'a.cbz', buffer: Buffer.from('nope') },
      { originalname: 'b.cbz', buffer: Buffer.from('also nope') },
    ]);

    expect(succeeded).toHaveLength(0);
    expect(failed).toHaveLength(2);
    expect(failed[0]!.filename).toBe('a.cbz');
    expect(failed[1]!.filename).toBe('b.cbz');
  });
});

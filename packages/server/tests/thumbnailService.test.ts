import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import {
  initStore,
  saveBook,
  removePage,
  getPagePath,
  getThumbnailPath,
} from '../services/cbzStore.js';
import { getOrCreateThumbnail, deleteThumbnail } from '../services/thumbnailService.js';
import type { Book, PageEntry, PageData } from '../types/cbz.js';

let tmpDir: string;
let REAL_JPEG: Buffer;

function makePage(index: number, filename: string): PageEntry {
  return { index, filename, mimeType: 'image/jpeg' };
}

function makePageData(filename: string, data: Buffer): PageData {
  return { filename, data, mimeType: 'image/jpeg' };
}

async function makeTestBook(filename = 'page.jpg'): Promise<Book> {
  const book: Book = { bookId: randomUUID(), pages: [makePage(0, filename)], metadata: null };
  await saveBook(book, [makePageData(filename, REAL_JPEG)]);
  return book;
}

beforeAll(async () => {
  REAL_JPEG = await sharp({
    create: { width: 20, height: 30, channels: 3, background: { r: 128, g: 64, b: 32 } },
  })
    .jpeg()
    .toBuffer();
});

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'thumbnail-'));
  initStore(tmpDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fsp.rm(tmpDir, { recursive: true, force: true });
});

describe('getOrCreateThumbnail', () => {
  it('creates a thumbnail file on first call', async () => {
    const book = await makeTestBook();
    const thumbPath = await getOrCreateThumbnail(book.bookId, 'page.jpg');
    const stat = await fsp.stat(thumbPath);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('returns the path from getThumbnailPath', async () => {
    const book = await makeTestBook();
    const thumbPath = await getOrCreateThumbnail(book.bookId, 'page.jpg');
    expect(thumbPath).toBe(getThumbnailPath(book.bookId, 'page.jpg'));
  });

  it('output is a valid JPEG (correct magic bytes)', async () => {
    const book = await makeTestBook();
    const thumbPath = await getOrCreateThumbnail(book.bookId, 'page.jpg');
    const buf = await fsp.readFile(thumbPath);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(buf[2]).toBe(0xff);
  });

  it('does not regenerate when called a second time (file mtime unchanged)', async () => {
    const book = await makeTestBook();
    const thumbPath = await getOrCreateThumbnail(book.bookId, 'page.jpg');
    const { mtimeMs } = await fsp.stat(thumbPath);
    await new Promise((r) => setTimeout(r, 20));
    await getOrCreateThumbnail(book.bookId, 'page.jpg');
    const { mtimeMs: mtimeMs2 } = await fsp.stat(thumbPath);
    expect(mtimeMs2).toBe(mtimeMs);
  });

  it('does not upscale images narrower than THUMBNAIL_WIDTH', async () => {
    // source is 20 px wide — should stay at 20 px, not be enlarged to 300
    const book = await makeTestBook();
    const thumbPath = await getOrCreateThumbnail(book.bookId, 'page.jpg');
    const meta = await sharp(thumbPath).metadata();
    expect(meta.width).toBe(20);
  });
});

describe('deleteThumbnail', () => {
  it('removes an existing thumbnail file', async () => {
    const book = await makeTestBook();
    const thumbPath = await getOrCreateThumbnail(book.bookId, 'page.jpg');
    await deleteThumbnail(book.bookId, 'page.jpg');
    await expect(fsp.access(thumbPath)).rejects.toThrow();
  });

  it('does not throw when the thumbnail does not exist', async () => {
    await expect(deleteThumbnail(randomUUID(), 'ghost.jpg')).resolves.not.toThrow();
  });
});

describe('removePage EBUSY retry', () => {
  it('retries on EBUSY and still removes the page', async () => {
    const book = await makeTestBook('busy.jpg');
    const pagePath = getPagePath(book.bookId, 'busy.jpg');

    const original = fsp.rm.bind(fsp);
    let calls = 0;
    vi.spyOn(fsp, 'rm').mockImplementation(async (p, opts) => {
      if (++calls === 1) {
        const err = Object.assign(new Error('resource busy or locked'), { code: 'EBUSY' });
        throw err;
      }
      return original(p as string, opts as Parameters<typeof fsp.rm>[1]);
    });

    const updated = await removePage(book.bookId, 0);

    expect(updated?.pages).toHaveLength(0);
    await vi.waitFor(async () => {
      await expect(fsp.access(pagePath)).rejects.toThrow();
    });
    expect(calls).toBeGreaterThan(1);
  });
});

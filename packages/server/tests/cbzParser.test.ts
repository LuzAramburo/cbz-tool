import { describe, it, expect } from 'vitest';
import { getMime, isImageEntry, parseMetadata, parseCbz } from '../services/cbzParser.js';
import { makeZip, FAKE_JPEG, FAKE_PNG, FAKE_WEBP } from './helpers/makeZip.js';

// ─── getMime ────────────────────────────────────────────────────────────────

describe('getMime', () => {
  it('maps .jpg to image/jpeg', () => expect(getMime('page.jpg')).toBe('image/jpeg'));
  it('maps .jpeg to image/jpeg', () => expect(getMime('cover.jpeg')).toBe('image/jpeg'));
  it('maps .png to image/png', () => expect(getMime('page.png')).toBe('image/png'));
  it('maps .webp to image/webp', () => expect(getMime('page.webp')).toBe('image/webp'));
  it('is case-insensitive for .JPG', () => expect(getMime('PAGE.JPG')).toBe('image/jpeg'));
  it('is case-insensitive for .PNG', () => expect(getMime('PAGE.PNG')).toBe('image/png'));
  it('falls back to image/jpeg for unknown extension', () => expect(getMime('file.xyz')).toBe('image/jpeg'));
  it('falls back to image/jpeg for no extension', () => expect(getMime('nodot')).toBe('image/jpeg'));
});

// ─── isImageEntry ───────────────────────────────────────────────────────────

describe('isImageEntry', () => {
  it('accepts .jpg', () => expect(isImageEntry('page01.jpg')).toBe(true));
  it('accepts .jpeg', () => expect(isImageEntry('cover.jpeg')).toBe(true));
  it('accepts .png', () => expect(isImageEntry('art.png')).toBe(true));
  it('accepts .webp', () => expect(isImageEntry('art.webp')).toBe(true));
  it('accepts case-insensitive .JPG', () => expect(isImageEntry('PAGE.JPG')).toBe(true));
  it('accepts nested path without macOS prefix', () => expect(isImageEntry('chapter1/page01.jpg')).toBe(true));

  it('rejects .gif', () => expect(isImageEntry('anim.gif')).toBe(false));
  it('rejects .bmp', () => expect(isImageEntry('scan.bmp')).toBe(false));
  it('rejects .tiff', () => expect(isImageEntry('scan.tiff')).toBe(false));
  it('rejects .avif', () => expect(isImageEntry('photo.avif')).toBe(false));
  it('rejects .svg', () => expect(isImageEntry('icon.svg')).toBe(false));
  it('rejects .txt', () => expect(isImageEntry('readme.txt')).toBe(false));
  it('rejects ComicInfo.xml', () => expect(isImageEntry('ComicInfo.xml')).toBe(false));
  it('rejects __MACOSX prefix', () => expect(isImageEntry('__MACOSX/._page01.jpg')).toBe(false));
  it('rejects nested __MACOSX path', () => expect(isImageEntry('__MACOSX/subfolder/page.jpg')).toBe(false));
  it('rejects dot-prefixed file', () => expect(isImageEntry('._page01.jpg')).toBe(false));
  it('rejects .DS_Store', () => expect(isImageEntry('.DS_Store')).toBe(false));
});

// ─── parseMetadata ──────────────────────────────────────────────────────────

describe('parseMetadata', () => {
  it('parses title', () => {
    expect(parseMetadata('<ComicInfo><Title>My Comic</Title></ComicInfo>')).toMatchObject({ title: 'My Comic' });
  });

  it('lowercases keys', () => {
    expect(parseMetadata('<ComicInfo><Series>X</Series></ComicInfo>')).toMatchObject({ series: 'X' });
  });

  it('coerces numeric values to string', () => {
    expect(parseMetadata('<ComicInfo><Year>2023</Year></ComicInfo>')).toMatchObject({ year: '2023' });
  });

  it('parses multiple fields', () => {
    const xml = '<ComicInfo><Title>T</Title><Series>S</Series><Publisher>P</Publisher></ComicInfo>';
    const result = parseMetadata(xml);
    expect(result).toMatchObject({ title: 'T', series: 'S', publisher: 'P' });
  });

  it('skips @_ attribute keys from xmlns', () => {
    const xml = '<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema"><Title>T</Title></ComicInfo>';
    const result = parseMetadata(xml);
    expect(result).not.toHaveProperty('@_xmlns:xsd');
    expect(result).toMatchObject({ title: 'T' });
  });

  it('returns null for empty ComicInfo', () => {
    expect(parseMetadata('<ComicInfo></ComicInfo>')).toBeNull();
  });

  it('returns null when root is not ComicInfo', () => {
    expect(parseMetadata('<Root><Title>X</Title></Root>')).toBeNull();
  });

  it('returns null for malformed XML', () => {
    expect(parseMetadata('not xml <<>>')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseMetadata('')).toBeNull();
  });
});

// ─── parseCbz ───────────────────────────────────────────────────────────────

describe('parseCbz', () => {
  describe('happy path', () => {
    it('parses a single JPEG page', async () => {
      const buf = await makeZip([{ name: 'page01.jpg', content: FAKE_JPEG }]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(1);
      expect(book.pages[0].mimeType).toBe('image/jpeg');
      expect(book.pages[0].index).toBe(0);
      expect(book.pages[0].filename).toBe('page01.jpg');
    });

    it('parses a single PNG page', async () => {
      const buf = await makeZip([{ name: 'cover.png', content: FAKE_PNG }]);
      const book = await parseCbz(buf);
      expect(book.pages[0].mimeType).toBe('image/png');
    });

    it('parses a single WebP page', async () => {
      const buf = await makeZip([{ name: 'art.webp', content: FAKE_WEBP }]);
      const book = await parseCbz(buf);
      expect(book.pages[0].mimeType).toBe('image/webp');
    });

    it('preserves page data buffer', async () => {
      const buf = await makeZip([{ name: 'page01.png', content: FAKE_PNG }]);
      const book = await parseCbz(buf);
      expect(book.pages[0].data).toEqual(FAKE_PNG);
    });

    it('returns a UUID bookId', async () => {
      const buf = await makeZip([{ name: 'page01.jpg', content: FAKE_JPEG }]);
      const book = await parseCbz(buf);
      expect(book.bookId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('natural-sorts pages numerically', async () => {
      const buf = await makeZip([
        { name: 'page10.jpg', content: FAKE_JPEG },
        { name: 'page2.jpg', content: FAKE_JPEG },
        { name: 'page1.jpg', content: FAKE_JPEG },
      ]);
      const book = await parseCbz(buf);
      expect(book.pages.map((p) => p.filename)).toEqual(['page1.jpg', 'page2.jpg', 'page10.jpg']);
    });

    it('assigns sequential indexes after sorting', async () => {
      const buf = await makeZip([
        { name: 'page2.jpg', content: FAKE_JPEG },
        { name: 'page1.jpg', content: FAKE_JPEG },
      ]);
      const book = await parseCbz(buf);
      expect(book.pages[0].index).toBe(0);
      expect(book.pages[1].index).toBe(1);
    });
  });

  describe('metadata', () => {
    it('parses ComicInfo.xml when present', async () => {
      const buf = await makeZip([
        { name: 'page01.jpg', content: FAKE_JPEG },
        { name: 'ComicInfo.xml', content: '<ComicInfo><Title>Test Comic</Title></ComicInfo>' },
      ]);
      const book = await parseCbz(buf);
      expect(book.metadata).toMatchObject({ title: 'Test Comic' });
    });

    it('matches ComicInfo.xml case-insensitively', async () => {
      const buf = await makeZip([
        { name: 'page01.jpg', content: FAKE_JPEG },
        { name: 'comicinfo.xml', content: '<ComicInfo><Title>Lower</Title></ComicInfo>' },
      ]);
      const book = await parseCbz(buf);
      expect(book.metadata).toMatchObject({ title: 'Lower' });
    });

    it('returns null metadata when no ComicInfo.xml', async () => {
      const buf = await makeZip([{ name: 'page01.jpg', content: FAKE_JPEG }]);
      const book = await parseCbz(buf);
      expect(book.metadata).toBeNull();
    });

    it('returns null metadata for malformed ComicInfo.xml', async () => {
      const buf = await makeZip([
        { name: 'page01.jpg', content: FAKE_JPEG },
        { name: 'ComicInfo.xml', content: 'not valid xml <<>>' },
      ]);
      const book = await parseCbz(buf);
      expect(book.metadata).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles empty ZIP', async () => {
      const buf = await makeZip([]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(0);
      expect(book.metadata).toBeNull();
    });

    it('handles ZIP with only ComicInfo.xml', async () => {
      const buf = await makeZip([
        { name: 'ComicInfo.xml', content: '<ComicInfo><Title>Only Meta</Title></ComicInfo>' },
      ]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(0);
      expect(book.metadata).toMatchObject({ title: 'Only Meta' });
    });

    it('skips unsupported .gif files', async () => {
      const buf = await makeZip([{ name: 'anim.gif', content: Buffer.from('GIF89a') }]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(0);
    });

    it('skips unsupported .bmp files', async () => {
      const buf = await makeZip([{ name: 'scan.bmp', content: Buffer.from('BM') }]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(0);
    });

    it('skips __MACOSX artifacts but keeps real images', async () => {
      const buf = await makeZip([
        { name: '__MACOSX/._page01.jpg', content: FAKE_JPEG },
        { name: 'page01.jpg', content: FAKE_JPEG },
      ]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(1);
      expect(book.pages[0].filename).toBe('page01.jpg');
    });

    it('skips dot-prefixed files but keeps real images', async () => {
      const buf = await makeZip([
        { name: '._page01.jpg', content: FAKE_JPEG },
        { name: 'page01.jpg', content: FAKE_JPEG },
      ]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(1);
    });

    it('skips non-image entries', async () => {
      const buf = await makeZip([
        { name: 'page01.jpg', content: FAKE_JPEG },
        { name: 'readme.txt', content: 'hello' },
        { name: 'thumb.gif', content: Buffer.from('GIF89a') },
      ]);
      const book = await parseCbz(buf);
      expect(book.pages).toHaveLength(1);
    });
  });

  describe('error paths', () => {
    it('rejects on corrupt buffer', async () => {
      await expect(parseCbz(Buffer.from('not a zip'))).rejects.toThrow();
    });

    it('rejects on empty buffer', async () => {
      await expect(parseCbz(Buffer.alloc(0))).rejects.toThrow();
    });
  });
});

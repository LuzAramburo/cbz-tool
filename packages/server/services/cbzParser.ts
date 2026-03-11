import yauzl from 'yauzl';
import { XMLParser } from 'fast-xml-parser';
import { randomUUID } from 'crypto';
import type { Book, PageEntry, ComicMetadata } from '../types/cbz.js';

const IMAGE_PATTERN = /\.(jpe?g|png|webp)$/i;
const UNSUPPORTED_IMAGE_PATTERN = /\.(gif|bmp|tiff?|avif|svg|ico)$/i;
const MIME: Record<string, 'image/jpeg' | 'image/png' | 'image/webp'> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getMime(filename: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME[ext] ?? 'image/jpeg';
}

function isImageEntry(filename: string): boolean {
  return (
    IMAGE_PATTERN.test(filename) && !filename.startsWith('__MACOSX') && !filename.startsWith('.')
  );
}

function readEntry(zipFile: yauzl.ZipFile, entry: yauzl.Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (err, stream) => {
      if (err || !stream) return reject(err ?? new Error('No stream'));
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });
}

function parseMetadata(xml: string): ComicMetadata | null {
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const info = parsed?.ComicInfo;
    if (!info) return null;
    return {
      title: info.Title ?? undefined,
      series: info.Series ?? undefined,
      issue: info.Number != null ? String(info.Number) : undefined,
      publisher: info.Publisher ?? undefined,
      year: info.Year != null ? String(info.Year) : undefined,
      summary: info.Summary ?? undefined,
    };
  } catch {
    return null;
  }
}

export function parseCbz(fileBuffer: Buffer): Promise<Book> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(fileBuffer, { lazyEntries: true }, (err, zipFile) => {
      if (err || !zipFile) return reject(err ?? new Error('Failed to open ZIP'));

      const imageEntries: { filename: string; data: Buffer }[] = [];
      let xmlBuffer: Buffer | null = null;

      zipFile.readEntry();

      zipFile.on('entry', (entry: yauzl.Entry) => {
        const filename = entry.fileName;
        if (isImageEntry(filename)) {
          readEntry(zipFile, entry)
            .then((data) => {
              imageEntries.push({ filename, data });
              zipFile.readEntry();
            })
            .catch(reject);
        } else if (filename.toLowerCase() === 'comicinfo.xml') {
          readEntry(zipFile, entry)
            .then((data) => {
              xmlBuffer = data;
              zipFile.readEntry();
            })
            .catch(reject);
        } else {
          if (UNSUPPORTED_IMAGE_PATTERN.test(filename)) {
            console.warn(`[cbzParser] Unsupported image type skipped: ${filename}`);
          }
          zipFile.readEntry();
        }
      });

      zipFile.on('end', () => {
        imageEntries.sort((a, b) =>
          a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
        );

        const pages: PageEntry[] = imageEntries.map(({ filename, data }, index) => ({
          index,
          filename,
          data,
          mimeType: getMime(filename),
        }));

        const metadata = xmlBuffer ? parseMetadata(xmlBuffer.toString('utf-8')) : null;

        resolve({ bookId: randomUUID(), pages, metadata });
      });

      zipFile.on('error', reject);
    });
  });
}

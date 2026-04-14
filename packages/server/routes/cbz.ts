import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import JSZip from 'jszip';
import { parseCbz, isImageEntry, getMime } from '../services/cbzParser.js';
import {
  saveBook,
  getBook,
  deleteBook,
  removePage,
  addPages,
  movePage,
  updateMetadata,
  setMetadataProperty,
  removeMetadataProperty,
  getPagePath,
  listBooks,
  mergeBooks,
} from '../services/cbzStore.js';
import type { Book, BookSummary, BookMetadata, PageData, UploadResponse, BulkUploadResponse } from '../types/cbz.js';

const router = Router();
const MAX_FILE_SIZE_BYTES = parseInt(process.env['MAX_FILE_SIZE_MB'] ?? '50', 10) * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

router.get('/', (_req: Request, res: Response) => {
  const books = listBooks();
  const summaries: BookSummary[] = books.map((book) => ({
    bookId: book.bookId,
    title: book.metadata?.['title'] ?? null,
    series: book.metadata?.['series'] ?? null,
    number: book.metadata?.['number'] ?? null,
    pageCount: book.pages.length,
    coverPageIndex: 0,
  }));
  res.json(summaries);
});

router.post('/upload', upload.array('files'), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files provided' });
    return;
  }

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

  res.json(response);
});

router.post('/merge', async (req: Request, res: Response) => {
  const { bookIds, metadata } = req.body as { bookIds: unknown; metadata: unknown };

  if (!Array.isArray(bookIds) || bookIds.length === 0) {
    res.status(400).json({ error: 'bookIds must be a non-empty array' });
    return;
  }
  if (bookIds.length < 2) {
    res.status(400).json({ error: 'bookIds must contain at least 2 book IDs' });
    return;
  }
  for (let i = 0; i < bookIds.length; i++) {
    if (typeof bookIds[i] !== 'string' || !bookIds[i]) {
      res.status(400).json({ error: `bookIds contains an invalid entry at index ${i}` });
      return;
    }
  }
  if (new Set(bookIds).size !== bookIds.length) {
    res.status(400).json({ error: 'bookIds contains duplicate IDs' });
    return;
  }
  if (metadata !== undefined && metadata !== null && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    res.status(400).json({ error: 'metadata must be an object or null' });
    return;
  }

  for (const id of bookIds as string[]) {
    const book = await getBook(id);
    if (!book) {
      res.status(404).json({ error: `Book not found: ${id}` });
      return;
    }
  }

  const newBook = await mergeBooks(
    bookIds as string[],
    metadata !== undefined ? (metadata as BookMetadata | null) : undefined,
  );
  if (!newBook) {
    res.status(404).json({ error: 'One or more books could not be found during merge' });
    return;
  }

  const response: UploadResponse = {
    bookId: newBook.bookId,
    pageCount: newBook.pages.length,
    pages: newBook.pages.map(({ index, filename }) => ({ index, filename })),
    metadata: newBook.metadata,
  };
  res.json(response);
});

router.get('/:bookId', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const response: UploadResponse = {
    bookId: book.bookId,
    pageCount: book.pages.length,
    pages: book.pages.map(({ index, filename }) => ({ index, filename })),
    metadata: book.metadata,
  };

  res.json(response);
});

router.get('/:bookId/page/:index', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const indexParam = req.params['index'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const index = parseInt(indexParam, 10);
  const page = book.pages[index];
  if (!page) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  res.setHeader('Content-Type', page.mimeType);
  res.sendFile(getPagePath(bookId, page.filename));
});

router.post('/:bookId/pages', upload.array('files'), async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files provided' });
    return;
  }

  for (const file of files) {
    if (!isImageEntry(file.originalname)) {
      res.status(400).json({ error: `Unsupported file type: ${file.originalname}` });
      return;
    }
  }

  let insertAt = book.pages.length;
  if (req.body['insertAt'] !== undefined) {
    insertAt = parseInt(req.body['insertAt'], 10);
    if (isNaN(insertAt) || insertAt < 0 || insertAt > book.pages.length) {
      res.status(400).json({ error: 'insertAt out of range' });
      return;
    }
  }

  const newPages: PageData[] = files.map((file) => ({
    filename: file.originalname,
    data: file.buffer,
    mimeType: getMime(file.originalname),
  }));

  const updated = (await addPages(bookId, insertAt, newPages))!;
  res.json({
    pageCount: updated.pages.length,
    pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
  });
});

router.patch('/:bookId/page/:index', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const fromIndex = parseInt(req.params['index'] as string, 10);
  const toIndex = parseInt(req.body['toIndex'], 10);

  if (
    isNaN(fromIndex) ||
    fromIndex < 0 ||
    fromIndex >= book.pages.length ||
    isNaN(toIndex) ||
    toIndex < 0 ||
    toIndex >= book.pages.length
  ) {
    res.status(400).json({ error: 'Index out of range' });
    return;
  }

  const updated = (await movePage(bookId, fromIndex, toIndex))!;
  res.json({
    pageCount: updated.pages.length,
    pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
  });
});

router.delete('/:bookId/page/:index', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const indexParam = req.params['index'] as string;

  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const index = parseInt(indexParam, 10);
  if (isNaN(index) || index < 0 || index >= book.pages.length) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const updated = (await removePage(bookId, index))!;
  res.json({
    pageCount: updated.pages.length,
    pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
  });
});

function buildComicInfoXml(metadata: Record<string, string>): string {
  const fields = Object.entries(metadata)
    .map(([k, v]) => `  <${k}>${v}</${k}>`)
    .join('\n');
  return `<?xml version="1.0"?>\n<ComicInfo>\n${fields}\n</ComicInfo>`;
}

function buildDownloadFilename(metadata: Record<string, string> | null): string {
  if (!metadata) return 'book.cbz';
  const title = metadata['title'] ?? metadata['Title'] ?? '';
  const series = metadata['series'] ?? metadata['Series'] ?? '';
  const number = metadata['number'] ?? metadata['Number'] ?? '';
  const seriesParts = [series, number && `#${number}`].filter(Boolean);
  if (seriesParts.length > 0) {
    const name = title ? `${seriesParts.join(' ')} - ${title}` : seriesParts.join(' ');
    return `${name}.cbz`;
  }
  return title ? `${title}.cbz` : 'book.cbz';
}

router.get('/:bookId/download', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const zip = new JSZip();

  for (const page of book.pages) {
    const ext = page.filename.includes('.')
      ? page.filename.slice(page.filename.lastIndexOf('.'))
      : '';
    const newFilename = String(page.index + 1).padStart(3, '0') + ext;
    const data = await fs.readFile(getPagePath(bookId, page.filename));
    zip.file(newFilename, data);
  }

  if (book.metadata) {
    zip.file('ComicInfo.xml', buildComicInfoXml(book.metadata));
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${buildDownloadFilename(book.metadata)}"`
  );
  res.send(buffer);
});

router.put('/:bookId/metadata/:key', async (req: Request, res: Response) => {
  const { bookId, key } = req.params as { bookId: string; key: string };
  if (!(await getBook(bookId))) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  const { value } = req.body as { value: unknown };
  if (typeof value !== 'string') {
    res.status(400).json({ error: 'value must be a string' });
    return;
  }
  const updated = (await setMetadataProperty(bookId, key, value))!;
  res.json({ metadata: updated.metadata });
});

router.delete('/:bookId/metadata/:key', async (req: Request, res: Response) => {
  const { bookId, key } = req.params as { bookId: string; key: string };
  if (!(await getBook(bookId))) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  const updated = (await removeMetadataProperty(bookId, key))!;
  res.json({ metadata: updated.metadata });
});

router.patch('/:bookId/metadata', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  if (!(await getBook(bookId))) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { metadata } = req.body as { metadata: unknown };
  if (metadata !== null && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    res.status(400).json({ error: 'metadata must be an object or null' });
    return;
  }

  const updated = (await updateMetadata(bookId, metadata as BookMetadata | null))!;
  res.json({ metadata: updated.metadata });
});

router.delete('/:bookId', async (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  await deleteBook(bookId);
  res.status(204).send();
});

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res
        .status(413)
        .json({
          error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
        });
    } else {
      res.status(400).json({ error: err.message });
    }
    return;
  }
  console.error('Unexpected error in CBZ router:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default router;

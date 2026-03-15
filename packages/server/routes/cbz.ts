import { Router, Request, Response } from 'express';
import multer from 'multer';
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
} from '../services/cbzStore.js';
import type { ComicMetadata, UploadResponse } from '../types/cbz.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  try {
    const book = await parseCbz(req.file.buffer);
    saveBook(book);

    const response: UploadResponse = {
      bookId: book.bookId,
      pageCount: book.pages.length,
      pages: book.pages.map(({ index, filename }) => ({ index, filename })),
      metadata: book.metadata,
    };

    res.json(response);
  } catch (err) {
    console.error('Failed to parse CBZ:', err);
    res.status(400).json({ error: 'Failed to parse CBZ file' });
  }
});

router.get('/:bookId/page/:index', (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const indexParam = req.params['index'] as string;
  const book = getBook(bookId);
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
  res.send(page.data);
});

router.post('/:bookId/pages', upload.array('files'), (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = getBook(bookId);
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

  const newPages = files.map((file) => ({
    filename: file.originalname,
    data: file.buffer,
    mimeType: getMime(file.originalname),
  }));

  const updated = addPages(bookId, insertAt, newPages)!;
  res.json({
    pageCount: updated.pages.length,
    pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
  });
});

router.patch('/:bookId/page/:index', (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = getBook(bookId);
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

  const updated = movePage(bookId, fromIndex, toIndex)!;
  res.json({
    pageCount: updated.pages.length,
    pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
  });
});

router.delete('/:bookId/page/:index', (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const indexParam = req.params['index'] as string;

  if (!getBook(bookId)) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const index = parseInt(indexParam, 10);
  const book = getBook(bookId);
  if (isNaN(index) || !book || index < 0 || index >= book.pages.length) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const updated = removePage(bookId, index)!;
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
  const book = getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const zip = new JSZip();

  for (const page of book.pages) {
    const ext = page.filename.includes('.') ? page.filename.slice(page.filename.lastIndexOf('.')) : '';
    const newFilename = String(page.index + 1).padStart(3, '0') + ext;
    zip.file(newFilename, page.data);
  }

  if (book.metadata) {
    zip.file('ComicInfo.xml', buildComicInfoXml(book.metadata));
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${buildDownloadFilename(book.metadata)}"`);
  res.send(buffer);
});

router.patch('/:bookId/metadata', (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  if (!getBook(bookId)) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { metadata } = req.body as { metadata: unknown };
  if (metadata !== null && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    res.status(400).json({ error: 'metadata must be an object or null' });
    return;
  }

  const updated = updateMetadata(bookId, metadata as ComicMetadata | null)!;
  res.json({ metadata: updated.metadata });
});

router.delete('/:bookId', (req: Request, res: Response) => {
  const bookId = req.params['bookId'] as string;
  const book = getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  deleteBook(bookId);
  res.status(204).send();
});

export default router;

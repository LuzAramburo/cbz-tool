import { Request, Response } from 'express';
import fs from 'fs/promises';
import JSZip from 'jszip';
import { parseCbz } from '../services/cbzParser.js';
import {
  saveBook,
  getBook,
  deleteBook,
  getPagePath,
  listBooks,
  mergeBooks,
} from '../services/cbzStore.js';
import type { Book, BookSummary, BookMetadata, UploadResponse, BulkUploadResponse, BulkDeleteResponse } from '../types/cbz.js';

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

export function getBooks(_req: Request, res: Response): void {
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
}

export async function uploadBooks(req: Request, res: Response): Promise<void> {
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
}

export async function mergeBook(req: Request, res: Response): Promise<void> {
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
}

export async function bulkDeleteBooks(req: Request, res: Response): Promise<void> {
  const { bookIds } = req.body as { bookIds: unknown };

  if (!Array.isArray(bookIds) || bookIds.length === 0) {
    res.status(400).json({ error: 'bookIds must be a non-empty array' });
    return;
  }
  for (let i = 0; i < bookIds.length; i++) {
    if (typeof bookIds[i] !== 'string' || !bookIds[i]) {
      res.status(400).json({ error: `bookIds contains an invalid entry at index ${i}` });
      return;
    }
  }

  const results = await Promise.allSettled(
    (bookIds as string[]).map(async (id) => {
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
      response.notFound.push((bookIds as string[])[i]!);
    }
  });

  res.json(response);
}

export async function getBookById(req: Request, res: Response): Promise<void> {
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
}

export async function downloadBook(req: Request, res: Response): Promise<void> {
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
    `attachment; filename="${buildDownloadFilename(book.metadata)}"`,
  );
  res.send(buffer);
}

export async function deleteBookById(req: Request, res: Response): Promise<void> {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  await deleteBook(bookId);
  res.status(204).send();
}

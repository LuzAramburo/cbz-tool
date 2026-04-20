import { Request, Response } from 'express';
import { isImageEntry, getMime } from '../services/cbzParser.js';
import {
  getBook,
  removePage,
  removePages,
  addPages,
  movePage,
  getPagePath,
} from '../services/cbzStore.js';
import { getOrCreateThumbnail, deleteThumbnail } from '../services/thumbnailService.js';
import type { PageData } from '../types/cbz.js';

export async function getPage(req: Request, res: Response): Promise<void> {
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

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', page.mimeType);
  res.sendFile(getPagePath(bookId, page.filename));
}

export async function getPageThumbnail(req: Request, res: Response): Promise<void> {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
  const index = parseInt(req.params['index'] as string, 10);
  const page = book.pages[index];
  if (!page) { res.status(404).json({ error: 'Page not found' }); return; }
  try {
    const thumbPath = await getOrCreateThumbnail(bookId, page.filename);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(thumbPath);
  } catch (err) {
    console.error(`[thumbnail] ${bookId}/${page.filename}:`, err);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
}

export async function addPagesToBook(req: Request, res: Response): Promise<void> {
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
}

export async function moveBookPage(req: Request, res: Response): Promise<void> {
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
}

export async function deleteBookPages(req: Request, res: Response): Promise<void> {
  const bookId = req.params['bookId'] as string;
  const book = await getBook(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { indices } = req.body as { indices?: unknown };
  if (!Array.isArray(indices) || indices.length === 0) {
    res.status(400).json({ error: 'indices must be a non-empty array' });
    return;
  }

  for (const idx of indices) {
    if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx >= book.pages.length) {
      res.status(400).json({ error: `Index out of range: ${idx}` });
      return;
    }
  }

  try {
    const filenames = (indices as number[]).map((i) => book.pages[i]!.filename);
    const updated = (await removePages(bookId, indices as number[]))!;
    await Promise.all(filenames.map((fn) => deleteThumbnail(bookId, fn)));
    res.json({
      pageCount: updated.pages.length,
      pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
    });
  } catch (err) {
    console.error('[deleteBookPages]', err);
    res.status(500).json({ error: 'Failed to delete pages' });
  }
}

export async function deleteBookPage(req: Request, res: Response): Promise<void> {
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

  try {
    const filename = book.pages[index]!.filename;
    const updated = (await removePage(bookId, index))!;
    await deleteThumbnail(bookId, filename);
    res.json({
      pageCount: updated.pages.length,
      pages: updated.pages.map(({ index: i, filename }) => ({ index: i, filename })),
    });
  } catch (err) {
    console.error('[deleteBookPage]', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
}

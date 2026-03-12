import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCbz } from '../services/cbzParser.js';
import { saveBook, getBook, deleteBook } from '../services/cbzStore.js';
import type { UploadResponse } from '../types/cbz.js';

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

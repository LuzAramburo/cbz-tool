import { Request, Response } from 'express';
import {
  getBook,
  updateMetadata,
  setMetadataProperty,
  removeMetadataProperty,
} from '../services/cbzStore.js';
import type { BookMetadata } from '../types/cbz.js';

export async function setMetadataKey(req: Request, res: Response): Promise<void> {
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
}

export async function deleteMetadataKey(req: Request, res: Response): Promise<void> {
  const { bookId, key } = req.params as { bookId: string; key: string };
  if (!(await getBook(bookId))) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  const updated = (await removeMetadataProperty(bookId, key))!;
  res.json({ metadata: updated.metadata });
}

export async function patchMetadata(req: Request, res: Response): Promise<void> {
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
}

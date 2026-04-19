import fsp from 'fs/promises';
import sharp from 'sharp';
import { getPagePath, getThumbnailPath, ensureThumbnailsDir } from './cbzStore.js';

const THUMBNAIL_WIDTH = 300;

export async function getOrCreateThumbnail(bookId: string, filename: string): Promise<string> {
  const thumbPath = getThumbnailPath(bookId, filename);
  try {
    await fsp.access(thumbPath);
    return thumbPath;
  } catch {
    // not cached — generate
  }
  await ensureThumbnailsDir(bookId);
  const tmpPath = `${thumbPath}.tmp`;
  await sharp(getPagePath(bookId, filename))
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(tmpPath);
  await fsp.rename(tmpPath, thumbPath);
  return thumbPath;
}

export async function deleteThumbnail(bookId: string, filename: string): Promise<void> {
  await fsp.rm(getThumbnailPath(bookId, filename), { force: true });
}

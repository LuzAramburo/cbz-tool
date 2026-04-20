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
  const data = await fsp.readFile(getPagePath(bookId, filename));
  await sharp(data)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(tmpPath);
  await fsp.rename(tmpPath, thumbPath);
  return thumbPath;
}

export async function deleteThumbnail(bookId: string, filename: string): Promise<void> {
  const thumbPath = getThumbnailPath(bookId, filename);
  for (let i = 0; i < 5; i++) {
    try {
      await fsp.rm(thumbPath, { force: true });
      return;
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EBUSY' || i === 4) throw err;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

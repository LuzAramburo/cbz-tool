import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  content: Buffer | string;
}

export async function makeZip(entries: ZipEntry[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const { name, content } of entries) {
    zip.file(name, content);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

// Minimal magic-byte buffers — not valid images, but non-empty and parseable by yauzl
export const FAKE_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
export const FAKE_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
export const FAKE_WEBP = Buffer.from([0x52, 0x49, 0x46, 0x46]);

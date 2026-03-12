export interface PageEntry {
  index: number;
  filename: string;
  data: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export type ComicMetadata = Record<string, string>;

export interface Book {
  bookId: string;
  pages: PageEntry[];
  metadata: ComicMetadata | null;
}

export interface PageInfo {
  index: number;
  filename: string;
}

export interface UploadResponse {
  bookId: string;
  pageCount: number;
  pages: PageInfo[];
  metadata: ComicMetadata | null;
}

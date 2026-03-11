export interface PageEntry {
  index: number;
  filename: string;
  data: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ComicMetadata {
  title?: string;
  series?: string;
  issue?: string;
  publisher?: string;
  year?: string;
  summary?: string;
}

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

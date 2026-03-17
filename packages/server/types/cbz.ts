export interface PageEntry {
  index: number;
  filename: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface PageData {
  filename: string;
  data: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export type BookMetadata = Record<string, string>;

export interface Book {
  bookId: string;
  pages: PageEntry[];
  metadata: BookMetadata | null;
}

export interface PageInfo {
  index: number;
  filename: string;
}

export interface UploadResponse {
  bookId: string;
  pageCount: number;
  pages: PageInfo[];
  metadata: BookMetadata | null;
}

export interface BookSummary {
  bookId: string;
  title: string | null;
  series: string | null;
  number: string | null;
  coverPageIndex: number;
}

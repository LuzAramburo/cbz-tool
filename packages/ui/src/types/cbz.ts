export interface PageInfo {
  index: number;
  filename: string;
}

export type BookMetadata = Record<string, string>;

export interface UploadResponse {
  bookId: string;
  pageCount: number;
  pages: PageInfo[];
  metadata: BookMetadata | null;
}

export interface BulkUploadResponse {
  succeeded: UploadResponse[];
  failed: Array<{ filename: string; error: string }>;
}

export interface BookSummary {
  bookId: string;
  title: string | null;
  series: string | null;
  number: string | null;
  pageCount: number;
  coverPageIndex: number;
}

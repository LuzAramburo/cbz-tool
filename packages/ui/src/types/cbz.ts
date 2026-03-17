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

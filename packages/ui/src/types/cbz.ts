export interface PageInfo {
  index: number;
  filename: string;
}

export type ComicMetadata = Record<string, string>;

export interface UploadResponse {
  bookId: string;
  pageCount: number;
  pages: PageInfo[];
  metadata: ComicMetadata | null;
}

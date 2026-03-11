export interface PageInfo {
  index: number;
  filename: string;
}

export interface ComicMetadata {
  title?: string;
  series?: string;
  issue?: string;
  publisher?: string;
  year?: string;
  summary?: string;
}

export interface UploadResponse {
  bookId: string;
  pageCount: number;
  pages: PageInfo[];
  metadata: ComicMetadata | null;
}

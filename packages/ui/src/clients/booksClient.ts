import type { UploadResponse, BulkUploadResponse, BulkDeleteResponse, BookMetadata, BookSummary } from '../types/cbz';

type PagesResponse = Pick<UploadResponse, 'pageCount' | 'pages'>;
type MetadataResponse = { metadata: BookMetadata | null };

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function getPageImageUrl(bookId: string, pageIndex: number, filename: string): string {
  return `/api/books/${bookId}/page/${pageIndex}?v=${encodeURIComponent(filename)}`;
}

export function getPageThumbnailUrl(bookId: string, pageIndex: number, filename: string): string {
  return `/api/books/${bookId}/page/${pageIndex}/thumbnail?v=${encodeURIComponent(filename)}`;
}

export async function listBooks(): Promise<BookSummary[]> {
  return apiFetch<BookSummary[]>('/api/books');
}

export async function getBook(bookId: string): Promise<UploadResponse> {
  return apiFetch<UploadResponse>(`/api/books/${bookId}`);
}

export async function uploadBook(files: File[]): Promise<BulkUploadResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  return apiFetch<BulkUploadResponse>('/api/books/upload', { method: 'POST', body: formData });
}

export async function deletePage(bookId: string, index: number): Promise<PagesResponse> {
  return apiFetch<PagesResponse>(`/api/books/${bookId}/page/${index}`, { method: 'DELETE' });
}

export async function deletePages(bookId: string, indices: number[]): Promise<PagesResponse> {
  return apiFetch<PagesResponse>(`/api/books/${bookId}/pages`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ indices }),
  });
}

export async function addPages(bookId: string, files: File[], insertAt: number): Promise<PagesResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('insertAt', String(insertAt));
  return apiFetch<PagesResponse>(`/api/books/${bookId}/pages`, { method: 'POST', body: formData });
}

export async function movePage(bookId: string, fromIndex: number, toIndex: number): Promise<PagesResponse> {
  return apiFetch<PagesResponse>(`/api/books/${bookId}/page/${fromIndex}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toIndex }),
  });
}

export async function patchMetadata(bookId: string, metadata: BookMetadata | null): Promise<MetadataResponse> {
  return apiFetch<MetadataResponse>(`/api/books/${bookId}/metadata`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata }),
  });
}

export async function bulkDeleteBooks(bookIds: string[]): Promise<BulkDeleteResponse> {
  return apiFetch<BulkDeleteResponse>('/api/books/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookIds }),
  });
}

export async function deleteBook(bookId: string): Promise<void> {
  const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Delete failed (${res.status})`);
  }
}

export async function mergeBooks(
  bookIds: string[],
  metadata: BookMetadata | null,
): Promise<UploadResponse> {
  return apiFetch<UploadResponse>('/api/books/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookIds, metadata }),
  });
}

export async function downloadBook(bookId: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`/api/books/${bookId}/download`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'book.cbz';
  return { blob, filename };
}

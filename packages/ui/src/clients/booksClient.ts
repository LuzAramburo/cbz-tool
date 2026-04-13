import createClient from 'openapi-fetch';
import type { paths, components } from '../types/openapi';

type UploadResponse = components['schemas']['UploadResponse'];
type BookSummary = components['schemas']['BookSummary'];
type BookMetadata = components['schemas']['BookMetadata'];
type PageListResponse = components['schemas']['PageListResponse'];
type MetadataResponse = components['schemas']['MetadataResponse'];
type BookStatus = components['schemas']['BookStatus'];

const client = createClient<paths>({ baseUrl: '' });

function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.error !== undefined) {
    const err = result.error as { error?: string };
    throw new Error(err.error ?? 'Request failed');
  }
  return result.data!;
}

// Multipart endpoints need FormData, so we bypass openapi-fetch's body serializer.
async function multipartPost<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getPageImageUrl(bookId: string, pageIndex: number, filename: string): string {
  return `/api/books/${bookId}/page/${pageIndex}?v=${encodeURIComponent(filename)}`;
}

export async function getBookStatus(bookId: string): Promise<BookStatus> {
  return unwrap(await client.GET('/api/books/{bookId}/status', { params: { path: { bookId } } }));
}

export async function listBooks(): Promise<BookSummary[]> {
  return unwrap(await client.GET('/api/books'));
}

export async function getBook(bookId: string): Promise<UploadResponse> {
  return unwrap(await client.GET('/api/books/{bookId}', { params: { path: { bookId } } }));
}

export async function uploadBook(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return multipartPost<UploadResponse>('/api/books/upload', formData);
}

export async function mergeBooks(bookIds: string[], metadata: BookMetadata | null): Promise<UploadResponse> {
  return unwrap(
    await client.POST('/api/books/merge', { body: { bookIds, metadata } }),
  );
}

export async function deleteBook(bookId: string): Promise<void> {
  unwrap(await client.DELETE('/api/books/{bookId}', { params: { path: { bookId } } }));
}

export async function deletePage(bookId: string, index: number): Promise<PageListResponse> {
  return unwrap(
    await client.DELETE('/api/books/{bookId}/page/{index}', { params: { path: { bookId, index } } }),
  );
}

export async function movePage(bookId: string, fromIndex: number, toIndex: number): Promise<PageListResponse> {
  return unwrap(
    await client.PATCH('/api/books/{bookId}/page/{index}', {
      params: { path: { bookId, index: fromIndex } },
      body: { toIndex },
    }),
  );
}

export async function addPages(bookId: string, files: File[], insertAt: number): Promise<PageListResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('insertAt', String(insertAt));
  return multipartPost<PageListResponse>(`/api/books/${bookId}/pages`, formData);
}

export async function patchMetadata(bookId: string, metadata: BookMetadata | null): Promise<MetadataResponse> {
  return unwrap(
    await client.PATCH('/api/books/{bookId}/metadata', {
      params: { path: { bookId } },
      body: { metadata },
    }),
  );
}

export async function downloadBook(bookId: string): Promise<{ blob: Blob; filename: string }> {
  const { data, error, response } = await client.GET('/api/books/{bookId}/download', {
    params: { path: { bookId } },
    parseAs: 'blob',
  });
  if (error !== undefined) {
    throw new Error(`Download failed`);
  }
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'book.cbz';
  return { blob: data as Blob, filename };
}

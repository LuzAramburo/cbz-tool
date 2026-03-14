import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';

interface UseCbzUpload {
  upload: (file: File) => Promise<boolean>;
  removePage: (index: number) => Promise<void>;
  addPages: (files: File[], insertAt: number) => Promise<void>;
  movePage: (index: number, toIndex: number) => Promise<void>;
  book: UploadResponse | null;
  loading: boolean;
  error: string | null;
}

export function useCbzUpload(): UseCbzUpload {
  const [book, setBook] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<boolean> {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/cbz/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? `Upload failed (${res.status})`);
        return false;
      }
      const data: UploadResponse = await res.json();
      setBook(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function removePage(index: number) {
    if (!book) return;
    try {
      const res = await fetch(`/api/cbz/${book.bookId}/page/${index}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? `Delete failed (${res.status})`);
        return;
      }
      const data = await res.json() as { pageCount: number; pages: UploadResponse['pages'] };
      setBook((prev) => prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function addPages(files: File[], insertAt: number) {
    if (!book) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('insertAt', String(insertAt));

    try {
      const res = await fetch(`/api/cbz/${book.bookId}/pages`, { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? `Add pages failed (${res.status})`);
        return;
      }
      const data = await res.json() as { pageCount: number; pages: UploadResponse['pages'] };
      setBook((prev) => prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function movePage(index: number, toIndex: number) {
    if (!book) return;
    try {
      const res = await fetch(`/api/cbz/${book.bookId}/page/${index}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toIndex }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? `Move failed (${res.status})`);
        return;
      }
      const data = await res.json() as { pageCount: number; pages: UploadResponse['pages'] };
      setBook((prev) => prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return { upload, removePage, addPages, movePage, book, loading, error };
}

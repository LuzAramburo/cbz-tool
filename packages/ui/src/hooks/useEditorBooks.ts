import { useState } from 'react';
import type { UploadResponse, BulkUploadResponse } from '../types/cbz';
import * as api from '../clients/booksClient';
import { useBookOperations } from './useBookOperations';

export interface UploadResult {
  openedBookId: string | null;
  anySucceeded: boolean;
}

interface UseEditorBooks {
  upload: (files: File[]) => Promise<UploadResult>;
  openBook: (bookId: string) => Promise<void>;
  removePage: (index: number) => Promise<void>;
  addPages: (files: File[], insertAt: number) => Promise<void>;
  movePage: (index: number, toIndex: number) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  downloadBook: () => void;
  saveMetadata: () => Promise<void>;
  setMetadata: (metadata: Record<string, string> | null) => void;
  book: UploadResponse | null;
  pendingMetadata: Record<string, string> | null;
  refreshKey: number;
  uploading: boolean;
  loading: boolean;
  downloading: boolean;
  saving: boolean;
  error: string | null;
}

export function useEditorBooks(): UseEditorBooks {
  const [book, setBook] = useState<UploadResponse | null>(null);
  const [pendingMetadata, setPendingMetadata] = useState<Record<string, string> | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ops = useBookOperations(setError);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function setMetadata(metadata: Record<string, string> | null) {
    setPendingMetadata(metadata);
  }

  async function upload(files: File[]): Promise<UploadResult> {
    const data = await ops.upload(files);
    if (!data) return { openedBookId: null, anySucceeded: false };

    let openedBookId: string | null = null;
    if (data.succeeded.length === 1) {
      const only = data.succeeded[0] as UploadResponse;
      setBook(only);
      setPendingMetadata(only.metadata);
      openedBookId = only.bookId;
    }

    if (data.failed.length > 0) {
      const lines = data.failed.map((f: BulkUploadResponse['failed'][number]) => `${f.filename}: ${f.error}`).join('\n');
      setError(data.succeeded.length > 0 ? `Some files failed:\n${lines}` : lines);
    }

    if (data.succeeded.length > 0) refresh();

    return { openedBookId, anySucceeded: data.succeeded.length > 0 };
  }

  async function openBook(bookId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBook(bookId);
      setBook(data);
      setPendingMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function removePage(index: number) {
    if (!book) return;
    try {
      const data = await api.deletePage(book.bookId, index);
      setBook((prev) => (prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function addPages(files: File[], insertAt: number) {
    if (!book) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.addPages(book.bookId, files, insertAt);
      setBook((prev) => (prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function movePage(index: number, toIndex: number) {
    if (!book) return;
    try {
      const data = await api.movePage(book.bookId, index, toIndex);
      setBook((prev) => (prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function deleteBook(bookId: string) {
    const success = await ops.remove(bookId);
    if (success) {
      if (book?.bookId === bookId) {
        setBook(null);
        setPendingMetadata(null);
      }
      refresh();
    }
  }

  async function saveMetadata() {
    if (!book) return;
    setSaving(true);
    try {
      await api.patchMetadata(book.bookId, pendingMetadata);
      setBook((prev) => (prev ? { ...prev, metadata: pendingMetadata } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function downloadBook() {
    if (!book) return;
    setDownloading(true);
    try {
      await api.patchMetadata(book.bookId, pendingMetadata);
      const { blob, filename } = await api.downloadBook(book.bookId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDownloading(false);
    }
  }

  return {
    upload,
    openBook,
    removePage,
    addPages,
    movePage,
    deleteBook,
    downloadBook,
    saveMetadata,
    setMetadata,
    book,
    pendingMetadata,
    refreshKey,
    uploading: ops.uploading,
    loading,
    downloading,
    saving,
    error,
  };
}

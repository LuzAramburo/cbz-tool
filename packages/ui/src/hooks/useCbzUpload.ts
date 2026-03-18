import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';
import * as api from '../clients/booksClient';

interface UseCbzUpload {
  upload: (file: File) => Promise<boolean>;
  openBook: (bookId: string) => Promise<void>;
  removePage: (index: number) => Promise<void>;
  addPages: (files: File[], insertAt: number) => Promise<void>;
  movePage: (index: number, toIndex: number) => Promise<void>;
  downloadBook: () => void;
  setMetadata: (metadata: Record<string, string> | null) => void;
  book: UploadResponse | null;
  pendingMetadata: Record<string, string> | null;
  loading: boolean;
  downloading: boolean;
  error: string | null;
}

export function useCbzUpload(): UseCbzUpload {
  const [book, setBook] = useState<UploadResponse | null>(null);
  const [pendingMetadata, setPendingMetadata] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setMetadata(metadata: Record<string, string> | null) {
    setPendingMetadata(metadata);
  }

  async function upload(file: File): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const data = await api.uploadBook(file);
      setBook(data);
      setPendingMetadata(data.metadata);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
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
      setBook((prev) => prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev);
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
      const data = await api.movePage(book.bookId, index, toIndex);
      setBook((prev) => prev ? { ...prev, pageCount: data.pageCount, pages: data.pages } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

  return { upload, openBook, removePage, addPages, movePage, downloadBook, setMetadata, book, pendingMetadata, loading, downloading, error };
}

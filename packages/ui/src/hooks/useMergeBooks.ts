import { useState, useEffect } from 'react';
import type { BookSummary, BookMetadata, UploadResponse } from '../types/cbz';
import { listBooks, mergeBooks, downloadBook } from '../clients/booksClient';
import { useBookOperations } from './useBookOperations';

export function useMergeBooks() {
  const [error, setError] = useState<string | null>(null);
  const ops = useBookOperations(setError);

  const [books, setBooks] = useState<BookSummary[] | null>(null);
  const [mergedBook, setMergedBook] = useState<UploadResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [merging, setMerging] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listBooks()
      .then((data) => { if (!cancelled) setBooks(data); })
      .catch(() => { if (!cancelled) setBooks([]); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  function refresh() { setRefreshKey((k) => k + 1); }

  async function upload(file: File): Promise<boolean> {
    const result = await ops.upload(file);
    if (result !== undefined) { refresh(); return true; }
    return false;
  }

  async function remove(bookId: string): Promise<boolean> {
    return ops.remove(bookId);
  }

  async function merge(bookIds: string[], metadata: BookMetadata | null) {
    setMerging(true);
    setError(null);
    try {
      const result = await mergeBooks(bookIds, metadata);
      setMergedBook(result);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMerging(false);
    }
  }

  async function downloadMerged() {
    if (!mergedBook) return;
    setDownloading(true);
    try {
      const { blob, filename } = await downloadBook(mergedBook.bookId);
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
    books,
    mergedBook,
    uploading: ops.uploading,
    deleting: ops.deleting,
    merging,
    downloading,
    error,
    upload,
    remove,
    merge,
    downloadMerged,
    dismissMergedBook: () => setMergedBook(null),
    refresh,
  };
}

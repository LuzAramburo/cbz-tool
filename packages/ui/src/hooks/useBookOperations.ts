import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';
import { uploadBook, deleteBook } from '../clients/booksClient';

interface UseBookOperations {
  uploading: boolean;
  deleting: boolean;
  upload: (file: File) => Promise<UploadResponse | undefined>;
  remove: (bookId: string) => Promise<boolean>;
}

export function useBookOperations(
  setError: (msg: string | null) => void
): UseBookOperations {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function upload(file: File): Promise<UploadResponse | undefined> {
    setUploading(true);
    setError(null);
    try {
      return await uploadBook(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  }

  async function remove(bookId: string): Promise<boolean> {
    setDeleting(true);
    setError(null);
    try {
      await deleteBook(bookId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setDeleting(false);
    }
  }

  return { uploading, deleting, upload, remove };
}

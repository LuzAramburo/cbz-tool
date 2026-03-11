import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';

interface UseCbzUpload {
  upload: (file: File) => Promise<void>;
  book: UploadResponse | null;
  loading: boolean;
  error: string | null;
}

export function useCbzUpload(): UseCbzUpload {
  const [book, setBook] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/cbz/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? `Upload failed (${res.status})`);
        return;
      }
      const data: UploadResponse = await res.json();
      setBook(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { upload, book, loading, error };
}

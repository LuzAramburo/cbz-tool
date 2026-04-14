import { useState, useEffect, useRef } from 'react';
import type { BookSummary } from '../../types/cbz';
import { listBooks } from '../../clients/booksClient';
import BookCard from './BookCard';
import LoadingIcon from '../icons/LoadingIcon.tsx';

interface BookLibraryProps {
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string, title: string) => void;
  refreshKey?: number;
  onEmpty?: () => void;
}

export default function BookLibrary({ onSelect, onDelete, refreshKey, onEmpty }: BookLibraryProps) {
  const [books, setBooks] = useState<BookSummary[] | null>(null);
  const onEmptyRef = useRef(onEmpty);
  useEffect(() => {
    onEmptyRef.current = onEmpty;
  });

  useEffect(() => {
    let cancelled = false;
    listBooks()
      .then((data) => {
        if (!cancelled) {
          setBooks(data);
          if (data.length === 0) onEmptyRef.current?.();
        }
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (books === null) {
    return (
      <div className="flex justify-center py-8">
        <LoadingIcon />
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Library</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {books.map((book) => (
          <BookCard key={book.bookId} book={book} onSelect={onSelect} onDelete={onDelete} refreshKey={refreshKey} />
        ))}
      </div>
    </div>
  );
}

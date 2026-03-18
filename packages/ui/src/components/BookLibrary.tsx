import { useState, useEffect } from 'react';
import type { BookSummary } from '../types/cbz';
import { listBooks } from '../clients/booksClient';
import BookCard from './BookCard';

interface BookLibraryProps {
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string, title: string) => void;
  refreshKey?: number;
}

export default function BookLibrary({ onSelect, onDelete, refreshKey }: BookLibraryProps) {
  const [books, setBooks] = useState<BookSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listBooks()
      .then((data) => {
        if (!cancelled) setBooks(data);
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
        <svg className="h-6 w-6 animate-spin text-gray-400" viewBox="0 0 16 16" fill="none">
          <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" opacity=".2" />
            <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
          </g>
        </svg>
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Library</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {books.map((book) => (
          <BookCard key={book.bookId} book={book} onSelect={onSelect} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

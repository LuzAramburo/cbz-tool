import { useState, useEffect, useRef } from 'react';
import type { BookSummary } from '../../types/cbz';
import { listBooks, bulkDeleteBooks } from '../../clients/booksClient';
import BookCard from './BookCard';
import LoadingIcon from '../icons/LoadingIcon.tsx';
import Modal from '../modals/Modal';

interface BookLibraryProps {
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string, title: string) => void;
  refreshKey?: number;
  onEmpty?: () => void;
  onBulkDelete?: (deletedIds: string[]) => void;
}

export default function BookLibrary({ onSelect, onDelete, refreshKey, onEmpty, onBulkDelete }: BookLibraryProps) {
  const [books, setBooks] = useState<BookSummary[] | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIds([]);
  }

  function toggleSelect(bookId: string) {
    setSelectedIds((ids) =>
      ids.includes(bookId) ? ids.filter((id) => id !== bookId) : [...ids, bookId],
    );
  }

  async function confirmBulkDelete() {
    setDeleting(true);
    try {
      const { deleted } = await bulkDeleteBooks(selectedIds);
      const deletedSet = new Set(deleted);
      setBooks((prev) => {
        const remaining = prev ? prev.filter((b) => !deletedSet.has(b.bookId)) : prev;
        if (remaining?.length === 0) onEmptyRef.current?.();
        return remaining;
      });
      setSelectedIds([]);
      setSelectMode(false);
      setConfirmOpen(false);
      onBulkDelete?.(deleted);
    } finally {
      setDeleting(false);
    }
  }

  if (books === null) {
    return (
      <div className="flex justify-center py-8">
        <LoadingIcon />
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Library</h2>
          <div className="flex items-center gap-2">
            {selectMode && (
              <button
                onClick={() =>
                  selectedIds.length === books.length
                    ? setSelectedIds([])
                    : setSelectedIds(books.map((b) => b.bookId))
                }
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {selectedIds.length === books.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            {selectMode && selectedIds.length > 0 && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete ({selectedIds.length})
              </button>
            )}
            <button
              onClick={toggleSelectMode}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectMode ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40' : 'border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
            >
              {selectMode ? 'Cancel' : 'Select for Bulk Delete'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {books.map((book) => (
            <BookCard
              key={book.bookId}
              book={book}
              onSelect={onSelect}
              onDelete={onDelete}
              refreshKey={refreshKey}
              selected={selectedIds.includes(book.bookId)}
              onToggleSelect={selectMode ? toggleSelect : undefined}
            />
          ))}
        </div>
      </div>

      {confirmOpen && (
        <Modal
          title="Delete Books"
          onClose={() => setConfirmOpen(false)}
          size="sm"
          footer={{
            confirmLabel: 'Delete',
            onConfirm: confirmBulkDelete,
            danger: true,
            loading: deleting,
            loadingLabel: 'Deleting...',
          }}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete {selectedIds.length} {selectedIds.length === 1 ? 'book' : 'books'}?
          </p>
        </Modal>
      )}
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import type { BookSummary } from '../../types/cbz';
import { listBooks, bulkDeleteBooks } from '../../clients/booksClient';
import BookCard from './BookCard';
import LibrarySection from '../layout/LibrarySection';
import Modal from '../modals/Modal';

interface BookLibraryProps {
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string, title: string) => void;
  refreshKey?: number;
  onEmpty?: () => void;
  onBulkDelete?: (deletedIds: string[]) => void;
}

export default function BookLibrary({
  onSelect,
  onDelete,
  refreshKey,
  onEmpty,
  onBulkDelete,
}: BookLibraryProps) {
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
          setBooks(
            [...data].sort((a, b) =>
              (a.title ?? '').localeCompare(b.title ?? '', undefined, { numeric: true })
            )
          );
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
      ids.includes(bookId) ? ids.filter((id) => id !== bookId) : [...ids, bookId]
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

  return (
    <>
      <LibrarySection
        books={books}
        renderCard={(book) => (
          <BookCard
            book={book}
            onSelect={onSelect}
            onDelete={onDelete}
            selected={selectedIds.includes(book.bookId)}
            onToggleSelect={selectMode ? toggleSelect : undefined}
          />
        )}
        headerActions={
          <>
            {selectMode && (
              <button
                onClick={() =>
                  selectedIds.length === books?.length
                    ? setSelectedIds([])
                    : setSelectedIds((books ?? []).map((b) => b.bookId))
                }
                className="btn btn-md btn-outline-gray"
              >
                {selectedIds.length === books?.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            {selectMode && selectedIds.length > 0 && (
              <button onClick={() => setConfirmOpen(true)} className="btn btn-md btn-danger">
                Delete ({selectedIds.length})
              </button>
            )}
            <button
              onClick={toggleSelectMode}
              className={`btn btn-md ${selectMode ? 'btn-outline-red-active' : 'btn-outline-red'}`}
            >
              {selectMode ? 'Cancel' : 'Bulk delete books'}
            </button>
          </>
        }
        disabledHeaderActions={
          <button disabled className="btn btn-md btn-outline-red opacity-50 cursor-not-allowed">
            Bulk delete books
          </button>
        }
      />

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
            Are you sure you want to delete {selectedIds.length}{' '}
            {selectedIds.length === 1 ? 'book' : 'books'}?
          </p>
        </Modal>
      )}
    </>
  );
}

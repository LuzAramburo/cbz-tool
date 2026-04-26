import { useState, useEffect, useRef } from 'react';
import type { BookSummary } from '../../types/cbz';
import { listBooks, bulkDeleteBooks } from '../../clients/booksClient';
import BookCard from './BookCard';
import LoadingIcon from '../icons/LoadingIcon.tsx';
import Modal from '../modals/Modal';

function groupBySeries(books: BookSummary[]): { series: string | null; books: BookSummary[] }[] {
  const map = new Map<string, BookSummary[]>();
  for (const book of books) {
    const key = book.series ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(book);
  }
  for (const group of map.values()) {
    group.sort((a, b) => {
      const nA = parseFloat(a.number ?? '');
      const nB = parseFloat(b.number ?? '');
      if (!isNaN(nA) && !isNaN(nB) && nA !== nB) return nA - nB;
      return (a.title ?? '').localeCompare(b.title ?? '', undefined, { numeric: true });
    });
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === '') return 1;
      if (b === '') return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    })
    .map(([series, books]) => ({ series: series || null, books }));
}

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
  const [groupBy, setGroupBy] = useState<'none' | 'series'>('none');
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
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'series')}
              className="btn btn-md btn-outline-gray cursor-pointer"
            >
              <option value="none">Group: None</option>
              <option value="series">Group: Series</option>
            </select>
            {selectMode && (
              <button
                onClick={() =>
                  selectedIds.length === books.length
                    ? setSelectedIds([])
                    : setSelectedIds(books.map((b) => b.bookId))
                }
                className="btn btn-md btn-outline-gray"
              >
                {selectedIds.length === books.length ? 'Deselect All' : 'Select All'}
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
          </div>
        </div>
        {groupBy === 'series' ? (
          groupBySeries(books).map(({ series, books: group }) => (
            <div key={series ?? '__unknown__'} className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {series ?? 'Unknown'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.map((book) => (
                  <BookCard
                    key={book.bookId}
                    book={book}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    selected={selectedIds.includes(book.bookId)}
                    onToggleSelect={selectMode ? toggleSelect : undefined}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {books.map((book) => (
              <BookCard
                key={book.bookId}
                book={book}
                onSelect={onSelect}
                onDelete={onDelete}
                selected={selectedIds.includes(book.bookId)}
                onToggleSelect={selectMode ? toggleSelect : undefined}
              />
            ))}
          </div>
        )}
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
            Are you sure you want to delete {selectedIds.length}{' '}
            {selectedIds.length === 1 ? 'book' : 'books'}?
          </p>
        </Modal>
      )}
    </>
  );
}

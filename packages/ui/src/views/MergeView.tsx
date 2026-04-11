import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { BookMetadata } from '../types/cbz';
import { getBook } from '../clients/booksClient';
import { useMergeBooks } from '../hooks/useMergeBooks';
import BookCard from '../components/editor/BookCard';
import BookMetadataPanel from '../components/editor/BookMetadata';
import UploadBookModal from '../components/modals/UploadBookModal';
import Modal from '../components/modals/Modal';
import LoadingIcon from '../components/icons/LoadingIcon';
import UploadIcon from '../components/icons/UploadIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import MergeIcon from '../components/icons/MergeIcon';

export default function MergeView() {
  const [, navigate] = useLocation();
  const {
    books,
    mergedBook,
    uploading,
    deleting,
    merging,
    downloading,
    error,
    upload,
    remove,
    merge,
    downloadMerged,
    dismissMergedBook,
  } = useMergeBooks();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingMetadata, setPendingMetadata] = useState<BookMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingDeleteBook, setPendingDeleteBook] = useState<{
    bookId: string;
    title: string;
  } | null>(null);

  const firstId = selectedIds[0];
  useEffect(() => {
    if (!firstId) {
      setPendingMetadata(null);
      return;
    }
    let cancelled = false;
    setMetadataLoading(true);
    getBook(firstId)
      .then((data) => {
        if (!cancelled) {
          setPendingMetadata(data.metadata);
          setMetadataLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setMetadataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firstId]);

  function handleBookSelect(bookId: string) {
    setSelectedIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  }

  function handleDeleteBook(bookId: string, title: string) {
    setPendingDeleteBook({ bookId, title });
  }

  async function confirmDeleteBook() {
    if (!pendingDeleteBook) return;
    await remove(pendingDeleteBook.bookId);
    setSelectedIds((prev) => prev.filter((id) => id !== pendingDeleteBook.bookId));
    setPendingDeleteBook(null);
  }

  async function handleUploadAndClose(file: File) {
    if (await upload(file)) setUploadModalOpen(false);
  }

  async function handleMerge() {
    await merge(selectedIds, pendingMetadata);
    setSelectedIds([]);
    setPendingMetadata(null);
  }

  const canMerge = selectedIds.length >= 2;

  return (
    <>
      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Merge Books</h1>
          <button
            onClick={() => setUploadModalOpen(true)}
            disabled={uploading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UploadIcon />
            Upload New Book
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {mergedBook && (
          <div className="px-4 py-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Books merged successfully!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                {mergedBook.pageCount} pages
                {mergedBook.metadata?.['title'] ? ` · ${mergedBook.metadata['title']}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={downloadMerged}
                disabled={downloading}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors"
              >
                {downloading ? <LoadingIcon /> : <DownloadIcon />}
                {downloading ? 'Downloading...' : 'Download'}
              </button>
              <button
                onClick={() => navigate('/editor')}
                className="cursor-pointer px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                Open in Editor
              </button>
              <button
                onClick={dismissMergedBook}
                aria-label="Dismiss"
                className="cursor-pointer text-green-400 dark:text-green-600 hover:text-green-600 dark:hover:text-green-400 transition-colors text-xl leading-none px-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {books === null ? (
          <div className="flex justify-center py-12">
            <LoadingIcon />
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <MergeIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No books uploaded yet. Upload books above to get started.
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Library
                {selectedIds.length > 0 && (
                  <span className="ml-2 text-blue-500">{selectedIds.length} selected</span>
                )}
              </h2>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Click to select · click again to remove · selection order = merge order
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.map((book) => {
                const selectionIndex = selectedIds.indexOf(book.bookId);
                const isSelected = selectionIndex !== -1;
                return (
                  <div key={book.bookId} className="relative">
                    {isSelected && (
                      <div className="absolute top-1 left-1 z-10 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold pointer-events-none select-none">
                        {selectionIndex + 1}
                      </div>
                    )}
                    <div className={isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}>
                      <BookCard
                        book={book}
                        onSelect={handleBookSelect}
                        onDelete={handleDeleteBook}
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {selectedIds.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Metadata for merged book
            </h2>
            {metadataLoading ? (
              <div className="flex justify-center py-4">
                <LoadingIcon />
              </div>
            ) : (
              <BookMetadataPanel
                metadata={pendingMetadata ?? {}}
                onMetadataChange={setPendingMetadata}
              />
            )}
          </section>
        )}

        {books !== null && books.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleMerge}
              disabled={!canMerge || merging}
              className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {merging ? <LoadingIcon /> : <MergeIcon className="w-4 h-4" />}
              {merging
                ? 'Merging...'
                : `Merge${selectedIds.length >= 2 ? ` ${selectedIds.length}` : ''} Books`}
            </button>
            {!canMerge && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {selectedIds.length === 1
                  ? 'Select at least one more book'
                  : 'Select books from the library above'}
              </p>
            )}
          </div>
        )}
      </main>

      {uploadModalOpen && (
        <UploadBookModal
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadAndClose}
          loading={uploading}
        />
      )}

      {pendingDeleteBook && (
        <Modal
          title="Delete Book"
          onClose={() => setPendingDeleteBook(null)}
          size="sm"
          footer={{
            confirmLabel: 'Delete',
            onConfirm: confirmDeleteBook,
            danger: true,
            loading: deleting,
            loadingLabel: 'Deleting...',
          }}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete &ldquo;{pendingDeleteBook.title}&rdquo;?
          </p>
        </Modal>
      )}
    </>
  );
}

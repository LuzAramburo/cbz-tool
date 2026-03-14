import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';
import PageThumbnail from './PageThumbnail.tsx';

interface PageGridProps {
  book: UploadResponse;
  onRemovePage: (index: number) => Promise<void>;
  onMovePage: (index: number, toIndex: number) => Promise<void>;
}

export default function PageGrid({ book, onRemovePage, onMovePage }: PageGridProps) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const [moveToSource, setMoveToSource] = useState<number | null>(null);
  const [moveToValue, setMoveToValue] = useState('');

  function openMoveTo(index: number) {
    setMoveToSource(index);
    setMoveToValue(String(index + 1));
  }

  async function handleMoveTo() {
    if (moveToSource === null) return;
    const target = parseInt(moveToValue, 10) - 1;
    setMoveToSource(null);
    await handleMove(moveToSource, target);
  }

  async function handleConfirmRemove() {
    if (pendingIndex === null) return;
    setRemoving(true);
    await onRemovePage(pendingIndex);
    setRemoving(false);
    setPendingIndex(null);
  }

  async function handleMove(index: number, toIndex: number) {
    setMovingIndex(index);
    await onMovePage(index, toIndex);
    setMovingIndex(null);
  }

  const parsedTarget = parseInt(moveToValue, 10);
  const isValidTarget =
    moveToSource !== null &&
    !isNaN(parsedTarget) &&
    parsedTarget >= 1 &&
    parsedTarget <= book.pageCount &&
    parsedTarget - 1 !== moveToSource;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {book.pages.map((page) => (
          <PageThumbnail
            key={page.filename}
            page={page}
            bookId={book.bookId}
            bookPageCount={book.pageCount}
            movingIndex={movingIndex}
            setPendingIndex={setPendingIndex}
            handleMove={handleMove}
            openMoveTo={openMoveTo}
          />
        ))}
      </div>

      {moveToSource !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-80 p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Move page {moveToSource + 1} to position
            </h2>
            <input
              type="number"
              min={1}
              max={book.pageCount}
              value={moveToValue}
              onChange={(e) => setMoveToValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && isValidTarget && handleMoveTo()}
              className="px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Enter a page number between 1 and {book.pageCount}.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMoveToSource(null)}
                className="cursor-pointer px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveTo}
                disabled={!isValidTarget}
                className="cursor-pointer px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingIndex !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-80 p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Remove page {pendingIndex + 1}?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action can't be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingIndex(null)}
                disabled={removing}
                className="cursor-pointer px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removing}
                className="cursor-pointer px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

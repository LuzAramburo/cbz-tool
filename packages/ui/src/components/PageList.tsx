import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';

interface PageListProps {
  book: UploadResponse;
  onRemovePage: (index: number) => Promise<void>;
  onMovePage: (index: number, toIndex: number) => Promise<void>;
}

export default function PageList({ book, onRemovePage, onMovePage }: PageListProps) {
  const metadataEntries = book.metadata ? Object.entries(book.metadata) : [];
  const [metaOpen, setMetaOpen] = useState(true);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [movingIndex, setMovingIndex] = useState<number | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      {metadataEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setMetaOpen((o) => !o)}
            className="cursor-pointer w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Metadata</span>
            <span className="text-gray-400 dark:text-gray-500">{metaOpen ? '▲' : '▼'}</span>
          </button>
          {metaOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border-t dark:border-gray-700">
              {metadataEntries.map(([key, value]) => (
                <div
                  key={key}
                  className={`flex flex-col gap-1 ${key === 'summary' ? 'col-span-full' : ''}`}
                >
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                    {key}
                  </label>
                  {key === 'summary' ? (
                    <textarea
                      readOnly
                      value={value ?? ''}
                      rows={3}
                      className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={value ?? ''}
                      className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {book.pages.map((page) => (
          <div key={page.filename} className="flex flex-col gap-1">
            <div className="relative group">
              <img
                src={`/api/cbz/${book.bookId}/page/${page.index}?v=${encodeURIComponent(page.filename)}`}
                alt={page.filename}
                className="w-full rounded-lg object-cover shadow"
                loading="lazy"
              />
              {movingIndex === page.index && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <svg
                    className="h-7 w-7 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 rounded-b-lg bg-black/50 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMove(page.index, page.index - 1)}
                  disabled={page.index === 0 || movingIndex !== null}
                  className="cursor-pointer text-white hover:text-blue-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move page left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={() => setPendingIndex(page.index)}
                  disabled={movingIndex !== null}
                  className="cursor-pointer text-white hover:text-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMove(page.index, page.index + 1)}
                  disabled={page.index === book.pageCount - 1 || movingIndex !== null}
                  className="cursor-pointer text-white hover:text-blue-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move page right"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
            <span className="text-xs text-center text-gray-400 dark:text-gray-500">
              {page.index + 1}
            </span>
          </div>
        ))}
      </div>

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
    </div>
  );
}

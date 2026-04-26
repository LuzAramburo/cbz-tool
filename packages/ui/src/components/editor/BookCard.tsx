import type { BookSummary } from '../../types/cbz';
import { getPageThumbnailUrl } from '../../clients/booksClient';
import TrashIcon from '../icons/TrashIcon';

interface BookCardProps {
  book: BookSummary;
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string, title: string) => void;
  compact?: boolean;
  selected?: boolean;
  onToggleSelect?: (bookId: string) => void;
}

export default function BookCard({
  book,
  onSelect,
  onDelete,
  compact,
  selected,
  onToggleSelect,
}: BookCardProps) {
  const title = book.title || 'Untitled';
  const selectMode = !!onToggleSelect;

  return (
    <div
      className={`group flex items-stretch bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all relative${selected ? ' ring-2 ring-blue-500' : ''}`}
    >
      <button
        onClick={() => (selectMode ? onToggleSelect(book.bookId) : onSelect(book.bookId))}
        className="cursor-pointer flex items-stretch flex-1 min-w-0 text-left"
      >
        <div
          className={`w-20 shrink-0 bg-gray-200 dark:bg-gray-800 relative${compact ? ' min-h-18' : ' h-28'}`}
        >
          <img
            src={getPageThumbnailUrl(book.bookId, book.coverPageIndex, book.coverFilename)}
            alt={`Cover of ${title}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {selectMode && (
            <div
              className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                selected
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/70 text-white/60 group-hover:bg-black/90'
              }`}
            >
              {selected && (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center px-3 py-2 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{title}</p>
          {book.series && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {book.series}
              {book.number && ` #${book.number}`}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {book.pageCount} {book.pageCount === 1 ? 'page' : 'pages'}
          </p>
        </div>
      </button>
      {!selectMode && (
        <button
          onClick={() => onDelete(book.bookId, title)}
          className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          aria-label={`Delete ${title}`}
        >
          <TrashIcon size="sm" />
        </button>
      )}
    </div>
  );
}

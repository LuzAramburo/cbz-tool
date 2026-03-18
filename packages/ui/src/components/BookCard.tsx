import type { BookSummary } from '../types/cbz';
import { getPageImageUrl } from '../clients/booksClient';
import TrashIcon from './icons/TrashIcon';

interface BookCardProps {
  book: BookSummary;
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string) => void;
}

export default function BookCard({ book, onSelect, onDelete }: BookCardProps) {
  const title = book.title || 'Untitled';

  return (
    <div className="group flex items-stretch bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all relative">
      <button
        onClick={() => onSelect(book.bookId)}
        className="cursor-pointer flex items-stretch flex-1 min-w-0 text-left"
      >
        <div className="w-20 h-28 shrink-0 bg-gray-200 dark:bg-gray-800">
          <img
            src={getPageImageUrl(book.bookId, book.coverPageIndex, '')}
            alt={`Cover of ${title}`}
            className="w-full h-full object-cover"
          />
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
      <button
        onClick={() => onDelete(book.bookId)}
        className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
        aria-label={`Delete ${title}`}
      >
        <TrashIcon size="sm" />
      </button>
    </div>
  );
}

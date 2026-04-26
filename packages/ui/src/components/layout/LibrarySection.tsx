import { useState, Fragment } from 'react';
import type { ReactNode } from 'react';
import type { BookSummary } from '../../types/cbz';
import { groupBySeries } from '../../utils/groupBooks';
import BookCardSkeleton from './BookCardSkeleton';

interface LibrarySectionProps {
  books: BookSummary[] | null;
  renderCard: (book: BookSummary) => ReactNode;
  headerActions?: ReactNode;
  disabledHeaderActions?: ReactNode;
  headingExtra?: ReactNode;
  compact?: boolean;
}

export default function LibrarySection({
  books,
  renderCard,
  headerActions,
  disabledHeaderActions,
  headingExtra,
  compact = false,
}: LibrarySectionProps) {
  const [groupBy, setGroupBy] = useState<'none' | 'series'>(() => {
    const stored = localStorage.getItem('library.groupBy');
    return stored === 'series' ? 'series' : 'none';
  });

  if (books !== null && books.length === 0) return null;

  const groupDropdown = (disabled: boolean) => (
    <select
      disabled={disabled}
      value={groupBy}
      onChange={
        disabled
          ? undefined
          : (e) => {
              const value = e.target.value as 'none' | 'series';
              localStorage.setItem('library.groupBy', value);
              setGroupBy(value);
            }
      }
      className={`btn btn-md btn-outline-gray${disabled ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'}`}
    >
      <option value="none">Group: None</option>
      <option value="series">Group: Series</option>
    </select>
  );

  const bookGrid = (list: BookSummary[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {list.map((book) => (
        <Fragment key={book.bookId}>{renderCard(book)}</Fragment>
      ))}
    </div>
  );

  if (books === null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Library</h2>
          <div className="flex items-center gap-2">
            {groupDropdown(true)}
            {disabledHeaderActions}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <BookCardSkeleton key={i} compact={compact} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Library{headingExtra}
        </h2>
        <div className="flex items-center gap-2">
          {groupDropdown(false)}
          {headerActions}
        </div>
      </div>
      {groupBy === 'series' ? (
        groupBySeries(books).map(({ series, books: group }) => (
          <div key={series ?? '__unknown__'} className="mb-5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {series ?? 'Unknown'}
            </h3>
            {bookGrid(group)}
          </div>
        ))
      ) : (
        bookGrid(books)
      )}
    </div>
  );
}

import type { UploadResponse } from '../types/cbz';

interface PageListProps {
  book: UploadResponse;
}

export default function PageList({ book }: PageListProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {book.metadata?.title ?? book.metadata?.series ?? 'Untitled'}
          </h2>
          {book.metadata?.series && book.metadata.title && (
            <p className="text-sm text-gray-500">{book.metadata.series}</p>
          )}
        </div>
        <span className="text-sm text-gray-400">{book.pageCount} pages</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {book.pages.map((page) => (
          <div key={page.index} className="flex flex-col gap-1">
            <img
              src={`/api/cbz/${book.bookId}/page/${page.index}`}
              alt={page.filename}
              className="w-full rounded-lg object-cover shadow"
              loading="lazy"
            />
            <span className="text-xs text-center text-gray-400">{page.index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { UploadResponse } from '../types/cbz';

interface PageListProps {
  book: UploadResponse;
}

export default function PageList({ book }: PageListProps) {
  const metadataEntries = book.metadata ? Object.entries(book.metadata) : [];
  const [metaOpen, setMetaOpen] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      {metadataEntries.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <button
            onClick={() => setMetaOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>Metadata</span>
            <span className="text-gray-400">{metaOpen ? '▲' : '▼'}</span>
          </button>
          {metaOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border-t">
          {metadataEntries.map(([key, value]) => (
            <div
              key={key}
              className={`flex flex-col gap-1 ${key === 'summary' ? 'col-span-full' : ''}`}
            >
              <label className="text-xs font-medium text-gray-500 capitalize">{key}</label>
              {key === 'summary' ? (
                <textarea
                  readOnly
                  value={value ?? ''}
                  rows={3}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 text-gray-800 resize-y"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={value ?? ''}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 text-gray-800"
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

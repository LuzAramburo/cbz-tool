import { useState } from 'react';

interface BookMetadataProps {
  metadata: Record<string, string>;
  onMetadataChange: (metadata: Record<string, string>) => void;
}

export default function BookMetadata({ metadata, onMetadataChange }: BookMetadataProps) {
  const entries = Object.entries(metadata);
  const [metaOpen, setMetaOpen] = useState(true);

  if (entries.length === 0) return null;

  return (
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
          {entries.map(([key, value]) => (
            <div
              key={key}
              className={`flex flex-col gap-1 ${key === 'summary' ? 'col-span-full' : ''}`}
            >
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                {key}
              </label>
              {key === 'summary' ? (
                <textarea
                  value={value ?? ''}
                  rows={6}
                  onChange={(e) => onMetadataChange({ ...metadata, [key]: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              ) : (
                <input
                  type="text"
                  value={value ?? ''}
                  onChange={(e) => onMetadataChange({ ...metadata, [key]: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

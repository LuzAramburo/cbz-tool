import { useState } from 'react';
import { useCbzUpload } from './hooks/useCbzUpload';
import FileUpload from './components/FileUpload';
import PageList from './components/PageList';
import UploadBookModal from './components/UploadBookModal';
import AddPagesModal from './components/AddPagesModal';

export default function App() {
  const { upload, removePage, addPages, book, loading, error } = useCbzUpload();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addPagesModalOpen, setAddPagesModalOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
    return isDark;
  });

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  async function handleUploadAndClose(file: File) {
    if (await upload(file)) setUploadModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">CBZ Tool</h1>
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className="cursor-pointer p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {dark ? (
            /* Sun icon */
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon icon */
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        {!book ? (
          <FileUpload onUpload={upload} loading={loading} />
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setUploadModalOpen(true)}
              disabled={loading}
              className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Upload New Book
            </button>
            <button
              onClick={() => setAddPagesModalOpen(true)}
              disabled={loading}
              className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add Pages
            </button>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {book && (
          <div
            className={`transition-opacity ${loading ? 'opacity-40 select-none cursor-not-allowed *:pointer-events-none' : ''}`}
          >
            <PageList book={book} onRemovePage={removePage} />
          </div>
        )}
      </main>

      {uploadModalOpen && (
        <UploadBookModal
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadAndClose}
          loading={loading}
        />
      )}

      {addPagesModalOpen && book && (
        <AddPagesModal
          onClose={() => setAddPagesModalOpen(false)}
          onAddPages={addPages}
          loading={loading}
          totalPages={book.pageCount}
        />
      )}
    </div>
  );
}

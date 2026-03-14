import { useState, useEffect } from 'react';
import { useCbzUpload } from './hooks/useCbzUpload';
import FileUpload from './components/FileUpload';
import PageList from './components/PageList';
import UploadBookModal from './components/UploadBookModal';
import AddPagesModal from './components/AddPagesModal';
import ActionBar from './components/ActionBar';

export default function App() {
  const { upload, removePage, addPages, book, loading, error } = useCbzUpload();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addPagesModalOpen, setAddPagesModalOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
    return isDark;
  });

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    function onScroll() {
      const docHeight = document.documentElement.scrollHeight;
      const scrolled = window.scrollY;
      setShowScrollTop(docHeight > 800 && scrolled >= docHeight * 0.4);
      setShowStickyBar(scrolled >= window.innerHeight);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        {!book ? (
          <FileUpload onUpload={upload} loading={loading} />
        ) : (
          <ActionBar
            loading={loading}
            onUploadClick={() => setUploadModalOpen(true)}
            onAddPagesClick={() => setAddPagesModalOpen(true)}
          />
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

      {book && (
        <div
          className={`fixed left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-3 shadow-sm duration-500 transition-all ${showStickyBar ? 'top-0' : '-top-full'}`}
        >
          <ActionBar
            loading={loading}
            onUploadClick={() => setUploadModalOpen(true)}
            onAddPagesClick={() => setAddPagesModalOpen(true)}
          />
        </div>
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-all cursor-pointer ${showScrollTop ? 'opacity-100' : 'opacity-0'}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  );
}

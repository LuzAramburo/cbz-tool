import { useCbzUpload } from './hooks/useCbzUpload';
import FileUpload from './components/FileUpload';
import PageList from './components/PageList';

export default function App() {
  const { upload, removePage, book, loading, error } = useCbzUpload();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">CBZ Tool</h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        <FileUpload onUpload={upload} loading={loading} />

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
    </div>
  );
}

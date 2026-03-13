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

  async function handleUploadAndClose(file: File) {
    if (await upload(file)) setUploadModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">CBZ Tool</h1>
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

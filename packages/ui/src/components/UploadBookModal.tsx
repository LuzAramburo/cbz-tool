import { useEffect } from 'react';
import FileUpload from './FileUpload';
import CloseButton from './CloseButton.tsx';

interface UploadBookModalProps {
  onClose: () => void;
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function UploadBookModal({ onClose, onUpload, loading }: UploadBookModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Upload New Book
          </h2>
          <CloseButton onClose={onClose} />
        </div>
        <div className="p-6">
          <FileUpload onUpload={onUpload} loading={loading} />
        </div>
      </div>
    </div>
  );
}

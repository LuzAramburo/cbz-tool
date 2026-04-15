import { useState } from 'react';
import LoadingIcon from '../icons/LoadingIcon.tsx';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  loading: boolean;
}

export default function FileUpload({ onUpload, loading }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setFormatError(null);
      onUpload(files);
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (loading) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const invalid = files.filter((f) => !f.name.toLowerCase().endsWith('.cbz'));
    if (invalid.length > 0) {
      setFormatError(`Not a CBZ file: ${invalid.map((f) => f.name).join(', ')}`);
      return;
    }
    setFormatError(null);
    onUpload(files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!loading) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  const borderColor = dragging
    ? 'border-blue-500'
    : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-xl transition-colors ${borderColor}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {dragging ? 'Drop CBZ files here' : 'Drag & drop CBZ files, or click to select'}
      </p>
      {formatError && <p className="text-red-500 text-xs">{formatError}</p>}
      <label
        className={`cursor-pointer px-6 py-2 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {loading && <LoadingIcon />}
        {loading ? 'Uploading...' : 'Upload CBZ'}
        <input
          type="file"
          accept=".cbz"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </label>
    </div>
  );
}

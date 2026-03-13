import { useState } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function FileUpload({ onUpload, loading }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (loading) return;
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!loading) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  const borderColor = dragging ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-xl transition-colors ${borderColor}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <p className="text-gray-500 text-sm">
        {dragging ? 'Drop CBZ file here' : 'Drag & drop a CBZ file, or click to select'}
      </p>
      <label
        className={`cursor-pointer px-6 py-2 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {loading && (
          <svg className="inline-block mr-2 h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
            <g fill="#ffffff" fill-rule="evenodd" clip-rule="evenodd">
              <path
                d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"
                opacity=".2"
              />
              <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
            </g>
          </svg>
        )}
        {loading ? 'Uploading...' : 'Open CBZ'}
        <input
          type="file"
          accept=".cbz"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </label>
    </div>
  );
}

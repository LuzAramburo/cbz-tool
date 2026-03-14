import { useState, useRef, useEffect } from 'react';

interface AddPagesModalProps {
  onClose: () => void;
  onAddPages: (files: File[], insertAt: number) => Promise<void>;
  loading: boolean;
  totalPages: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AddPagesModal({ onClose, onAddPages, loading, totalPages }: AddPagesModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [insertAt, setInsertAt] = useState<number>(totalPages);
  const [dragOver, setDragOver] = useState(false);
  const [rejectedCount, setRejectedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = /\.(jpe?g|png|webp)$/i;

  function appendFiles(incoming: FileList | null) {
    if (!incoming) return;
    const all = Array.from(incoming);
    const accepted = all.filter((f) => ACCEPTED.test(f.name));
    const rejected = all.length - accepted.length;
    setRejectedCount(rejected);
    setStagedFiles((prev) => [...prev, ...accepted]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    appendFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    appendFiles(e.target.files);
    e.target.value = '';
  }

  function removeFile(idx: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleInsertAtChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseInt(e.target.value, 10);
    if (!isNaN(raw)) setInsertAt(Math.max(0, Math.min(totalPages, raw)));
  }

  async function handleSubmit() {
    if (stagedFiles.length === 0 || loading) return;
    await onAddPages(stagedFiles, insertAt);
    onClose();
  }

  const dropBorder = dragOver
    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Add Pages</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Drop zone */}
          <div
            className={`flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${dropBorder}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              {dragOver ? 'Drop images here' : 'Drag & drop images here, or click to browse'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Accepted: JPG, PNG, WEBP · Max 50 MB per file</p>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {rejectedCount > 0 && (
            <p className="text-red-500 text-xs">
              {rejectedCount} file{rejectedCount !== 1 ? 's were' : ' was'} skipped — only JPG, PNG, and WEBP are supported.
            </p>
          )}

          {/* Staged files */}
          {stagedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Staged files ({stagedFiles.length})
                </span>
                {stagedFiles.length > 1 && (
                  <button
                    onClick={() => setStagedFiles([])}
                    className="cursor-pointer text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ul className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
                {stagedFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{f.name}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs mr-2 flex-shrink-0">{formatSize(f.size)}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label={`Remove ${f.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Insert position */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Insert at position</label>
            <input
              type="number"
              min={0}
              max={totalPages}
              value={insertAt}
              onChange={handleInsertAtChange}
              className="w-24 px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              0 = beginning · {totalPages} = end · existing pages at this position will shift right
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={stagedFiles.length === 0 || loading}
            className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? 'Adding...' : stagedFiles.length > 0 ? `Add ${stagedFiles.length} Page${stagedFiles.length !== 1 ? 's' : ''}` : 'Add Pages'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import CloseIcon from './icons/CloseIcon.tsx';

interface BookMetadataProps {
  metadata: Record<string, string>;
  onMetadataChange: (metadata: Record<string, string>) => void;
}

export default function BookMetadata({ metadata, onMetadataChange }: BookMetadataProps) {
  const entries = Object.entries(metadata);
  const [metaOpen, setMetaOpen] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  useEffect(() => {
    if (addModalOpen || confirmDeleteKey !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [addModalOpen, confirmDeleteKey]);

  function handleAddConfirm() {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed in metadata) return;
    onMetadataChange({ ...metadata, [trimmed]: newValue });
    setNewKey('');
    setNewValue('');
    setAddModalOpen(false);
  }

  function handleAddCancel() {
    setNewKey('');
    setNewValue('');
    setAddModalOpen(false);
  }

  function handleDeleteConfirm() {
    if (confirmDeleteKey === null) return;
    const next = Object.fromEntries(
      Object.entries(metadata).filter(([k]) => k !== confirmDeleteKey)
    );
    onMetadataChange(next);
    setConfirmDeleteKey(null);
  }

  const addConfirmDisabled = newKey.trim() === '' || newKey.trim() in metadata;

  return (
    <>
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
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize flex items-center justify-between">
                  <label>{key}</label>
                  <button
                    onClick={() => setConfirmDeleteKey(key)}
                    className="cursor-pointer text-gray-300 dark:text-gray-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${key}`}
                  >
                    <span className="w-3.5 h-3.5 flex items-center">
                      <CloseIcon />
                    </span>
                  </button>
                </div>
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
            <div className="col-span-full pt-1">
              <button
                onClick={() => setAddModalOpen(true)}
                className="ml-auto cursor-pointer flex items-center gap-1.5 text-sm text-blue-300 hover:text-blue-300 border border-blue-300 rounded-lg px-4 py-2 dark:hover:text-blue-100 dark:hover:border-blue-100 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                Add property
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleAddCancel}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Add property
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Property name
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConfirm()}
                  autoFocus
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g. Genre"
                />
                {newKey.trim() !== '' && newKey.trim() in metadata && (
                  <p className="text-xs text-red-500">Property already exists.</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Value
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConfirm()}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g. Action"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button
                onClick={handleAddCancel}
                className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                disabled={addConfirmDisabled}
                className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteKey !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmDeleteKey(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-80 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Remove property
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remove property &ldquo;{confirmDeleteKey}&rdquo;?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <button
                onClick={() => setConfirmDeleteKey(null)}
                className="cursor-pointer px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="cursor-pointer px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

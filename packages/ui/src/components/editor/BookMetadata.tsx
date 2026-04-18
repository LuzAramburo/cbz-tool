import { useState, useEffect } from 'react';
import CloseIcon from '../icons/CloseIcon.tsx';
import Modal from '../modals/Modal.tsx';

interface BookMetadataProps {
  metadata: Record<string, string>;
  onMetadataChange: (metadata: Record<string, string>) => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
}

export default function BookMetadata({
  metadata,
  onMetadataChange,
  onSave,
  saving,
}: BookMetadataProps) {
  const entries = Object.entries(metadata);
  const [metaOpen, setMetaOpen] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  async function handleSave() {
    if (!onSave) return;
    await onSave();
    setSaved(true);
  }

  function handleAddConfirm() {
    const trimmed = newKey.trim().toLowerCase();
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
            <div className="col-span-full pt-1 flex items-center gap-4">
              <button
                onClick={() => setAddModalOpen(true)}
                className="btn btn-md btn-outline-blue flex items-center gap-1.5"
              >
                <span className="text-lg leading-none">+</span>
                Add property
              </button>
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-md btn-outline-blue flex items-center gap-1.5"
                >
                  {saving ? 'Saving...' : 'Save metadata'}
                </button>
              )}
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  Saved metadata successfully
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      {addModalOpen && (
        <Modal
          title="Add property"
          onClose={handleAddCancel}
          size="sm"
          footer={{
            confirmLabel: 'Add',
            onConfirm: handleAddConfirm,
            disabled: addConfirmDisabled,
          }}
        >
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddConfirm()}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="e.g. Action"
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteKey !== null && (
        <Modal
          title="Remove property"
          onClose={() => setConfirmDeleteKey(null)}
          size="sm"
          variant="plain"
          footer={{ confirmLabel: 'Remove', onConfirm: handleDeleteConfirm, danger: true }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remove property &ldquo;{confirmDeleteKey}&rdquo;?
          </p>
        </Modal>
      )}
    </>
  );
}

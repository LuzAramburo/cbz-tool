import { useState } from 'react';
import type { UploadResponse } from '../../types/cbz';
import PageThumbnail from './PageThumbnail.tsx';
import Modal from '../modals/Modal.tsx';
import ZoomModal from '../modals/ZoomModal.tsx';

interface PageGridProps {
  book: UploadResponse;
  onRemovePage: (index: number) => Promise<void>;
  onMovePage: (index: number, toIndex: number) => Promise<void>;
  onRemovePages?: (indices: number[]) => Promise<void>;
}

export default function PageGrid({ book, onRemovePage, onMovePage, onRemovePages }: PageGridProps) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const [moveToSource, setMoveToSource] = useState<number | null>(null);
  const [moveToValue, setMoveToValue] = useState('');

  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  function openMoveTo(index: number) {
    setMoveToSource(index);
    setMoveToValue(String(index + 1));
  }

  async function handleMoveTo() {
    if (moveToSource === null) return;
    const target = parseInt(moveToValue, 10) - 1;
    setMoveToSource(null);
    await handleMove(moveToSource, target);
  }

  async function handleConfirmRemove() {
    if (pendingIndex === null) return;
    setRemoving(true);
    await onRemovePage(pendingIndex);
    setRemoving(false);
    setPendingIndex(null);
  }

  async function handleMove(index: number, toIndex: number) {
    setMovingIndex(index);
    await onMovePage(index, toIndex);
    setMovingIndex(null);
  }

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIndices([]);
  }

  function toggleSelect(index: number) {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  async function handleConfirmBulkDelete() {
    if (!onRemovePages) return;
    setBulkDeleting(true);
    await onRemovePages(selectedIndices);
    setBulkDeleting(false);
    setConfirmBulkOpen(false);
    setSelectedIndices([]);
    setSelectMode(false);
  }

  const parsedTarget = parseInt(moveToValue, 10);
  const isValidTarget =
    moveToSource !== null &&
    !isNaN(parsedTarget) &&
    parsedTarget >= 1 &&
    parsedTarget <= book.pageCount &&
    parsedTarget - 1 !== moveToSource;

  const allSelected = selectedIndices.length === book.pages.length;

  return (
    <>
      {onRemovePages && (
        <div className="flex items-center gap-2">
          {selectMode && (
            <button
              onClick={() =>
                allSelected
                  ? setSelectedIndices([])
                  : setSelectedIndices(book.pages.map((p) => p.index))
              }
              className="btn btn-md btn-outline-gray"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
          {selectMode && selectedIndices.length > 0 && (
            <button onClick={() => setConfirmBulkOpen(true)} className="btn btn-md btn-danger">
              Delete ({selectedIndices.length})
            </button>
          )}
          <button
            onClick={toggleSelectMode}
            className={`btn btn-md ${selectMode ? 'btn-outline-red-active' : 'btn-outline-red'}`}
          >
            {selectMode ? 'Cancel' : 'Bulk delete pages'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {book.pages.map((page) => (
          <PageThumbnail
            key={page.filename}
            page={page}
            bookId={book.bookId}
            bookPageCount={book.pageCount}
            movingIndex={movingIndex}
            setPendingIndex={setPendingIndex}
            handleMove={handleMove}
            openMoveTo={openMoveTo}
            onZoom={setZoomIndex}
            selected={selectMode ? selectedIndices.includes(page.index) : undefined}
            onToggleSelect={selectMode ? toggleSelect : undefined}
          />
        ))}
      </div>

      {moveToSource !== null && (
        <Modal
          title={`Move page ${moveToSource + 1} to position`}
          onClose={() => setMoveToSource(null)}
          size="sm"
          variant="plain"
          footer={{ confirmLabel: 'Move', onConfirm: handleMoveTo, disabled: !isValidTarget }}
        >
          <input
            type="number"
            min={1}
            max={book.pageCount}
            value={moveToValue}
            onChange={(e) => setMoveToValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValidTarget && handleMoveTo()}
            className="px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Enter a page number between 1 and {book.pageCount}.
          </p>
        </Modal>
      )}

      {pendingIndex !== null && (
        <Modal
          title={`Remove page ${pendingIndex + 1}?`}
          onClose={() => setPendingIndex(null)}
          size="sm"
          variant="plain"
          footer={{
            confirmLabel: removing ? 'Removing…' : 'Remove',
            onConfirm: handleConfirmRemove,
            disabled: removing,
            danger: true,
          }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">This action can't be undone.</p>
        </Modal>
      )}

      {zoomIndex !== null && (
        <ZoomModal
          bookId={book.bookId}
          bookTitle={book.metadata?.['title'] || book.metadata?.['series'] || ''}
          pages={book.pages}
          initialIndex={zoomIndex}
          onClose={() => setZoomIndex(null)}
        />
      )}

      {confirmBulkOpen && (
        <Modal
          title={`Delete ${selectedIndices.length} page${selectedIndices.length !== 1 ? 's' : ''}?`}
          onClose={() => setConfirmBulkOpen(false)}
          size="sm"
          footer={{
            confirmLabel: 'Delete',
            onConfirm: handleConfirmBulkDelete,
            danger: true,
            loading: bulkDeleting,
            loadingLabel: 'Deleting...',
          }}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">This action can't be undone.</p>
        </Modal>
      )}
    </>
  );
}

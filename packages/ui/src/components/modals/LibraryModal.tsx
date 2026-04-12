import Modal from './Modal';
import BookLibrary from '../editor/BookLibrary';

interface LibraryModalProps {
  onClose: () => void;
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string, title: string) => void;
  refreshKey?: number;
  onEmpty?: () => void;
}

export default function LibraryModal({ onClose, onSelect, onDelete, refreshKey, onEmpty }: LibraryModalProps) {
  return (
    <Modal title="Open from Library" onClose={onClose} size="xl">
      <BookLibrary onSelect={onSelect} onDelete={onDelete} refreshKey={refreshKey} onEmpty={onEmpty} />
    </Modal>
  );
}

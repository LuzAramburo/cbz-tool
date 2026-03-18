import Modal from './Modal';
import BookLibrary from './BookLibrary';

interface LibraryModalProps {
  onClose: () => void;
  onSelect: (bookId: string) => void;
  onDelete: (bookId: string) => void;
}

export default function LibraryModal({ onClose, onSelect, onDelete }: LibraryModalProps) {
  return (
    <Modal title="Open from Library" onClose={onClose} size="xl">
      <BookLibrary onSelect={onSelect} onDelete={onDelete} />
    </Modal>
  );
}

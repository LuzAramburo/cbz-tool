import Modal from './Modal.tsx';
import FileUpload from './FileUpload';

interface UploadBookModalProps {
  onClose: () => void;
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function UploadBookModal({ onClose, onUpload, loading }: UploadBookModalProps) {
  return (
    <Modal title="Upload New Book" onClose={onClose}>
      <FileUpload onUpload={onUpload} loading={loading} />
    </Modal>
  );
}

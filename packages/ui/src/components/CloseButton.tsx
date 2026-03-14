import CloseIcon from './icons/CloseIcon.tsx';

export default function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="cursor-pointer text-gray-300 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      aria-label="Close"
    >
      <CloseIcon />
    </button>
  );
}

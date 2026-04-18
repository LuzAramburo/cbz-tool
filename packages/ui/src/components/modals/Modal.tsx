import { useEffect } from 'react';
import type { ReactNode } from 'react';
import CloseButton from './CloseButton.tsx';
import LoadingIcon from '../icons/LoadingIcon.tsx';

interface ModalFooter {
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

interface ModalProps {
  onClose: () => void;
  title?: string;
  footer?: ModalFooter;
  size?: 'sm' | 'lg' | 'xl';
  variant?: 'bordered' | 'plain';
  children: ReactNode;
}

export default function Modal({
  onClose,
  title,
  footer,
  size = 'lg',
  variant = 'bordered',
  children,
}: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const bordered = variant === 'bordered';
  const widthClass = size === 'xl' ? 'max-w-4xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full ${widthClass} mx-4 flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className={`flex items-center justify-between px-6 py-4 shrink-0${bordered ? ' border-b dark:border-gray-700' : ''}`}
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
            <CloseButton onClose={onClose} />
          </div>
        )}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto min-h-0">{children}</div>
        {footer && (
          <div
            className={`flex items-center justify-end gap-3 px-6 py-4 shrink-0${bordered ? ' border-t dark:border-gray-700' : ''}`}
          >
            <button
              onClick={onClose}
              className="btn btn-md btn-ghost-gray"
            >
              Cancel
            </button>
            <button
              onClick={footer.onConfirm}
              disabled={footer.disabled || footer.loading}
              className={`btn btn-md flex items-center ${footer.danger ? 'btn-danger' : 'btn-primary'}`}
            >
              {footer.loading && <LoadingIcon />}
              {footer.loading ? (footer.loadingLabel ?? footer.confirmLabel) : footer.confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

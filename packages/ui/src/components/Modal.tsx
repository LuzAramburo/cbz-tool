import { useEffect } from 'react';
import type { ReactNode } from 'react';
import CloseButton from './CloseButton.tsx';

interface ModalFooter {
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ModalProps {
  onClose: () => void;
  title?: string;
  footer?: ModalFooter;
  size?: 'sm' | 'lg';
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
  const widthClass = size === 'sm' ? 'max-w-sm' : 'max-w-lg';

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
              className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={footer.onConfirm}
              disabled={footer.disabled}
              className={`cursor-pointer px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                footer.danger
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300'
              }`}
            >
              {footer.confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

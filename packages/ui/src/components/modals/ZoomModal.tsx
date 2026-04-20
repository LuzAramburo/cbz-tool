import { useState, useEffect } from 'react';
import Modal from './Modal.tsx';
import ArrowLeftIcon from '../icons/ArrowLeftIcon.tsx';
import ArrowRightIcon from '../icons/ArrowRightIcon.tsx';
import LoadingIcon from '../icons/LoadingIcon.tsx';
import { PageInfo } from '../../types/cbz.ts';
import { getPageImageUrl } from '../../clients/booksClient.ts';

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative flex items-center justify-center min-h-[50vh] max-w-xl mx-auto">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <LoadingIcon />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`max-h-[70vh] max-w-full mx-auto object-contain rounded-lg transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

interface ZoomModalProps {
  bookId: string;
  bookTitle: string;
  pages: PageInfo[];
  initialIndex: number;
  onClose: () => void;
}

export default function ZoomModal({
  bookId,
  bookTitle,
  pages,
  initialIndex,
  onClose,
}: ZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const page = pages[currentIndex];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(pages.length - 1, i + 1));
      else if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pages.length, onClose]);

  const label = bookTitle ? `Page ${currentIndex + 1} – ${bookTitle}` : `Page ${currentIndex + 1}`;

  return (
    <Modal onClose={onClose} title={label} size="xl" variant="plain">
      <ZoomImage
        key={page.filename}
        src={getPageImageUrl(bookId, page.index, page.filename)}
        alt={page.filename}
      />
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
          className="btn btn-md btn-ghost-gray flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ArrowLeftIcon />
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {currentIndex + 1} / {pages.length}
        </span>
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          disabled={currentIndex === pages.length - 1}
          className="btn btn-md btn-ghost-gray flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ArrowRightIcon />
        </button>
      </div>
    </Modal>
  );
}

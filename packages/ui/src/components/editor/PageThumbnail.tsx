import LoadingIcon from '../icons/LoadingIcon.tsx';
import { PageInfo } from '../../types/cbz.ts';
import ArrowLeftIcon from '../icons/ArrowLeftIcon.tsx';
import ArrowRightIcon from '../icons/ArrowRightIcon.tsx';
import SwitchArrowsIcon from '../icons/SwitchIcon.tsx';
import TrashIcon from '../icons/TrashIcon.tsx';
import { getPageThumbnailUrl } from '../../clients/booksClient';

type Props = {
  page: PageInfo;
  bookId: string;
  bookPageCount: number;
  movingIndex: number | null;
  setPendingIndex: (index: number | null) => void;
  handleMove: (index: number, toIndex: number) => Promise<void>;
  openMoveTo: (index: number) => void;
  selected?: boolean;
  onToggleSelect?: (index: number) => void;
};

export default function PageThumbnail({
  page,
  bookId,
  bookPageCount,
  movingIndex,
  handleMove,
  openMoveTo,
  setPendingIndex,
  selected,
  onToggleSelect,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`relative group ${onToggleSelect ? 'cursor-pointer' : ''}`}
        onClick={onToggleSelect ? () => onToggleSelect(page.index) : undefined}
      >
        <img
          src={getPageThumbnailUrl(bookId, page.index, page.filename)}
          alt={page.filename}
          className={`w-full rounded-lg object-cover shadow transition-opacity ${selected ? 'opacity-70' : ''}`}
          loading="lazy"
        />
        {onToggleSelect && (
          <div
            className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              selected
                ? 'bg-blue-500 text-white'
                : 'bg-black/70 text-white/60 group-hover:bg-black/90'
            }`}
          >
            {selected && (
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        {movingIndex === page.index && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <LoadingIcon />
          </div>
        )}
        {!onToggleSelect && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 rounded-b-lg bg-black/50 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleMove(page.index, page.index - 1)}
              disabled={page.index === 0 || movingIndex !== null}
              className="cursor-pointer text-white hover:text-cyan-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move page left"
            >
              <ArrowLeftIcon />
            </button>
            <button
              onClick={() => handleMove(page.index, page.index + 1)}
              disabled={page.index === bookPageCount - 1 || movingIndex !== null}
              className="cursor-pointer text-white hover:text-cyan-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move page right"
            >
              <ArrowRightIcon />
            </button>
            <button
              onClick={() => openMoveTo(page.index)}
              disabled={movingIndex !== null}
              className="cursor-pointer text-white hover:text-cyan-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move to position"
            >
              <SwitchArrowsIcon />
            </button>
            <button
              onClick={() => setPendingIndex(page.index)}
              disabled={movingIndex !== null}
              className="cursor-pointer text-white hover:text-red-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove page"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>
      <span className="text-xs text-center text-gray-400 dark:text-gray-500">{page.index + 1}</span>
    </div>
  );
}

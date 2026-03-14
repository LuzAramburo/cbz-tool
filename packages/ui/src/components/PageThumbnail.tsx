import LoadingIcon from './LoadingIcon.tsx';
import { PageInfo } from '../types/cbz.ts';

type Props = {
  page: PageInfo;
  bookId: string;
  bookPageCount: number;
  movingIndex: number | null;
  setPendingIndex: (index: number | null) => void;
  handleMove: (index: number, toIndex: number) => Promise<void>;
  openMoveTo: (index: number) => void;
};

export default function PageThumbnail({
  page,
  bookId,
  bookPageCount,
  movingIndex,
  handleMove,
  openMoveTo,
  setPendingIndex,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative group">
        <img
          src={`/api/cbz/${bookId}/page/${page.index}?v=${encodeURIComponent(page.filename)}`}
          alt={page.filename}
          className="w-full rounded-lg object-cover shadow"
          loading="lazy"
        />
        {movingIndex === page.index && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <LoadingIcon />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 rounded-b-lg bg-black/50 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleMove(page.index, page.index - 1)}
            disabled={page.index === 0 || movingIndex !== null}
            className="cursor-pointer text-white hover:text-cyan-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move page left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => handleMove(page.index, page.index + 1)}
            disabled={page.index === bookPageCount - 1 || movingIndex !== null}
            className="cursor-pointer text-white hover:text-cyan-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move page right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={() => openMoveTo(page.index)}
            disabled={movingIndex !== null}
            className="cursor-pointer text-white hover:text-cyan-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move to position"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M14.293 2.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L16.586 8H5a1 1 0 0 1 0-2h11.586l-2.293-2.293a1 1 0 0 1 0-1.414zm-4.586 10a1 1 0 0 1 0 1.414L7.414 16H19a1 1 0 1 1 0 2H7.414l2.293 2.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z" />
            </svg>
          </button>
          <button
            onClick={() => setPendingIndex(page.index)}
            disabled={movingIndex !== null}
            className="cursor-pointer text-white hover:text-red-300 hover:bg-black/50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Remove page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
      <span className="text-xs text-center text-gray-400 dark:text-gray-500">{page.index + 1}</span>
    </div>
  );
}

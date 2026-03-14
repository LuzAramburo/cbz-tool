import LoadingIcon from './icons/LoadingIcon.tsx';
import DownloadIcon from './icons/DownloadIcon.tsx';
import AddIcon from './icons/AddIcon.tsx';
import UploadIcon from './icons/UploadIcon.tsx';

interface ActionBarProps {
  loading: boolean;
  downloading: boolean;
  onUploadClick: () => void;
  onAddPagesClick: () => void;
  onDownloadClick: () => void;
}

export default function ActionBar({
  loading,
  downloading,
  onUploadClick,
  onAddPagesClick,
  onDownloadClick,
}: ActionBarProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onUploadClick}
        disabled={loading}
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
      >
        <UploadIcon />
        Upload New Book
      </button>
      <button
        onClick={onAddPagesClick}
        disabled={loading}
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
      >
        <AddIcon />
        Add Pages
      </button>
      <button
        onClick={onDownloadClick}
        disabled={loading || downloading}
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
      >
        {downloading ? <LoadingIcon /> : <DownloadIcon />}
        {downloading ? 'Downloading…' : 'Download Book'}
      </button>
    </div>
  );
}

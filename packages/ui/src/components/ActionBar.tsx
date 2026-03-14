import LoadingIcon from './LoadingIcon';

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
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Upload New Book
      </button>
      <button
        onClick={onAddPagesClick}
        disabled={loading}
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Add Pages
      </button>
      <button
        onClick={onDownloadClick}
        disabled={loading || downloading}
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {downloading && <LoadingIcon />}
        {downloading ? 'Downloading…' : 'Download Book'}
      </button>
    </div>
  );
}

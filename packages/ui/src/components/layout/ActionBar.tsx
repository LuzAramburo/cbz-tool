import LoadingIcon from '../icons/LoadingIcon.tsx';
import DownloadIcon from '../icons/DownloadIcon.tsx';
import AddIcon from '../icons/AddIcon.tsx';
import UploadIcon from '../icons/UploadIcon.tsx';

interface ActionBarProps {
  loading: boolean;
  downloading: boolean;
  onUploadClick: () => void;
  onLibraryClick: () => void;
  onAddPagesClick: () => void;
  onDownloadClick: () => void;
}

export default function ActionBar({
  loading,
  downloading,
  onUploadClick,
  onLibraryClick,
  onAddPagesClick,
  onDownloadClick,
}: ActionBarProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onUploadClick}
        disabled={loading}
        className="btn btn-md btn-primary hover:shadow-md flex items-center"
      >
        <UploadIcon />
        Upload New Book
      </button>
      <button
        onClick={onLibraryClick}
        disabled={loading}
        className="btn btn-md btn-primary hover:shadow-md flex items-center"
      >
        <svg className="inline-block mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        Open from Library
      </button>
      <button
        onClick={onAddPagesClick}
        disabled={loading}
        className="btn btn-md btn-primary hover:shadow-md flex items-center"
      >
        <AddIcon />
        Add Pages
      </button>
      <button
        onClick={onDownloadClick}
        disabled={loading || downloading}
        className="btn btn-md btn-primary hover:shadow-md flex items-center"
      >
        {downloading ? <LoadingIcon /> : <DownloadIcon />}
        {downloading ? 'Downloading…' : 'Download Book'}
      </button>
    </div>
  );
}

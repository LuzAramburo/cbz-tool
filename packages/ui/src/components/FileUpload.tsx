interface FileUploadProps {
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function FileUpload({ onUpload, loading }: FileUploadProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
      <p className="text-gray-500 text-sm">Select a CBZ file to get started</p>
      <label className={`cursor-pointer px-6 py-2 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
        {loading ? 'Uploading...' : 'Open CBZ'}
        <input
          type="file"
          accept=".cbz"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </label>
    </div>
  );
}

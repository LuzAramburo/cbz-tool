import MergeIcon from '../components/icons/MergeIcon';

export default function MergeView() {
  return (
    <main className="flex flex-col items-center justify-center px-6 py-20 gap-6 text-center">
      <MergeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Merge Books</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Coming soon</p>
      </div>
    </main>
  );
}

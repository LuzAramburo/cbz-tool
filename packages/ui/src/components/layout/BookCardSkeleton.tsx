interface BookCardSkeletonProps {
  compact?: boolean;
}

export default function BookCardSkeleton({ compact }: BookCardSkeletonProps) {
  return (
    <div className="flex items-stretch bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className={`w-20 shrink-0 bg-gray-200 dark:bg-gray-700 animate-pulse${compact ? ' min-h-18' : ' h-28'}`}
      />
      <div
        className={`flex flex-col justify-center px-3 py-2 min-w-0 flex-1${compact ? ' gap-1.5' : ' gap-2'}`}
      >
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4 mt-1" />
      </div>
    </div>
  );
}

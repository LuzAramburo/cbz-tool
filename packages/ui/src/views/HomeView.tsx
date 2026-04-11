import { useLocation } from 'wouter';
import PencilIcon from '../components/icons/PencilIcon';
import MergeIcon from '../components/icons/MergeIcon';

const FEATURES = [
  {
    label: 'Edit Book',
    description: 'Upload a CBZ, reorder pages, and edit metadata',
    href: '/editor',
    Icon: PencilIcon,
  },
  {
    label: 'Merge Books',
    description: 'Combine multiple books into one',
    href: '/merge',
    Icon: MergeIcon,
  },
] as const;

export default function HomeView() {
  const [, navigate] = useLocation();

  return (
    <main className="flex flex-col items-center justify-center px-6 py-20 gap-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          What would you like to do?
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Choose a tool to get started</p>
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {FEATURES.map(({ label, description, href, Icon }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className="group cursor-pointer flex flex-col items-center justify-center gap-5 w-56 h-56 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <Icon className="w-16 h-16 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-center px-4">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

import { Link, useLocation } from 'wouter';
import ToggleThemeButton from './ToggleThemeButton';

interface NavHeaderProps {
  dark: boolean;
  toggleDark: () => void;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Editor', href: '/editor' },
  { label: 'Merge', href: '/merge' },
] as const;

export default function NavHeader({ dark, toggleDark }: NavHeaderProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-3 flex items-center justify-between">
      <Link
        href="/"
        className="text-xl font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        CBZ Tool
      </Link>

      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <ToggleThemeButton dark={dark} toggleDark={toggleDark} />
    </header>
  );
}

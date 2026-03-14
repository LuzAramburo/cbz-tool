import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  // Base JS rules for all packages
  js.configs.recommended,

  // TypeScript rules for ui
  ...tseslint.configs.recommended,

  // Node globals for desktop (Electron main process)
  {
    files: ['packages/desktop/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // React rules only for ui
  {
    files: ['packages/ui/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
    },
  },

  // Ignore build artifacts
  {
    ignores: ['**/public/**', '**/node_modules/**', '**/dist/**'],
  },
];
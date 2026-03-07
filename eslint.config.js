import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    // Base JS rules for all packages
    js.configs.recommended,

    // TypeScript rules for ui
    ...tseslint.configs.recommended,

    // React rules only for ui
    {
        files: ['packages/ui/src/**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': 'warn'
        }
    },

    // Ignore build artifacts
    {
        ignores: ['**/public/**', '**/node_modules/**', '**/dist/**']
    }
];
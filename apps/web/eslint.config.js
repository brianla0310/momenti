import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Rule sets come from the plugins' own presets — never a hand-picked subset.
// react-hooks/flat.recommended is the whole v7 set (rules-of-hooks +
// exhaustive-deps + the React Compiler rules: static-components, refs, purity,
// set-state-in-effect, …); copying two of its rules by hand silently dropped
// the rest. Severities stay as each preset ships them.
export default defineConfig([
  globalIgnores(['dist', 'coverage', '.vitest']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser,          // browser-only app: `process`/`require` stay undefined
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    // Fast Refresh boundary rule — only files that can export a component
    files: ['**/*.{jsx,tsx}'],
    extends: [reactRefresh.configs.vite],
  },
  {
    // the only files that run in Node, not in the browser
    files: ['eslint.config.js', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
])

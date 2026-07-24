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
//
// RULES are matched by extension (blocks 1–3). GLOBALS are matched by execution
// environment (blocks 4–6) and those three blocks are MUTUALLY EXCLUSIVE.
// Flat config MERGES languageOptions.globals across every block that matches a
// file — it does not replace — so "apply browser everywhere, then override with
// node" leaves `window`/`document` defined in Node files. Each file must be
// claimed by exactly one globals block instead.
const TEST_FILES = ['**/*.{test,spec}.{js,jsx,ts,tsx}']
const NODE_CONFIG_FILES = ['eslint.config.js', 'vite.config.{js,ts}', 'vitest.config.{js,mjs,ts,mts}']

export default defineConfig([
  globalIgnores(['dist', 'coverage', '.vitest']),

  /* ── rules by extension ── */
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
  },
  {
    // Fast Refresh boundary rule — only files that can export a component
    files: ['**/*.{jsx,tsx}'],
    extends: [reactRefresh.configs.vite],
  },

  /* ── globals by execution environment (mutually exclusive) ── */
  {
    // the browser app itself: runs in the page. `process`/`require` stay undefined.
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: TEST_FILES,
    languageOptions: { globals: globals.browser },
  },
  {
    // Vitest specs: run in Vitest's default `node` environment, NOT in a browser.
    // No jsdom is configured, so `window`/`document` must stay undefined here —
    // otherwise a DOM reference lints clean and throws at run time. Vitest's own
    // describe/it/expect are imported explicitly, so no test globals are needed.
    files: TEST_FILES,
    languageOptions: { globals: globals.node },
  },
  {
    // build / lint config: runs in Node, never in the browser.
    files: NODE_CONFIG_FILES,
    languageOptions: { globals: globals.node },
  },
])

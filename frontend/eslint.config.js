import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    // SCRUM-63: archivos de configuración que corren en Node (no en el
    // navegador) — playwright.config.js, vite.config.js, etc. Necesitan
    // los globals de Node (`process`, `__dirname`, ...) en lugar de los
    // globals de browser que usa el resto del código fuente de React.
    files: ['playwright.config.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: '18.2' },
  },
  plugins: ['react-refresh'],
  rules: {
    // Vite Fast Refresh needs every exported symbol in a component file to
    // itself be a component; constant exports (tokens, helper functions
    // colocated with a component) are common in this codebase and safe.
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Props aren't typed via prop-types in this codebase.
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Utility modules, not routable page/feature components: theme/hf.jsx
      // is deliberately a shared bundle of small presentational components
      // plus the helpers that go with them (ageText, fmt, badge, ...), and
      // context files conventionally export both a Provider component and
      // a useX() consumer hook. Fast Refresh degrading to a full reload
      // when either changes is a minor DX cost, not a bug — restructuring
      // either file into single-export modules would be churn for no
      // runtime benefit.
      files: ['src/theme/**', 'src/context/**'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}

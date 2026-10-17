import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'prototype'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
        { selector: 'TSEnumDeclaration', message: 'Use a union of string literals instead of an enum.' },
        { selector: 'TSModuleDeclaration[kind="namespace"]', message: 'Use ES modules instead of a namespace.' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'default-case': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
);

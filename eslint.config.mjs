import globals from 'globals';
import pluginJs from '@eslint/js';
/* IMPORTANT: INITIALIZATION:
*   npm i eslint --save-dev
*   npx eslint --init */
export default [
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: 'req|res|next|err|e|error'
      }
      ],
      'no-console': 'warn',
      'prefer-destructuring': ['error', { 'object': true, 'array': false }],
      'class-methods-use-this': 'off',
      'consistent-return': 'off'
    }
  }
];
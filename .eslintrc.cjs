/* eslint-env node */

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'vue/attribute-hyphenation': 'off',
    'vue/multi-word-component-names': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': [
      'error',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: true },
    ],
    'prettier/prettier': [
      'error',
      {
        semi: false,
        singleQuote: true,
        endOfLine: 'auto',
      },
    ],
    'no-var': 2,
  },
}

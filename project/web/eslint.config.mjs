import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  nextjs: true,
  rules: {
    'node/prefer-global/process': ['off'],
    'no-console': ['off'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-async-promise-executor': 'off',
    'array-callback-return': 'off',
    'unused-imports/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'off',
    'style/multiline-ternary': 'off',
    'style/no-mixed-operators': 'off',
    'style/max-statements-per-line': 'off',
    'eqeqeq': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
    'prefer-regex-literals': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'ts/no-use-before-define': 'off',
    'no-empty-pattern': 'off',
  },
})

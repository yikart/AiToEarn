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
  },
})

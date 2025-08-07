import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  rules: {
    'no-void': ['off'],
    'dot-notation': ['off'],
    'new-cap': ['off'],
    'ts/no-unused-vars': ['warn', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
    'ts/consistent-type-imports': ['off'],
    'ts/no-inferrable-types': ['error', { ignoreProperties: true }],
    'ts/no-require-imports': ['warn'],
    'ts/no-var-requires': ['warn'],
    'ts/no-explicit-any': ['warn'],
    'jsdoc/require-returns-description': ['off'],
    'jsdoc/check-param-names': ['warn'],
    'node/prefer-global/buffer': ['off'],
    'node/prefer-global/process': ['off'],
    'no-console': ['warn'],
    'unused-imports/no-unused-vars': ['warn', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
  },
})

import antfu from '@antfu/eslint-config'
import * as nx from '@nx/eslint-plugin'
import importPlugin from 'eslint-plugin-import'

export default antfu(
  {
    formatters: true,
    ignores: [
      '**/dist',
    ],
    plugins: {
      imports: importPlugin,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.type=\'MemberExpression\'][callee.object.name=\'Logger\']',
          message: '禁止直接使用 Logger 的静态方法，请创建实例后使用（例如 this.logger.log()）。',
        },
      ],
      'no-void': ['off'],
      'dot-notation': ['off'],
      'new-cap': ['off'],
      'ts/no-unused-vars': ['warn', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      'ts/consistent-type-imports': ['off'],
      'ts/no-inferrable-types': ['error', { ignoreProperties: true }],
      'ts/no-explicit-any': ['warn'],
      'jsdoc/require-returns-description': ['off'],
      'node/prefer-global/buffer': ['off'],
      'node/prefer-global/process': ['off'],
      'no-console': ['error', { allow: [''] }],
      'imports/no-absolute-path': ['error'],
    },
  },
  ...nx.configs['flat/base'],
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
    ],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
          ],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: [
                '*',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {
    },
  },
)

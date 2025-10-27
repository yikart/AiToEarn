import baseConfig from '../../eslint.config.mjs'

export default baseConfig.append(
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
    ],
    rules: {
      'no-console': ['off'],
    },
  },
  {
    files: [
      '**/*.json',
    ],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
          ],
          checkObsoleteDependencies: false,
          checkVersionMismatches: false,
        },
      ],
    },
    languageOptions: {
      parser: (await import('jsonc-eslint-parser')),
    },
  },
)

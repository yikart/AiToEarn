import baseConfig from '../../eslint.config.mjs'

export default baseConfig.append(
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
            '{projectRoot}/vitest.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/**/*.{spec,test}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            '{projectRoot}/tests/**/*',
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

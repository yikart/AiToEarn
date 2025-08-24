import baseConfig from '../../eslint.config.mjs'

export default baseConfig.append(
  {
    rules: {
      'no-console': 'off', // Allow console statements in CLI application
    },
  },
)

module.exports = {
  extends: ['expo'],
  ignorePatterns: ['dist/', 'node_modules/', '.expo/', '*.config.js', 'babel.config.js'],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react-hooks/exhaustive-deps': 'warn',
  },
};
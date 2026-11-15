// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'vendor/*', 'lib/*', 'bin/*'],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      // La app lee SQLite de forma síncrona al montar cada pantalla, por lo
      // que cargar datos en un efecto es intencional.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

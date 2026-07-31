// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['ios/*', 'scripts/*', 'assets/*'],
  },
  {
    rules: {
      // False positive for React Native: apostrophes/quotes inside <Text> are
      // intended copy, not HTML-escaping mistakes. All 9 initial "errors" were
      // this rule firing on legit UI text.
      'react/no-unescaped-entities': 'off',
    },
  },
]);

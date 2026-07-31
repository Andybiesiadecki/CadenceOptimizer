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
  {
    // Jest test files: declare the test-runner globals so no-undef doesn't
    // flag describe/test/expect/jest/etc.
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
]);

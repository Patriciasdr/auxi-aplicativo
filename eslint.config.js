const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['.expo/**'],
    rules: {
      // Data fetching in effects is intentional in this client-only Expo app.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

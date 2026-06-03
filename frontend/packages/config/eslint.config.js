// Minimal flat-config ESLint shared across the workspace. Apps and packages
// can extend by importing this and spreading or overriding rules.
module.exports = {
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};

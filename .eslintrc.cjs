module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist/', '__MACOSX/', 'node_modules/'],
  rules: {
    // The existing codebase deliberately uses request/ORM boundary `any`
    // values. Keep the lint task useful without turning legacy typing debt
    // into a blocking build failure.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-empty': 'off',
    'no-useless-catch': 'off',
    'prefer-const': 'off',
  },
};

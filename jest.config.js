module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/__MACOSX/'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/utils/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};

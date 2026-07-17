module.exports = { preset: 'ts-jest', testEnvironment: 'node', setupFilesAfterEnv: ['<rootDir>/src/__tests__/utils/setup.ts'], collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'] };

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'core/**/*.(ts|js)',
    'crypto/**/*.(ts|js)',
    'wallet/**/*.(ts|js)',
    '!**/*.d.ts',
    '!**/*.test.(ts|js)',
    '!**/*.spec.(ts|js)',
    '!**/__mocks__/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 10000,
  setupFiles: [],
  clearMocks: true,
  restoreMocks: true
};

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
    '!src/**/*.test.(ts|js)',
    '!src/**/*.spec.(ts|js)',
    '!src/**/__mocks__/**/*'
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
  restoreMocks: true,
  moduleNameMapper: {
    '^@cryptopaygw/core$': '<rootDir>/../core/index.ts',
    '^bitcoinjs-lib$': '<rootDir>/src/__mocks__/bitcoinjs-lib.ts',
    '^axios$': '<rootDir>/src/__mocks__/axios.ts',
    '^bip32$': '<rootDir>/src/__mocks__/bip32.ts'
  }
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/evm-adapter',
    '<rootDir>/packages/utxo-adapter',
    {
      displayName: 'integration-tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      verbose: true,
      testTimeout: 30000, // Longer timeout for integration tests
      clearMocks: true,
      restoreMocks: true
    }
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,js}',
    'tests/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/*.test.{ts,js}',
    '!**/*.spec.{ts,js}',
    '!**/__mocks__/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov', 
    'html'
  ]
};

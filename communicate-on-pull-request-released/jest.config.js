module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  resetModules: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}

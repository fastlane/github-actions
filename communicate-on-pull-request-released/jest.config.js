module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  resetModules: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}

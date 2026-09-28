export default {
  testEnvironment: 'node',
  transform: {},
  globalSetup: './tests/setup/globalSetup.js',
  setupFiles: ['./tests/setup/env.js'],
  setupFilesAfterEnv: ['./tests/setup/afterEnv.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  maxWorkers: 1, // Run tests sequentially to avoid shared DB conflicts
};

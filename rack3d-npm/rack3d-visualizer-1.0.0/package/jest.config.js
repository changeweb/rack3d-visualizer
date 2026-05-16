export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/abstractions/**/*.js',
    'src/builders/**/*.js',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65
    }
  }
};

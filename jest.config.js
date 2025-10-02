module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    verbose: true,
    collectCoverage: false,
    coverageDirectory: 'coverage',
    testMatch: ['**/*.test.js'],
    setupFilesAfterEnv: [],
    // Suppress console logs during tests
    silent: false,
};


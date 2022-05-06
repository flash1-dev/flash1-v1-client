module.exports = {
  /* eslint-disable global-require */
  preset: 'ts-jest',
  roots: [
    '<rootDir>/__tests__',
  ],
  testRegex: '__tests__\\/.*\\.test\\.ts$',
  moduleFileExtensions: [
    'js',
    'ts',
    'json',
    'node',
  ],
  resetMocks: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 30000,
  name: 'v1-client',
};

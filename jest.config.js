/**
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/__mocks__'],
  coveragePathIgnorePatterns: ['./src/index.ts'],
}

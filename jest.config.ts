import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageDirectory: './report/coverage',
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts}'],
  verbose: true,
  rootDir: '.',
  roots: ['.'],
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
  coverageProvider: 'v8'
};

export default config;
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^@uw-flow/shared-types$": "<rootDir>/../shared-types/src/index.ts"
  },
  globals: {
    "ts-jest": {
      tsconfig: {
        strict: true,
        esModuleInterop: true,
        paths: {
          "@uw-flow/shared-types": ["../shared-types/src/index.ts"]
        }
      }
    }
  }
};

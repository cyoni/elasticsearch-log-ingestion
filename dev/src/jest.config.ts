import type { JestConfigWithTsJest } from "ts-jest";
import { pathsToModuleNameMapper } from "ts-jest";
const { compilerOptions } = require("./tsconfig.json");
const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  modulePaths: ["<rootDir>"],
  testPathIgnorePatterns: ["dist"],
  testTimeout: 101 * 1000,
};

export default jestConfig;

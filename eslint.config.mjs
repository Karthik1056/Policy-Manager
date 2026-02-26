import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Server-only / generated code (skip for frontend-focused linting):
    "app/api/**",
    "controller/**",
    "utils/**",
    "interface/**",
    "prisma/**",
    "app/generated/**",
  ]),
]);

export default eslintConfig;

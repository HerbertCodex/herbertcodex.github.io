import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * The design-limits gate: four bounds and two syntactic lies.
 *
 * These are not SOLID. They are measurable approximations of what SOLID
 * protects — a two-hundred-line function almost always violates single
 * responsibility, and the converse is not true. An imperfect gate that
 * really refuses something beats a principle nobody checks.
 *
 * The thresholds were measured on this repository rather than chosen in
 * advance: the observed maxima are complexity 7, 55 statements-worth of
 * body in `project-map.mjs`'s `main`, 3 parameters and depth 3. Each bound
 * sits one step above what the code needs today, so the first run is not
 * spent loosening them — a gate loosened once loosens again.
 *
 * Test blocks are exempt from the length limit only: a long scenario
 * describes a journey, it is not debt.
 */
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".output/**",
      ".vinxi/**",
      ".nitro/**",
      "agent-pipeline/**",
      "pipeline/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts,js,jsx,mjs}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      complexity: ["error", { max: 10 }],
      "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", { max: 4 }],
      "max-depth": ["error", { max: 4 }],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ClassDeclaration[superClass] MethodDefinition > FunctionExpression > BlockStatement > ThrowStatement",
          message:
            "Liskov: a method of a derived class that throws unconditionally breaks every caller holding the base. The inheritance is a lie — model the difference instead of inheriting it.",
        },
        {
          selector: "IfStatement > IfStatement.alternate > BinaryExpression[operator='instanceof']",
          message:
            "Open-closed: a chain of instanceof deciding behaviour forces this function to be reopened for every new case. Give the cases a shared shape and let them answer for themselves.",
        },
      ],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx,mjs}", "**/*.spec.{ts,tsx,mjs}"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
);

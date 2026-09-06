import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

/**
 * The unit runner.
 *
 * It is configured apart from `vite.config.ts` on purpose: the application
 * config loads the SolidStart and Nitro plugins, which build a server the
 * unit suite has no use for. Here Solid is compiled for the browser
 * conditions so that components render against real signals.
 */
export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
    alias: { "~": new URL("./src/", import.meta.url).pathname },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Routes are proven by the browser suite against the built site, which is a
      // declared test_suite replayed at closure. Counting them as uncovered here
      // would report a file that is proven, only elsewhere — and a threshold set
      // to absorb that noise stops refusing anything real.
      // `src/shared/*Page.tsx` joins that list for the same reason, not a new one:
      // decision 0009 replaced one route file per page with a single dynamic route,
      // which moved the screens out of `src/routes/` without moving them out of the
      // browser suite that proves them. The exclusion follows the screens; the
      // threshold is untouched, and every other file of `src/shared` is still counted.
      exclude: [
        "src/entry-client.tsx",
        "src/entry-server.tsx",
        "src/global.d.ts",
        "src/app.tsx",
        "src/routes/**",
        "src/shared/*Page.tsx",
      ],
      reporter: ["text", "lcov"],
      // Measured on this repository rather than chosen in advance. Lines,
      // functions and statements sit at 100% on the covered scope, so 90 leaves
      // one step of slack without stopping refusing. Branches sit at 50% because
      // v8 counts the closing line of each Solid component as an uncovered
      // branch — the two missing ones are `}` at Counter.tsx:16 and
      // StarterNote.tsx:21, artefacts of the JSX transform and not code a test
      // could reach. The bound is set just under that so the metric still moves
      // if a real branch goes untested.
      thresholds: { lines: 90, functions: 90, branches: 45, statements: 90 },
    },
  },
});

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
      // Screens are listed ONE BY ONE, never by a name pattern. A first attempt
      // excluded `src/shared/*Page.tsx`, and QA named the flaw before it bit: that
      // is a rule about NAMES, not about PROOF. It let `SiteBar.tsx` — a screen the
      // browser suite proves just as much — count as 0% one issue later, and it
      // would silently exempt any future file that happened to end in `Page.tsx`
      // without being proven anywhere.
      //
      // Each line below is a claim that the browser suite renders that file against
      // the built site. Adding one is a decision someone had to write, which is the
      // point: an exemption nobody had to justify is an exemption always taken.
      exclude: [
        "src/entry-client.tsx",
        "src/entry-server.tsx",
        "src/global.d.ts",
        "src/app.tsx",
        "src/routes/**",
        "src/shared/HomePage.tsx",
        "src/shared/WorksPage.tsx",
        "src/shared/JourneyPage.tsx",
        "src/shared/ContactPage.tsx",
        "src/shared/SiteBar.tsx",
        "src/shared/LanguageSwitch.tsx",
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

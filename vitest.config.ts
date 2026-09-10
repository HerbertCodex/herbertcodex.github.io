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
      // Les chemins suivent les ecrans : l'issue i-2q07 les deplace de
      // `src/shared` vers `src/features/<page>`, et une liste qui ne suit pas
      // laisse un ecran compter a 0 %. Mesure par Produit avant le travail :
      // sans ce deplacement, coverage sort a 89,96 % pour un seuil de 90, la
      // cause etant HomePage.tsx seul.
      //
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
        // Les routes sont nommees UNE A UNE, pour la raison que le paragraphe
        // ci-dessus donne deja : `src/routes/**` etait une regle sur un DOSSIER,
        // pas sur une preuve, et elle exemptait d avance toute route future sans
        // que personne ait a la justifier. La decision 0009 a d ailleurs deplace
        // les ecrans hors de ce dossier depuis que la ligne y a ete ecrite. Une
        // route ajoutee demain COMPTE, au lieu d etre exemptee d avance. Mesure
        // faite plutot que promise : une route neuve et courte ne fait pas
        // basculer un seuil global a elle seule, donc la porte ne mord pas a
        // coup sur. Ce qui change est qu il n existe plus d exemption que
        // personne n a eu a ecrire.
        "src/routes/index.tsx",
        "src/routes/[locale].tsx",
        "src/routes/[locale]/index.tsx",
        "src/routes/[locale]/[slug].tsx",
        "src/routes/[...404].tsx",
        "src/features/home/HomePage.tsx",
        "src/features/works/WorksPage.tsx",
        "src/features/journey/JourneyPage.tsx",
        "src/features/contact/ContactPage.tsx",
        "src/shared/SiteBar.tsx",
        "src/shared/LanguageSwitch.tsx",
      ],
      reporter: ["text", "lcov"],
      // Measured on this repository rather than chosen in advance, and measured
      // again on 2026-09-10 over the scope the exclusions above leave: statements
      // 94.76%, branches 77.53%, functions 96.42%, lines 96.19%. Each bound sits
      // a few points under its measure, so a real regression moves the metric
      // into a refusal instead of being absorbed by slack.
      //
      // Branches are the lowest of the four, and the uncovered ones are named
      // rather than guessed: src/shared/theme.ts at 58.33% — the `catch` that
      // answers a forbidden localStorage (line 47) and the absent-matchMedia
      // path of watchSystemTheme (lines 90-92), both reachable only from a
      // browser that refuses them — and src/shared/content.ts at 69.44%.
      //
      // The former bound of 45 was justified by `}` at Counter.tsx:16 and
      // StarterNote.tsx:21. Both files were deleted, so that justification named
      // nothing present in the repository: it could be neither checked nor
      // refuted, and a floor whose reason has gone is a floor nobody raises again.
      thresholds: { lines: 90, functions: 90, branches: 70, statements: 90 },
    },
  },
});

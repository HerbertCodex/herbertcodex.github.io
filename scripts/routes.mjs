import { PAGES, addressesToPrerender } from "../src/shared/pages.ts";

/**
 * The routes the build must prerender, and the deployment must answer.
 *
 * One source, three readers: the Nitro prerender list, the build check and
 * the smoke gate. Kept in three places these lists drift, and the drift is
 * invisible — a route dropped from the prerender list simply stops being
 * built, and nothing that reads a different list ever asks for it.
 *
 * Since the pages carry a different name in each language, that list is no
 * longer written here: it is derived from `src/shared/pages.ts`, so adding a
 * page is adding a row there and nothing else. An address written twice is
 * an address that can differ from itself, which is the whole failure this
 * file exists to prevent.
 *
 * The root is listed alongside the localized pages because it is served as a
 * file like any other: the deployment is static, so nothing answers a request
 * the build did not write. It belongs to no language, so no row carries it.
 *
 * The table is imported as TypeScript on purpose. Node strips its types, and
 * it must therefore reach no `.tsx` module, not even through a lazy import:
 * `vite.config.ts` bundles this file to read the list, and would compile the
 * JSX it found there with the wrong runtime.
 */
export const PRERENDERED = ["/", ...addressesToPrerender(PAGES)];

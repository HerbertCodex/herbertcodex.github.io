/**
 * The routes the build must prerender, and the deployment must answer.
 *
 * One source, three readers: the Nitro prerender list, the build check and
 * the smoke gate. Kept in three places these lists drift, and the drift is
 * invisible — a route dropped from the prerender list simply stops being
 * built, and nothing that reads a different list ever asks for it.
 *
 * The root is listed alongside the localized pages because it is served as a
 * file like any other: the deployment is static, so nothing answers a request
 * the build did not write.
 */
export const PRERENDERED = ["/", "/fr", "/en", "/fr/about", "/en/about"];

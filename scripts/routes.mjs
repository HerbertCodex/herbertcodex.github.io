/**
 * The routes the build must prerender, and the deployment must answer.
 *
 * One source, three readers: the Nitro prerender list, the build check and
 * the smoke gate. Kept in three places these lists drift, and the drift is
 * invisible — a route dropped from the prerender list simply stops being
 * built, and nothing that reads a different list ever asks for it.
 */
export const PRERENDERED = ["/", "/about"];

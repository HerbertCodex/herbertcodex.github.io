#!/usr/bin/env node
/**
 * Refuses a build that quietly dropped a route.
 *
 * `vite build` exits 0 on a route that does not compile and on one importing
 * a module that does not exist: the prerenderer skips it and the build
 * reports success. Measured here on 2026-09-04 — a syntactically invalid
 * `about.tsx` and a missing import both produced a green build whose
 * `.output/public` had no `/about` at all.
 *
 * A gate that cannot refuse what it is named for is worse than no gate,
 * since checking stops. This is what makes `build` refuse something.
 *
 * Usage: node scripts/check-build.mjs
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PRERENDERED } from "./routes.mjs";

const ROOT = ".output/public";

const missing = PRERENDERED.filter((route) => {
  const base = route === "/" ? ROOT : join(ROOT, route);
  return !existsSync(join(base, "index.html")) && !existsSync(`${base}.html`);
});

if (missing.length > 0) {
  console.error(`build: ${missing.length} declared route(s) were not prerendered.`);
  console.error("vite build exits 0 on a route it could not compile; this is where that is caught.\n");
  for (const route of missing) console.error(`  ${route}`);
  console.error("\nRun `pnpm run check` — the compiler names what the build swallowed.");
  process.exit(1);
}
console.log(`build: ${PRERENDERED.length} declared route(s) prerendered into ${ROOT}.`);

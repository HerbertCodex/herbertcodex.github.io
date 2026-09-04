#!/usr/bin/env node
/**
 * Proves the built site answers before anything is deployed.
 *
 * What it checks is deliberately narrow: that the prerendered pages exist,
 * are served, and carry their own content rather than an error page the
 * server returned with a 200. A smoke test that asserted more would fail for
 * reasons the browser suite already reports, and a gate that fails for
 * somebody else's reason gets rerun rather than read.
 *
 * Usage: node scripts/smoke.mjs
 */
import { existsSync } from "node:fs";
import { startServer } from "./serve-static.mjs";
import { PRERENDERED } from "./routes.mjs";

const ROOT = ".output/public";
const PORT = 41731;

/**
 * The pages the deployment must answer, with a marker proving the page is
 * the one that was asked for.
 */
const EXPECTED = PRERENDERED.map((path) => ({ path, contains: "<h1" }));

async function main() {
  if (!existsSync(ROOT)) {
    console.error(`${ROOT} not found. The smoke gate checks a build, so build first: pnpm run build`);
    process.exit(1);
  }

  const server = await startServer(ROOT, PORT);
  const failures = [];
  try {
    for (const page of EXPECTED) {
      const response = await fetch(`http://127.0.0.1:${PORT}${page.path}`);
      const body = await response.text();
      if (response.status !== 200) {
        failures.push(`${page.path} answered ${response.status}`);
        continue;
      }
      if (!body.includes(page.contains)) {
        failures.push(`${page.path} answered 200 but carries no ${page.contains}`);
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length > 0) {
    console.error(`smoke: ${failures.length} failure(s).`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(`smoke: ${EXPECTED.length} page(s) served from ${ROOT}, all answering.`);
}

await main();

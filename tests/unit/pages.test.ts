import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PRERENDERED } from "../../scripts/routes.mjs";
import {
  NAMED_PAGES,
  PAGES,
  addressOf,
  addressesToPrerender,
  pageForSlug,
  type Page,
  type PageKey,
} from "~/shared/pages";

function pageOf(key: PageKey): Page {
  const found = PAGES.find((page) => page.key === key);
  if (found === undefined) throw new Error(`the table carries no page named ${key}`);
  return found;
}

function exitOfCompiling(row: string): { status: number; output: string } {
  const table = JSON.stringify(resolve("src/shared/pages"));
  const directory = mkdtempSync(join(tmpdir(), "pages-table-"));
  try {
    const fixture = join(directory, "row.ts");
    writeFileSync(fixture, `import type { Page } from ${table};\n\nexport const row: Page = ${row};\n`, "utf8");
    const run = spawnSync(
      "node_modules/.bin/tsc",
      ["--noEmit", "--strict", "--target", "esnext", "--module", "esnext", "--moduleResolution", "bundler", fixture],
      { encoding: "utf8" },
    );
    return { status: run.status ?? 1, output: `${run.stdout ?? ""}${run.stderr ?? ""}` };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("the table of pages", () => {
  it("carries home under an empty name, read like the other three", () => {
    const home = pageOf("home");

    expect(home.slugs).toEqual({ fr: "", en: "" });
    expect(addressOf(home, "fr")).toBe("/fr");
    expect(addressOf(home, "en")).toBe("/en");
    expect(addressesToPrerender(PAGES)).toEqual(expect.arrayContaining(["/fr", "/en"]));
  });

  it("is the sole source of the addresses the build must produce", () => {
    const extra: Page = { key: "works", slugs: { fr: "essai", en: "trial" } };

    expect(PRERENDERED).toEqual(["/", ...addressesToPrerender(PAGES)]);
    expect(addressesToPrerender([...PAGES, extra])).toEqual([...addressesToPrerender(PAGES), "/fr/essai", "/en/trial"]);
    expect(readFileSync("scripts/routes.mjs", "utf8")).not.toMatch(/["'`]\/(?:fr|en)\//);
  });

  it("keeps home out of the common route, which therefore produces no address for it", () => {
    expect(pageForSlug("fr", "")).toBeUndefined();
    expect(pageForSlug("en", "")).toBeUndefined();
    expect(NAMED_PAGES.map((page) => page.key)).not.toContain("home");
    expect(PRERENDERED).not.toContain("/fr/");
    expect(PRERENDERED).not.toContain("/en/");
  });

  it("refuses at compile time a page whose name is missing in one language", () => {
    const complete = exitOfCompiling(`{ key: "works", slugs: { fr: "essai", en: "trial" } }`);
    const missing = exitOfCompiling(`{ key: "works", slugs: { fr: "essai" } }`);

    expect(complete.status, complete.output).toBe(0);
    expect(missing.status).not.toBe(0);
    expect(missing.output).toContain("en");
  }, 120_000);
});

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { signatureAt } from "~/shared/SiteFooter";

/*
 * Le nom est écrit ICI, dans le test, et c'est le seul endroit où il l'est
 * deux fois : le test existe précisément pour exiger qu'il ne soit écrit
 * qu'une fois dans `src`. Le lire depuis la source qu'il vérifie rendrait
 * l'assertion vraie quelle que soit la source.
 */
const NAME = "Donatien Koffi";

const SOURCE = "src/shared/identity.ts";

const READERS = ["src/shared/SiteBar.tsx", "src/shared/SiteFooter.tsx"];

const MODULE = "~/shared/identity";

function filesUnder(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? filesUnder(path) : [path];
    });
}

function stating(text: string): string[] {
  return filesUnder("src").filter((path) => readFileSync(path, "utf8").includes(text));
}

describe("le nom que le site affiche", () => {
  it("n'est écrit en littéral qu'à un seul endroit de src", () => {
    expect(stating(NAME)).toEqual([SOURCE]);
  });

  it("est lu de là par la barre comme par le pied de page", () => {
    const readers = stating(MODULE);

    for (const reader of READERS) expect(readers).toContain(reader);
    expect(signatureAt(new Date("2031-03-03T10:00:00"))).toContain(NAME);
  });
});

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = "src";
const SHARED = "src/shared";

const MOVED = [
  "src/features/home/HomePage.tsx",
  "src/features/works/WorksPage.tsx",
  "src/features/journey/JourneyPage.tsx",
  "src/features/contact/ContactPage.tsx",
  "src/features/works/WorkCard.tsx",
  "src/features/contact/ContactLinks.tsx",
];

const STARTER = ["src/components/Counter.tsx", "src/components/Counter.css", "src/shared/StarterNote.tsx"];

const DEMONSTRATION = "start.solidjs.com";

const FORBIDDEN_FROM_SHARED = ["src/features/", "src/routes/"];

const CODE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs)$/;

/*
 * Un seul motif pour les trois formes qu'un specificateur prend — `from "x"`,
 * `import "x"` et `import("x")` — parce que le critere porte sur la CIBLE et
 * non sur la forme. Un troisieme motif de plus n'ajouterait qu'une facon de
 * plus de rater la meme chose.
 */
const SPECIFIER = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((entry) => {
      const path = join(dir, entry).split("\\").join("/");
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

/*
 * Le specificateur est ramene a un chemin du depot, jamais compare tel quel :
 * `~/features/works/WorksPage` et `../features/works/WorksPage` designent le
 * meme fichier, et une comparaison de chaines n'en refuserait qu'un des deux.
 */
function targetOf(specifier: string, from: string): string | null {
  if (specifier.startsWith("~/")) return join(SOURCE, specifier.slice(2)).split("\\").join("/");
  if (specifier.startsWith("."))
    return relative(".", resolve(dirname(from), specifier))
      .split("\\")
      .join("/");
  return null;
}

function crossingsOf(path: string): string[] {
  const body = readFileSync(path, "utf8");
  return [...body.matchAll(SPECIFIER)]
    .map((match) => targetOf(match[1], path))
    .filter((target): target is string => target !== null)
    .filter((target) => FORBIDDEN_FROM_SHARED.some((layer) => target.startsWith(layer)))
    .map((target) => `${path} -> ${target}`);
}

describe("le rangement des sources", () => {
  it("donne un dossier à chaque page, et y met ce qui n'appartient qu'à elle", () => {
    expect(MOVED.filter((path) => !existsSync(path))).toEqual([]);
  });

  it("ne laisse plus aucun écran dans le répertoire partagé", () => {
    const screens = walk(SHARED).filter(
      (path) => path.endsWith("Page.tsx") || path === `${SHARED}/WorkCard.tsx` || path === `${SHARED}/ContactLinks.tsx`,
    );

    expect(screens).toEqual([]);
  });

  it("tient la direction de dépendance par le code : le partagé ne connaît aucune page", () => {
    const crossings = walk(SHARED)
      .filter((path) => CODE.test(path))
      .flatMap(crossingsOf);

    expect(crossings).toEqual([]);
  });

  it("ne garde du gabarit de démonstration ni le renvoi ni les fichiers", () => {
    const citing = walk(SOURCE).filter((path) => readFileSync(path, "utf8").includes(DEMONSTRATION));

    expect(citing).toEqual([]);
    expect(STARTER.filter((path) => existsSync(path))).toEqual([]);
  });
});

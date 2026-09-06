import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentFor, missingRequiredFields, type Content, type Work } from "~/shared/content";

const CONTENT = "src/shared/content";
const FRENCH_FILE = "src/shared/content/fr.ts";
const DICTIONARIES = "src/shared/i18n.ts";

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

function sourcesOutsideContent(): { path: string; body: string }[] {
  return filesUnder("src")
    .filter((path) => !path.startsWith(CONTENT))
    .map((path) => ({ path, body: readFileSync(path, "utf8") }));
}

function longTextsOf(content: Content): string[] {
  return [
    ...content.works.flatMap((work) => [work.title, work.problem, work.did, work.diagram?.alt ?? ""]),
    ...content.journey.experiences.flatMap((experience) => [experience.role, experience.summary]),
  ].filter((text) => text.length > 0);
}

function contentGateAfter(edit: (body: string) => string): number {
  const original = readFileSync(FRENCH_FILE, "utf8");
  try {
    writeFileSync(FRENCH_FILE, edit(original), "utf8");
    return spawnSync("pnpm", ["run", "check:content"], { encoding: "utf8" }).status ?? 1;
  } finally {
    writeFileSync(FRENCH_FILE, original, "utf8");
  }
}

describe("le contenu éditorial", () => {
  it("porte le texte long des réalisations et du parcours dans un fichier par langue, hors des composants", () => {
    const french = contentFor("fr");
    const english = contentFor("en");

    expect(french.works).toHaveLength(4);
    expect(english.works.map((work) => work.id)).toEqual(french.works.map((work) => work.id));
    expect(english.works.map((work) => work.problem)).not.toEqual(french.works.map((work) => work.problem));
    expect(french.journey.experiences.length).toBeGreaterThan(0);
    expect(english.journey.experiences.map((row) => row.id)).toEqual(french.journey.experiences.map((row) => row.id));

    const elsewhere = sourcesOutsideContent();
    expect(elsewhere.length).toBeGreaterThan(0);
    for (const text of [...longTextsOf(french), ...longTextsOf(english)]) {
      for (const source of elsewhere) expect(source.body, source.path).not.toContain(text);
    }
  });

  it("accepte une réalisation de plus sans qu'aucun composant change", () => {
    const french = contentFor("fr");
    const added: Work = {
      id: "essai",
      provenance: { kind: "personal", openSource: false },
      links: [],
      title: "Une réalisation ajoutée au seul fichier de contenu",
      problem: "Le contenu doit pouvoir grandir sans qu'un composant bouge.",
      did: "Ajouté une entrée au fichier de la langue, et rien d'autre.",
      tools: ["Node.js"],
    };
    const grown: Content = { ...french, works: [...french.works, added] };

    expect(missingRequiredFields(grown)).toEqual([]);
    expect(grown.works).toHaveLength(french.works.length + 1);

    const components = sourcesOutsideContent().filter((source) => source.path.endsWith(".tsx"));
    expect(components.length).toBeGreaterThan(0);
    for (const source of components) {
      for (const work of french.works) expect(source.body, source.path).not.toContain(work.id);
    }
  });

  it("ne fait transiter aucun texte long par les dictionnaires de la bibliothèque d'internationalisation", () => {
    const dictionaries = readFileSync(DICTIONARIES, "utf8");
    for (const locale of ["fr", "en"] as const) {
      for (const text of longTextsOf(contentFor(locale))) expect(dictionaries, locale).not.toContain(text);
    }

    for (const path of filesUnder(CONTENT)) {
      expect(readFileSync(path, "utf8"), path).not.toContain("@solid-primitives/i18n");
    }
    const gate = readFileSync("src/shared/content.ts", "utf8");
    expect(gate).not.toContain("@solid-primitives/i18n");
    expect(gate).not.toMatch(/^import\s+\{[^}]*\}\s+from\s+"\.\/i18n"/m);
  });

  it("refuse un champ obligatoire absent ou vide plutôt que de l'afficher vide", () => {
    const french = contentFor("fr");
    expect(missingRequiredFields(french)).toEqual([]);
    expect(missingRequiredFields(contentFor("en"))).toEqual([]);

    const blank: Content = { ...french, works: [{ ...french.works[0], title: "   " }, ...french.works.slice(1)] };
    expect(missingRequiredFields(blank)).toContain("works[0].title");

    const empty: Content = { ...french, works: [{ ...french.works[0], tools: [] }, ...french.works.slice(1)] };
    expect(missingRequiredFields(empty)).toContain("works[0].tools");

    const absent = {
      ...french,
      journey: { ...french.journey, education: [{ ...french.journey.education[0], institution: undefined }] },
    } as unknown as Content;
    expect(missingRequiredFields(absent)).toContain("journey.education[0].institution");
  });

  it("fait sortir la porte du contenu en 1 sur une tournure d'attente plantée, et en 0 une fois retirée", () => {
    const waiting = contentFor("fr").works[0].title;

    const planted = contentGateAfter((body) => body.replace(waiting, "à renseigner"));
    const removed = contentGateAfter((body) => body);

    expect(planted).toBe(1);
    expect(removed).toBe(0);
  }, 180_000);
});

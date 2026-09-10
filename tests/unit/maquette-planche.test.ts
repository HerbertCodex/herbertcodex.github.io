import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DICTIONARIES, LOCALES } from "~/shared/i18n";

const PLANCHE = "mockups/accueil-contact.html";

const PROJET = "mockups/portfolio-v1.html";

const INTROUVABLE = "mockups/introuvable.html";

/*
 * Les quatre valeurs du pied sont NOMMÉES ici et LUES dans la maquette du
 * projet, jamais recopiées : un pied transcrit doit rester un pied transcrit,
 * et deux maquettes qui redisent le même cadre ne peuvent pas le redire
 * différemment sans que ce test le voie.
 */
const TRANSCRIBED = ["border-top", "margin-top", "padding-top", "padding-bottom"];

/*
 * Les quatre valeurs de rythme que la planche déclarait déjà. Aligner un écran
 * sur sa maquette tout en réécrivant la maquette serait circulaire : une
 * planche ajustée au code validerait exactement la dérive qu'on répare.
 */
const UNCHANGED: readonly (readonly [string, string])[] = [
  [".bar", "margin-bottom: var(--space-5)"],
  ["h1", "margin: 0 0 var(--space-3)"],
  [".lede", "margin: 0 0 var(--space-4)"],
  [".facts", "margin: 0 0 var(--space-5)"],
];

/*
 * Les mots que la phrase doit porter ENSEMBLE, dans un seul commentaire :
 * éparpillés dans le fichier ils ne disent plus rien. C'est une phrase qui est
 * demandée et non un dessin, parce qu'une planche montre des écrans encadrés
 * et que la descente du pied se prouve par la suite de navigateur.
 */
const SPOKEN = ["pied", "ferme", "fenêtre", "courte"];

/*
 * Une longueur relative à la hauteur de l'écran, sous n'importe laquelle de
 * ses quatre unités : une planche qui en déclare une suppose une fenêtre.
 */
const WINDOW_HEIGHT = /\d\s*[dsl]?vh\b/;

/*
 * Les déclarations d'une règle, prise à sa ligne d'ouverture. Chacun des
 * sélecteurs lus ici n'ouvre qu'une seule règle dans sa feuille, et aucun
 * n'apparaît sous cette forme dans le balisage.
 */
function declaredBy(sheet: string, selector: string): string[] {
  const after = sheet.split(`${selector} {`)[1] ?? "";
  return after
    .slice(0, after.indexOf("}"))
    .split(";")
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration.length > 0);
}

/* Les commentaires d'une feuille, un par bloc, tels qu'ils sont écrits. */
function notesOf(sheet: string): string[] {
  return [...sheet.matchAll(/\/\*[\s\S]*?\*\//g)].map((found) => found[0]);
}

describe("la planche de l'accueil et du contact", () => {
  it("donne un pied à chacun de ses deux écrans encadrés, aux valeurs que la maquette du projet déclare", () => {
    const drawn = readFileSync(PLANCHE, "utf8");
    const framed = [...new DOMParser().parseFromString(drawn, "text/html").querySelectorAll(".cadre")];
    const asked = declaredBy(readFileSync(PROJET, "utf8"), "footer").filter((declaration) =>
      TRANSCRIBED.includes(declaration.split(":")[0].trim()),
    );

    expect(asked.length, `les valeurs ${TRANSCRIBED.join(", ")} du pied de ${PROJET}`).toBe(TRANSCRIBED.length);
    expect(framed.map((screen) => screen.querySelector("footer") !== null)).toEqual([true, true]);
    for (const declaration of asked) {
      expect(declaredBy(drawn, "footer"), "le pied de la planche").toContain(declaration);
    }
  });

  it("dit en toutes lettres ce que le pied fait sur une page courte, et ne suppose aucune hauteur de fenêtre", () => {
    const drawn = readFileSync(PLANCHE, "utf8");
    const said = notesOf(drawn).filter((note) => SPOKEN.every((word) => note.toLowerCase().includes(word)));

    expect(said.length, `aucun commentaire ne porte ensemble : ${SPOKEN.join(", ")}`).toBeGreaterThan(0);
    expect(WINDOW_HEIGHT.test(drawn), "la planche déclare une hauteur relative à la fenêtre").toBe(false);
    expect(declaredBy(drawn, ".cadre").filter((one) => one.includes("height"))).toEqual([]);
  });

  it("ne déplace aucune des quatre valeurs de rythme qu'elle déclarait déjà", () => {
    const drawn = readFileSync(PLANCHE, "utf8");

    for (const [selector, declaration] of UNCHANGED) {
      expect(declaredBy(drawn, selector), `${selector} { ${declaration} }`).toContain(declaration);
    }
  });
});

/*
 * L'ecran introuvable a ete livre sans planche, en mode direct, et il est
 * reste le seul ecran du site qu'aucune maquette ne dessinait. Une reference
 * qui manque ne se voit pas : elle se decouvre le jour ou quelqu'un redessine
 * l'ecran de memoire. Ces trois assertions sont ce qui l'empeche de deriver a
 * son tour — elles confrontent le dessin aux dictionnaires et a la feuille,
 * jamais a des valeurs recopiees ici.
 */
describe("la planche de l'écran introuvable", () => {
  it("dessine les deux états, et le second seul est sans cadre", () => {
    const drawn = new DOMParser().parseFromString(readFileSync(INTROUVABLE, "utf8"), "text/html");
    const framed = [...drawn.querySelectorAll(".cadre")];

    expect(framed.length, "un cadre par état").toBe(2);
    expect(framed.map((screen) => screen.querySelector("header.bar") !== null)).toEqual([true, false]);
    expect(framed.map((screen) => screen.querySelector("footer") !== null)).toEqual([true, false]);
  });

  it("porte les mots des dictionnaires, et non des mots redessinés de mémoire", () => {
    const drawn = readFileSync(INTROUVABLE, "utf8");

    for (const locale of LOCALES) {
      for (const line of ["heading", "lede", "home"] as const) {
        expect(drawn, `${locale}.notFound.${line}`).toContain(DICTIONARIES[locale].notFound[line]);
      }
    }
  });

  it("donne son attribut lang à chaque moitié de l'état hors préfixe, comme l'écran le fait", () => {
    const drawn = new DOMParser().parseFromString(readFileSync(INTROUVABLE, "utf8"), "text/html");
    const bare = [...drawn.querySelectorAll(".cadre")][1];
    const halves = [...(bare?.querySelectorAll("[lang]") ?? [])];

    expect(halves.map((half) => half.getAttribute("lang"))).toEqual(["fr", "en", "fr", "en", "fr", "en"]);
    expect(halves[0]?.textContent).toBe(DICTIONARIES.fr.notFound.heading);
    expect(halves[1]?.textContent).toBe(DICTIONARIES.en.notFound.heading);
  });

  it("descend le titre par le même plancher que la feuille de l'écran, mesuré à 320 px", () => {
    const drawn = readFileSync(INTROUVABLE, "utf8");
    const sheet = readFileSync("src/features/not-found/NotFoundPage.css", "utf8");
    const asked = declaredBy(sheet, ".not-found h1").find((one) => one.startsWith("font-size"));

    expect(asked, "la feuille de l'écran déclare un font-size").toBeTruthy();
    expect(declaredBy(drawn, ".introuvable h1"), "le titre de la planche").toContain(asked);
  });
});

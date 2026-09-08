import { test, expect, type Page } from "@playwright/test";
import { LOCALES } from "../../src/shared/i18n";
import { PAGES, addressOf, type PageKey } from "../../src/shared/pages";

/* Les adresses des pages nommées, dans toutes les langues publiées. */
function addressesOf(...keys: readonly PageKey[]): string[] {
  return PAGES.filter((page) => keys.includes(page.key)).flatMap((page) =>
    LOCALES.map((locale) => addressOf(page, locale)),
  );
}

const HOMES = addressesOf("home");

/* Les quatre pages assez courtes pour tenir dans une fenêtre : l'accueil et le contact. */
const SHORT_PAGES = addressesOf("home", "contact");

/*
 * Une fenêtre PLUS COURTE que la plus courte des pages mesurées. Depuis que le
 * pied s'ancre, une page fait au moins la hauteur de la fenêtre : une hauteur
 * lue dans une fenêtre plus haute qu'elle est la hauteur de la FENÊTRE, et le
 * chiffre ne veut plus rien dire.
 */
const MEASURING = 400;

/*
 * Le bas du pied de l'accueil, largeur par largeur. Ce sont des MESURES prises
 * le 2026-09-08 sur l'artefact construit, écrites en clair : les recalculer
 * ici par la soustraction que la feuille applique ferait un test qui répète le
 * code au lieu de le contredire.
 *
 * 1278 annonçait 606 px jusqu'au 2026-09-08 et la CI l'a contredit à 584. Le
 * chiffre venait d'une station qui ne possède AUCUNE des quatre faces de
 * `--font-grotesk` et sert le site en DejaVu Sans, plus large qu'Arial : la
 * description de la cellule 02 y passe sur une seconde ligne, et `.entries`
 * fait 169 px au lieu de 147. L'écart de 22 px est exactement 606 - 584. Un
 * visiteur a Helvetica ou Arial, donc 584 est la hauteur vraie aux quatre
 * largeurs, et la station de mesure était le seul endroit où 606 existait.
 */
const ANNOUNCED: readonly (readonly [number, number])[] = [
  [1278, 584],
  [1440, 584],
  [1704, 584],
  [1920, 584],
];

/* Un nom qu'aucune machine ne peut résoudre, témoin de ce que vaut une face absente. */
const NO_SUCH_FACE = "Zzz No Such Face Zzz";

/* La largeur à laquelle la planche de l'accueil a été départagée. */
const DRAWN_AT = 1440;

/* La largeur, plus étroite, à laquelle l'accueil est annoncé 22 px plus haut. */
const NARROWER = 1278;

/*
 * La hauteur utile en dessous de laquelle aucune des quatre pages courtes ne
 * doit défiler. C'est la plus basse des hauteurs auxquelles le pied est déjà
 * prouvé, donc la seule où un dépassement de quelques pixels se verrait.
 */
const CRAMPED = 640;

const SCHEMES = ["light", "dark"] as const;

/*
 * Le bas du pied en coordonnées de DOCUMENT. La hauteur de défilement ne dit
 * plus la hauteur d'une page depuis que le pied s'ancre : dans une fenêtre
 * plus haute que la page, elle rend celle de la fenêtre.
 */
async function documentBottom(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const foot = document.querySelector("footer");
    return foot === null ? null : Math.round(foot.getBoundingClientRect().bottom + window.scrollY);
  });
}

/*
 * Si la machine résout vraiment `--font-grotesk`. Une hauteur au pixel près
 * n'a de sens que là où le texte est tracé dans la police que le site demande :
 * mesurée sur une station qui n'en possède aucune, elle décrit cette station
 * et personne d'autre. Le témoin est un nom inventé — si la pile complète
 * mesure comme lui, ses quatre faces se comportent comme des noms absents.
 */
async function stackResolves(page: Page): Promise<boolean> {
  return page.evaluate((absent) => {
    const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-grotesk");
    const rule = document.createElement("canvas").getContext("2d");
    if (rule === null) return false;
    const width = (font: string): number => {
      rule.font = `100px ${font}`;
      return rule.measureText("Où j'ai travaillé, ce que j'ai étudié").width;
    };
    const witness = width(absent);
    /* Un écart relatif, non absolu : deux mesures de la MÊME police diffèrent ici de 1 px sur 1682. */
    return Math.abs(width(stack) - witness) / witness > 0.01;
  }, NO_SUCH_FACE);
}

/*
 * Ce que les quatre pages courtes laissent dépasser de la fenêtre en cours.
 * Le parcours est sorti du test parce que `max-depth` refuserait le quatrième
 * niveau qu'il y formerait, et une porte contournée est une porte éteinte.
 */
async function overflowing(page: Page, where: string): Promise<string[]> {
  const said: string[] = [];

  for (const address of SHORT_PAGES) {
    await page.goto(address);
    const seen = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight,
      window: document.documentElement.clientHeight,
    }));

    if (seen.scroll !== seen.window) {
      said.push(`${address} à ${where} : ${seen.scroll} px de page pour ${seen.window} px de fenêtre`);
    }
  }
  return said;
}

test.describe("l'accueil reprend le rythme vertical de sa maquette", () => {
  test("la rangée de faits appelle les trois cellules au pas que la planche écrit, dans les deux langues", async ({
    page,
  }) => {
    await page.setViewportSize({ width: DRAWN_AT, height: MEASURING });
    await page.goto(HOMES[0]);
    /* Le pas est lu sur la page plutôt qu'écrit ici : déplacé dans les jetons, il déplace le rythme. */
    const step = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--space-5")),
    );
    const wrong: string[] = [];

    for (const address of HOMES) {
      await page.goto(address);
      const gap = await page.evaluate(() => {
        const facts = document.querySelector("main .facts");
        const cells = document.querySelector("main .entries");
        if (facts === null || cells === null) return null;
        return Math.round(cells.getBoundingClientRect().top - facts.getBoundingClientRect().bottom);
      });

      if (gap !== step) wrong.push(`${address} : ${gap} px sous la rangée de faits, au lieu de ${step}`);
    }

    expect(wrong).toEqual([]);
  });
});

test.describe("les hauteurs annoncées à l'opérateur sont mesurées", () => {
  test("le pied de l'accueil finit là où il est annoncé, aux quatre largeurs et dans les deux langues", async ({
    page,
  }) => {
    await page.setViewportSize({ width: DRAWN_AT, height: MEASURING });
    await page.goto(HOMES[0]);
    test.skip(
      !(await stackResolves(page)),
      "Cette machine ne résout aucune face de --font-grotesk : une hauteur au pixel près y décrirait sa police de secours, pas le site.",
    );

    const off: string[] = [];

    for (const [width, announced] of ANNOUNCED) {
      await page.setViewportSize({ width, height: MEASURING });

      for (const address of HOMES) {
        await page.goto(address);
        const bottom = await documentBottom(page);

        if (bottom !== announced) {
          off.push(`${address} à ${width} px : le pied finit à ${bottom} px, annoncé à ${announced} px`);
        }
      }
    }

    expect(off).toEqual([]);
  });

  test("aucune des quatre pages courtes ne défile, aux deux largeurs et dans les deux thèmes", async ({ page }) => {
    const scrolling: string[] = [];

    for (const scheme of SCHEMES) {
      await page.emulateMedia({ colorScheme: scheme });

      for (const width of [NARROWER, DRAWN_AT]) {
        await page.setViewportSize({ width, height: CRAMPED });
        scrolling.push(...(await overflowing(page, `${width} px en ${scheme}`)));
      }
    }

    expect(scrolling).toEqual([]);
  });
});

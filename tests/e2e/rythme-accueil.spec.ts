import { test, expect } from "@playwright/test";
import { LOCALES } from "../../src/shared/i18n";

/* La page de chaque langue. */
const PAGES = LOCALES.map((locale) => `/${locale}`);

/* La largeur à laquelle la planche de l'ouverture a été départagée. */
const DRAWN_AT = 1440;

/* La largeur, plus étroite, à laquelle les hauteurs étaient annoncées 22 px plus haut. */
const NARROWER = 1278;

/*
 * La hauteur utile la plus basse que l'opérateur a tranchée pour ce site. Elle
 * servait à exiger que quatre pages courtes ne défilent pas.
 */
const CRAMPED = 640;

const SCHEMES = ["light", "dark"] as const;

/*
 * Le critère signé au round 2 — « l'accueil et le contact tiennent sans
 * défilement dans une fenêtre de 640 px » — est ANNULÉ depuis le 2026-09-10 :
 * le site publie une page unique, qui défile par construction. Le document qui
 * le portait, docs/decisions/perimetre-approuve-rythme-vertical-round2.json,
 * porte l'amendement qui le dit.
 *
 * Ce qui reste de son intention est mesurable, et c'est ici : 640 px de fenêtre
 * doivent suffire à voir le travail, c'est-à-dire le premier bandeau de section.
 * Une ouverture qui pousserait les réalisations sous la ligne de flottaison
 * rendrait exactement le vide que ce critère refusait.
 */
test.describe("l'ouverture laisse voir le travail sans défilement", () => {
  test("le premier bandeau de section est visible dans 640 px, aux deux largeurs et dans les deux thèmes", async ({
    page,
  }) => {
    const hidden: string[] = [];

    for (const scheme of SCHEMES) {
      await page.emulateMedia({ colorScheme: scheme });

      for (const width of [NARROWER, DRAWN_AT]) {
        await page.setViewportSize({ width, height: CRAMPED });

        for (const address of PAGES) {
          await page.goto(address);
          const seen = await page.evaluate(() => {
            const head = document.querySelector("main .section-head");
            if (head === null) return null;
            return { bottom: Math.round(head.getBoundingClientRect().bottom), window: window.innerHeight };
          });

          if (seen === null) hidden.push(`${address} : aucun bandeau de section`);
          else if (seen.bottom > seen.window) {
            hidden.push(
              `${address} à ${width} px en ${scheme} : le bandeau finit à ${seen.bottom} px pour ${seen.window} px`,
            );
          }
        }
      }
    }

    expect(hidden).toEqual([]);
  });

  test("la dernière ligne de l'ouverture appelle le premier bandeau au pas qui sépare deux blocs", async ({ page }) => {
    await page.setViewportSize({ width: DRAWN_AT, height: 900 });
    await page.goto(PAGES[0]!);
    /*
     * Deux largeurs, et c'est ce qui fait mordre : à 1440 les faits sont la
     * colonne la plus basse, à 1024 c'est le chapô. Une seule des deux aurait
     * laissé passer une marge oubliée sur l'autre — mesuré en la remettant.
     */

    /*
     * Le pas est lu sur la page plutôt qu'écrit ici : déplacé dans les jetons,
     * il déplace le rythme. C'est --space-6, le pas entre deux BLOCS.
     *
     * Et la mesure part du BLOC, non de la rangée de faits : depuis que le
     * chapô et les faits sont côte à côte, le plus bas des deux dépend de la
     * largeur et de la langue. Mesurer l'un des deux serait mesurer un hasard.
     */
    const step = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--space-6")),
    );
    const wrong: string[] = [];

    for (const width of [DRAWN_AT, 1024]) {
      await page.setViewportSize({ width, height: 900 });

      for (const address of PAGES) {
        await page.goto(address);
        const gap = await page.evaluate(() => {
          const lede = document.querySelector("main .lede")?.getBoundingClientRect();
          const facts = document.querySelector("main .facts")?.getBoundingClientRect();
          const head = document.querySelector("main .section-head")?.getBoundingClientRect();
          if (lede === undefined || facts === undefined || head === undefined) return null;
          /*
           * La DERNIERE ENCRE des deux colonnes, et non le bord du bloc : une
           * marge oubliee sur l'une d'elles gonfle le bloc sans que son bord le
           * dise, et c'est pourtant ce que l'oeil voit. Mesure en remettant la
           * marge du chapo : le bord ne bougeait pas, l'ecart si.
           */
          return Math.round(head.top - Math.max(lede.bottom, facts.bottom));
        });

        if (gap !== step) {
          wrong.push(`${address} à ${width} px : ${gap} px sous la dernière ligne de l'ouverture, au lieu de ${step}`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  /*
   * Le chapô s'arrête à sa mesure de lecture — 64 caractères — et laissait
   * 500 px de vide à sa droite dans une colonne de 1392, alors que le titre,
   * les faits et les cartes prennent toute la largeur. Mesuré sur le site
   * publié, et signalé par l'opérateur.
   *
   * Les faits viennent l'occuper dès que la place existe, et repassent dessous
   * quand elle manque. Les deux largeurs encadrent le jeton --bp-lg.
   */
  test("les faits se posent à côté du chapô au-delà de la bascule, et dessous en deçà", async ({ page }) => {
    const wrong: string[] = [];

    for (const [width, beside] of [
      [1024, true],
      [900, false],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });

      for (const address of PAGES) {
        await page.goto(address);
        const seen = await page.evaluate(() => {
          const lede = document.querySelector("main .lede")?.getBoundingClientRect();
          const facts = document.querySelector("main .facts")?.getBoundingClientRect();
          if (lede === undefined || facts === undefined) return null;
          return { beside: facts.left >= lede.right, under: facts.top >= lede.bottom };
        });

        if (seen === null) wrong.push(`${address} à ${width} px : le chapô ou les faits manquent`);
        else if (seen.beside !== beside) {
          wrong.push(`${address} à ${width} px : les faits sont ${seen.beside ? "à côté" : "dessous"}`);
        } else if (!beside && !seen.under) {
          wrong.push(`${address} à ${width} px : les faits ne sont ni à côté ni dessous`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });
});

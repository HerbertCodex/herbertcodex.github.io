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

  test("la rangée de faits appelle le premier bandeau au pas qui sépare deux blocs, dans les deux langues", async ({
    page,
  }) => {
    await page.setViewportSize({ width: DRAWN_AT, height: 900 });
    await page.goto(PAGES[0]!);

    /*
     * Le pas est lu sur la page plutôt qu'écrit ici : déplacé dans les jetons,
     * il déplace le rythme. C'est --space-6, le pas entre deux BLOCS, et non le
     * --space-5 que la planche posait sous les faits : ce qui suit la rangée
     * n'est plus une grille de cellules mais la première section de la page, et
     * les marges des deux se recouvrent — la plus grande l'emporte.
     */
    const step = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--space-6")),
    );
    const wrong: string[] = [];

    for (const address of PAGES) {
      await page.goto(address);
      const gap = await page.evaluate(() => {
        const facts = document.querySelector("main .facts");
        const head = document.querySelector("main .section-head");
        if (facts === null || head === null) return null;
        return Math.round(head.getBoundingClientRect().top - facts.getBoundingClientRect().bottom);
      });

      if (gap !== step) wrong.push(`${address} : ${gap} px sous la rangée de faits, au lieu de ${step}`);
    }

    expect(wrong).toEqual([]);
  });
});

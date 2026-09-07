import { test, expect } from "@playwright/test";
import { PAGES, addressesToPrerender } from "../../src/shared/pages";

const ADDRESSES = addressesToPrerender(PAGES);

const HOMES = ["/fr", "/en"];

/*
 * La signature est lue par sa forme, jamais par son millésime : écrire 2026
 * ici ferait passer au rouge, un 1er janvier, un site que personne n'a touché.
 */
const SIGNATURE = /Donatien Koffi,\s*\d{4}/;

const PLACE = "Rennes, France";

/* La largeur normative du critère WCAG 2.1 AA 1.4.10, mesurée telle quelle. */
const NARROW = 320;

test.describe("le pied de page du site", () => {
  test("suit le contenu principal sur chacune des huit adresses", async ({ page }) => {
    const faults: string[] = [];

    for (const address of ADDRESSES) {
      await page.goto(address);
      const landmarks = await page.getByRole("contentinfo").count();
      if (landmarks !== 1) {
        faults.push(`${address} : ${landmarks} repère(s) de pied de page`);
        continue;
      }

      const placement = await page.evaluate(() => {
        const main = document.querySelector("main");
        const foot = document.querySelector("footer");
        if (main === null || foot === null) return "le contenu principal ou le pied de page est absent";
        const following = main.compareDocumentPosition(foot) & Node.DOCUMENT_POSITION_FOLLOWING;
        return following === 0 ? "le pied de page précède le contenu principal" : "ok";
      });

      if (placement !== "ok") faults.push(`${address} : ${placement}`);
    }

    expect(faults).toEqual([]);
  });

  test("dit la personne, l'année et le lieu sur chacune des huit adresses", async ({ page }) => {
    const faults: string[] = [];

    for (const address of ADDRESSES) {
      await page.goto(address);
      const foot = page.getByRole("contentinfo");
      if (!(await foot.isVisible())) {
        faults.push(`${address} : aucun pied de page visible à lire`);
        continue;
      }

      const said = (await foot.textContent()) ?? "";
      if (!SIGNATURE.test(said)) faults.push(`${address} : « ${said} » ne dit pas la personne suivie d'une année`);
      if (!said.includes(PLACE)) faults.push(`${address} : « ${said} » ne dit pas « ${PLACE} »`);
    }

    expect(faults).toEqual([]);
  });

  test(`ne fait déborder ni /fr ni /en à ${NARROW} px @a11y`, async ({ page }) => {
    const overflowing: string[] = [];
    await page.setViewportSize({ width: NARROW, height: 900 });

    for (const address of HOMES) {
      await page.goto(address);
      const measured = await page.evaluate(() => {
        const foot = document.querySelector("footer");
        if (foot === null) return null;
        const root = document.documentElement;
        return {
          sheet: root.scrollWidth - root.clientWidth,
          foot: Math.round(foot.getBoundingClientRect().right) - root.clientWidth,
        };
      });

      if (measured === null) {
        overflowing.push(`${address} : aucun pied de page à mesurer`);
        continue;
      }
      if (measured.sheet > 0) overflowing.push(`${address} : la page déborde de ${measured.sheet} px`);
      if (measured.foot > 0) overflowing.push(`${address} : le pied de page dépasse de ${measured.foot} px`);
    }

    expect(overflowing).toEqual([]);
  });
});

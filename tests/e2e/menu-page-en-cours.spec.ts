import { test, expect, type Page } from "@playwright/test";
import { LOCALES } from "../../src/shared/i18n";
import { PAGES, addressOf } from "../../src/shared/pages";

/* Les huit adresses publiées, chacune avec la page qu'elle sert. */
const ADDRESSES = PAGES.flatMap((page) => LOCALES.map((locale) => addressOf(page, locale)));

/* Une adresse sous préfixe de langue que le site ne publie pas. */
const NOWHERE = "/fr/aucune-page-de-ce-nom";

/*
 * Ce que chaque lien de la barre déclare : son adresse et le fait qu'il se
 * dise, ou non, la page en cours.
 */
async function navLinks(page: Page): Promise<{ href: string; current: string | null }[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll(".bar nav a")].map((link) => ({
      href: new URL((link as HTMLAnchorElement).href).pathname.replace(/\/$/, "") || "/",
      current: link.getAttribute("aria-current"),
    })),
  );
}

/*
 * Ce qui distingue le lien en cours des autres, COULEUR MISE À PART. Une
 * marque portée par la seule couleur laisse dehors qui ne la voit pas, et
 * `aria-current` ne la remplace pas : il parle aux lecteurs d'écran, pas aux
 * yeux qui distinguent mal deux teintes.
 */
async function shapeOf(page: Page, current: boolean): Promise<Record<string, string>> {
  return page.evaluate((wanted) => {
    const links = [...document.querySelectorAll(".bar nav a")];
    const link = links.find((one) => (one.getAttribute("aria-current") === "page") === wanted);
    if (link === undefined) return {} as Record<string, string>;
    const style = getComputedStyle(link);
    return {
      weight: style.fontWeight,
      decoration: style.textDecorationLine,
      thickness: style.textDecorationThickness,
      border: style.borderBottomWidth,
    };
  }, current);
}

test.describe("la barre dit sur quelle page on est", () => {
  test("un seul lien se déclare en cours, et c'est celui de l'adresse ouverte", async ({ page }) => {
    const wrong: string[] = [];

    for (const address of ADDRESSES) {
      await page.goto(address);
      const links = await navLinks(page);
      const marked = links.filter((link) => link.current === "page");
      const expected = address.replace(/\/$/, "") || "/";

      if (marked.length !== 1) wrong.push(`${address} : ${marked.length} lien(s) en cours au lieu d'un`);
      else if (marked[0].href !== expected) wrong.push(`${address} : le lien en cours mène à ${marked[0].href}`);
    }

    expect(wrong).toEqual([]);
  });

  test("la marque ne repose pas sur la seule couleur", async ({ page }) => {
    await page.goto(ADDRESSES[0]);
    const current = await shapeOf(page, true);
    const other = await shapeOf(page, false);

    expect(Object.keys(current)).not.toEqual([]);
    /* Au moins une propriété de FORME sépare les deux : la couleur n'en est pas une. */
    const differs = Object.keys(current).filter((key) => current[key] !== other[key]);
    expect(differs, `formes identiques : ${JSON.stringify(current)}`).not.toEqual([]);
  });

  test("aucune page n'est dite en cours sur une adresse que le site ne publie pas", async ({ page }) => {
    await page.goto(NOWHERE);
    const links = await navLinks(page);

    expect(links.filter((link) => link.current === "page")).toEqual([]);
  });
});

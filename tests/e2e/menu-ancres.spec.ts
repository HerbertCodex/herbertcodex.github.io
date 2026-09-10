import { test, expect, type Page } from "@playwright/test";
import { LOCALES } from "../../src/shared/i18n";
import { NAMED_PAGES, PAGES, addressOf, anchorOf, publishedAddresses } from "../../src/shared/pages";

const ADDRESSES = publishedAddresses(PAGES);

/*
 * Ce que chaque lien de la barre déclare : son adresse, ancre comprise, et le
 * fait qu'il se dise, ou non, la page en cours.
 */
async function navLinks(page: Page): Promise<{ href: string; current: string | null }[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll(".bar nav a")].map((link) => {
      const url = new URL((link as HTMLAnchorElement).href);
      return {
        href: `${url.pathname.replace(/\/$/, "") || "/"}${url.hash}`,
        current: link.getAttribute("aria-current"),
      };
    }),
  );
}

/*
 * Ce qui distingue le lien marqué des autres, COULEUR MISE À PART. Une marque
 * portée par la seule couleur laisse dehors qui ne la voit pas, et
 * `aria-current` ne la remplace pas : il parle aux lecteurs d'écran, pas aux
 * yeux qui distinguent mal deux teintes.
 */
async function shapeOf(page: Page, marked: boolean): Promise<Record<string, string>> {
  return page.evaluate((wanted) => {
    const links = [...document.querySelectorAll(".bar nav a")];
    const link = links.find((one) => (one.getAttribute("aria-current") !== null) === wanted);
    if (link === undefined) return {} as Record<string, string>;
    const style = getComputedStyle(link);
    return { weight: style.fontWeight, decoration: style.textDecorationLine, thickness: style.textDecorationThickness };
  }, marked);
}

/*
 * Le menu menait à quatre PAGES et marquait celle qu'on lisait. Le site n'en
 * publie plus qu'une : ses liens sont les trois ancres de cette page, et c'est
 * l'ANCRE DE L'ADRESSE qui porte la marque — celle sur laquelle le lecteur a
 * cliqué, ou celle que portait le lien qu'on lui a partagé.
 *
 * Elle est lue dans l'adresse et jamais retenue ailleurs : le retour arrière du
 * navigateur change l'ancre, et une marque gardée de notre côté finirait par
 * contredire la barre d'adresse. Le serveur, lui, ne peut pas la connaître —
 * une ancre ne quitte jamais le navigateur — donc elle se pose une fois la page
 * vivante, ce qu'un lecteur qui vient de cliquer ne voit pas passer.
 *
 * La marque ne suit PAS le défilement, et c'est une décision : la maquette
 * approuvée ne dessine aucun suivi, et son unique script n'anime que les
 * schémas.
 */
test.describe("le menu mène aux trois sections de la page", () => {
  test("chaque lien porte l'ancre de sa section, dans la langue de la page", async ({ page }) => {
    const wrong: string[] = [];

    for (const locale of LOCALES) {
      await page.goto(`/${locale}`);
      const links = await navLinks(page);
      const expected = NAMED_PAGES.map((part) => addressOf(part, locale));

      if (links.map((link) => link.href).join(" ") !== expected.join(" ")) {
        wrong.push(`/${locale} : ${links.map((link) => link.href).join(" ")} au lieu de ${expected.join(" ")}`);
      }
    }

    expect(wrong).toEqual([]);
  });

  test("aucun ne se marque tant que le lecteur n'a demandé aucune section", async ({ page }) => {
    for (const address of ADDRESSES) {
      await page.goto(address);
      const links = await navLinks(page);

      expect(
        links.filter((link) => link.current !== null),
        address,
      ).toEqual([]);
    }
  });

  test("celui sur lequel on clique se marque, et lui seul, dans les deux langues", async ({ page }) => {
    const wrong: string[] = [];

    for (const locale of LOCALES) {
      for (const part of NAMED_PAGES) {
        const anchor = anchorOf(part, locale);
        await page.goto(`/${locale}`);
        await page.locator(`.bar nav a[href="/${locale}#${anchor}"]`).click();
        await page.waitForURL(new RegExp(`#${anchor}$`));

        const marked = (await navLinks(page)).filter((link) => link.current !== null);

        if (marked.length !== 1) wrong.push(`/${locale}#${anchor} : ${marked.length} lien(s) marqué(s) au lieu d'un`);
        else if (marked[0]!.href !== `/${locale}#${anchor}`) {
          wrong.push(`/${locale}#${anchor} : marque sur ${marked[0]!.href}`);
        } else if (marked[0]!.current !== "location") {
          wrong.push(`/${locale}#${anchor} : aria-current vaut ${marked[0]!.current}`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  test("un lien partagé vers une section arrive déjà marqué", async ({ page }) => {
    await page.goto("/fr#parcours");

    const marked = (await navLinks(page)).filter((link) => link.current !== null);

    expect(marked.map((link) => link.href)).toEqual(["/fr#parcours"]);
  });

  test("la marque suit le retour arrière du navigateur", async ({ page }) => {
    await page.goto("/fr");
    await page.locator('.bar nav a[href="/fr#realisations"]').click();
    await page.waitForURL(/#realisations$/);
    await page.locator('.bar nav a[href="/fr#contact"]').click();
    await page.waitForURL(/#contact$/);

    await page.goBack();
    await page.waitForURL(/#realisations$/);

    const marked = (await navLinks(page)).filter((link) => link.current !== null);
    expect(marked.map((link) => link.href)).toEqual(["/fr#realisations"]);
  });

  test("la marque ne repose pas sur la seule couleur", async ({ page }) => {
    await page.goto("/fr#realisations");

    const marked = await shapeOf(page, true);
    const other = await shapeOf(page, false);

    expect(Object.keys(marked)).not.toEqual([]);
    /* Au moins une propriété de FORME sépare les deux : la couleur n'en est pas une. */
    const differs = Object.keys(marked).filter((key) => marked[key] !== other[key]);
    expect(differs, `formes identiques : ${JSON.stringify(marked)}`).not.toEqual([]);
  });

  test("chaque ancre désigne un élément qui existe sur la page", async ({ page }) => {
    const missing: string[] = [];

    for (const locale of LOCALES) {
      await page.goto(`/${locale}`);
      for (const part of NAMED_PAGES) {
        const anchor = anchorOf(part, locale);
        const found = await page.locator(`#${anchor}`).count();
        if (found !== 1) missing.push(`/${locale}#${anchor} désigne ${found} élément(s)`);
      }
    }

    expect(missing).toEqual([]);
  });
});

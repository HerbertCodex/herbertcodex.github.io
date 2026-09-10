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
 * Amène la ligne de lecture juste sous le titre d'une section, SANS clic ni
 * ancre : c'est le défilement seul qui doit déplacer la marque. Les dix pixels
 * de dépassement mettent le titre franchement au-dessus de la ligne plutôt
 * qu'exactement dessus, pour qu'un arrondi ne décide pas du résultat.
 */
async function scrollPast(page: Page, anchor: string): Promise<void> {
  await page.evaluate((wanted) => {
    const heading = document.getElementById(wanted);
    if (heading === null) throw new Error(`aucun élément ne porte l'ancre ${wanted}`);
    const line = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - line + 10);
  }, anchor);
}

/* Le lien du menu qui mène à une ancre, dans la langue de la page ouverte. */
function linkTo(page: Page, address: string) {
  return page.locator(`.bar nav a[href="${address}"]`);
}

/*
 * Le menu menait à quatre PAGES et marquait celle qu'on lisait. Le site n'en
 * publie plus qu'une : ses liens sont les trois ancres de cette page, et la
 * marque suit CE QUI EST LU — la dernière section dont le titre est passé
 * au-dessus de la ligne de lecture.
 *
 * Cette ligne n'est pas un nombre choisi : c'est `scroll-padding-top`, la
 * réserve que la feuille garde déjà sous la barre, et c'est exactement là que
 * le navigateur pose un titre sur lequel on vient de cliquer. Cliquer et
 * défiler s'accordent donc par construction, et non par coïncidence.
 *
 * Rien n'est marqué en haut de la page : l'ouverture n'appartient à aucune
 * section. Et le bas de la page est le seul cas que la ligne ne tranche pas —
 * la dernière section ne peut pas l'atteindre, faute de défilement restant.
 *
 * La marque se pose apres un defilement et une image d'animation : les
 * assertions l'ATTENDENT au lieu de la lire tout de suite.
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
    for (const locale of LOCALES) {
      for (const part of NAMED_PAGES) {
        const address = `/${locale}#${anchorOf(part, locale)}`;
        await page.goto(`/${locale}`);
        await linkTo(page, address).click();

        await expect(linkTo(page, address), address).toHaveAttribute("aria-current", "location");
        await expect(page.locator('.bar nav a[aria-current="location"]'), address).toHaveCount(1);
      }
    }
  });

  test("un lien partagé vers une section arrive déjà marqué", async ({ page }) => {
    await page.goto("/fr#parcours");

    await expect(linkTo(page, "/fr#parcours")).toHaveAttribute("aria-current", "location");
    await expect(page.locator('.bar nav a[aria-current="location"]')).toHaveCount(1);
  });

  test("la marque suit le retour arrière du navigateur", async ({ page }) => {
    await page.goto("/fr");
    await linkTo(page, "/fr#realisations").click();
    await expect(linkTo(page, "/fr#realisations")).toHaveAttribute("aria-current", "location");
    await linkTo(page, "/fr#contact").click();
    await expect(linkTo(page, "/fr#contact")).toHaveAttribute("aria-current", "location");

    await page.goBack();

    await expect(linkTo(page, "/fr#realisations")).toHaveAttribute("aria-current", "location");
  });

  test("elle suit le défilement, sans aucun clic, dans les deux langues", async ({ page }) => {
    for (const locale of LOCALES) {
      await page.goto(`/${locale}`);

      for (const part of NAMED_PAGES) {
        const anchor = anchorOf(part, locale);
        await scrollPast(page, anchor);

        await expect(linkTo(page, `/${locale}#${anchor}`), `${locale} ${anchor}`).toHaveAttribute(
          "aria-current",
          "location",
        );
        await expect(page.locator('.bar nav a[aria-current="location"]'), `${locale} ${anchor}`).toHaveCount(1);
      }

      /* Et elle revient : en haut, aucune section n'est lue. */
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator('.bar nav a[aria-current="location"]'), locale).toHaveCount(0);
    }
  });

  test("au bas de la page, c'est la dernière section qui est lue", async ({ page }) => {
    await page.goto("/fr");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    await expect(linkTo(page, "/fr#contact")).toHaveAttribute("aria-current", "location");
  });

  test("la marque ne repose pas sur la seule couleur", async ({ page }) => {
    await page.goto("/fr#realisations");
    await expect(page.locator('.bar nav a[aria-current="location"]')).toHaveCount(1);

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

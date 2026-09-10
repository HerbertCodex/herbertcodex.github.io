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
 * Le menu menait à quatre PAGES et marquait celle qu'on lisait. Le site n'en
 * publie plus qu'une depuis le 2026-09-10 : ses liens sont les trois ancres de
 * cette page, et aucun n'est « la page en cours » — elles le sont toutes.
 *
 * La marque n'a pas été rebranchée sur la section VISIBLE, et c'est une
 * décision plutôt qu'un oubli : la maquette approuvée ne dessine aucun suivi du
 * défilement, et son unique script n'animer que les schémas. Un marqueur qui
 * suivrait le défilement serait une fonctionnalité de plus, à demander.
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

  test("aucun ne se déclare la page en cours, puisqu'il n'y a qu'une page", async ({ page }) => {
    for (const address of ADDRESSES) {
      await page.goto(address);
      const links = await navLinks(page);

      expect(
        links.filter((link) => link.current !== null),
        address,
      ).toEqual([]);
    }
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

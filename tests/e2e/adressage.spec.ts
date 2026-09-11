import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { LOCALES } from "../../src/shared/i18n";
import { NAMED_PAGES, PAGES, anchorOf, publishedAddresses, redirectedAddresses } from "../../src/shared/pages";

const OUTPUT = ".output/public";

const PUBLISHED = publishedAddresses(PAGES);

const REDIRECTED = redirectedAddresses(PAGES);

const FACTS = ["CDI ou freelance", "Rennes", "Master MIAGE · DLIS", "FR · EN"];

test.describe("the addresses of the site", () => {
  test("the build writes one page per language, and a document for each address that was one", () => {
    const missing = [...PUBLISHED, ...REDIRECTED].filter((address) => !existsSync(join(OUTPUT, address, "index.html")));

    expect(missing).toEqual([]);
  });

  test("each published page answers in its own language and carries every section", async ({ page }) => {
    for (const locale of LOCALES) {
      const response = await page.goto(`/${locale}`);

      expect(response?.status(), locale).toBe(200);
      expect(new URL(page.url()).pathname, locale).toBe(`/${locale}`);
      expect(await page.locator("html").getAttribute("lang"), locale).toBe(locale);
      await expect(page.getByRole("heading", { level: 1 }), locale).toBeVisible();

      for (const part of NAMED_PAGES) {
        await expect(page.locator(`#${anchorOf(part, locale)}`), `${locale} ${part.key}`).toHaveCount(1);
      }
    }
  });

  /*
   * Les six adresses qui etaient des pages jusqu'au 2026-09-10. Elles repondent
   * encore parce qu'un lien deja partage ne se rappelle pas : le CV et le profil
   * LinkedIn les portent dehors. L'hebergeur est statique et n'offre aucune
   * redirection, donc c'est le document qui renvoie — et ce test mesure les
   * trois choses qu'il doit porter, chacune pour un lecteur different.
   */
  test("each address that was a page sends the visitor to its anchor, three ways", async ({ request }) => {
    const wrong: string[] = [];

    for (const part of NAMED_PAGES) {
      for (const locale of LOCALES) {
        const anchor = anchorOf(part, locale);
        const response = await request.get(`/${locale}/${anchor}`);
        const html = await response.text();

        if (response.status() !== 200) wrong.push(`/${locale}/${anchor} repond ${response.status()}`);
        if (!html.includes(`content="0; url=/${locale}#${anchor}"`)) wrong.push(`/${locale}/${anchor} : pas de renvoi`);
        if (!html.includes(`rel="canonical" href="https://herbertcodex.github.io/${locale}#${anchor}"`)) {
          wrong.push(`/${locale}/${anchor} : pas de canonique`);
        }
        if (!html.includes(`href="/${locale}#${anchor}"`)) wrong.push(`/${locale}/${anchor} : pas de lien visible`);
      }
    }

    expect(wrong).toEqual([]);
  });

  test("a visitor arriving on one of them lands on the anchor", async ({ page }) => {
    await page.goto("/fr/realisations");
    await page.waitForURL(/\/fr#realisations$/);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ingénieur logiciel");
    await expect(page.locator("#realisations")).toBeVisible();
  });

  test("an address mixing the two languages leads to the page not found", async ({ request }) => {
    const english = await request.get("/en/work");
    const mixed = await request.get("/en/realisations");

    expect(english.status()).toBe(200);
    expect(mixed.status()).not.toBe(200);
    expect(await mixed.text()).not.toContain("Réalisations");
  });

  test("the english name of the journey no longer answers under the french prefix", async ({ page }) => {
    const response = await page.goto("/fr/about");

    expect(response?.status()).toBe(404);
    expect(new URL(page.url()).pathname).toBe("/fr/about");
  });

  test("the page opens on the name, the sentence and the facts, then on the work", async ({ page }) => {
    await page.goto("/fr");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ingénieur logiciel");
    await expect(page.locator("main p").first()).not.toBeEmpty();
    for (const fact of FACTS) {
      await expect(page.locator("main").getByText(fact).first()).toBeVisible();
    }

    // Les cinq bandeaux, numerotes dans l'ordre et sans trou : c'est ce que la
    // maquette dessine, et le numero du contact est CALCULE — les certifications
    // n'apparaissent que s'il en existe une.
    const heads = await page.locator("main .section-head").evaluateAll((nodes) =>
      nodes.map((node) => ({
        num: node.querySelector(".num")?.textContent,
        name: node.querySelector("h2")?.textContent,
      })),
    );

    expect(heads.map((head) => head.num)).toEqual(["01", "02", "03", "04", "05"]);
    expect(heads.map((head) => head.name)).toEqual([
      "Réalisations",
      "Expérience",
      "Formation",
      "Compétences",
      "Contact",
    ]);
    expect(await page.locator("main").innerText()).not.toContain("@");
  });
});

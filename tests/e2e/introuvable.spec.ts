import { test, expect, type Page } from "@playwright/test";

const DEMONSTRATION = "start.solidjs.com";

/*
 * Le titre de l'accueil de chaque langue, ecrit ici pour servir de repere de
 * DEPART et non de cible. Une adresse inconnue tapee dans la barre recoit le
 * 404 en texte brut du serveur statique — l'artefact ne publie aucun document
 * introuvable — donc le seul parcours qui atteint cet ecran est une navigation
 * INTERNE : on part d'une page reelle, on pousse l'adresse inconnue, et on
 * attend que le titre cesse d'etre celui de l'accueil. Mesure le 2026-09-07 :
 * `page.goto('/fr/inconnu')` rend « not found » en texte brut, jamais l'ecran.
 */
const HOME_HEADING: Readonly<Record<string, string>> = {
  fr: "Ingénieur logiciel",
  en: "Software engineer",
};

async function reachUnknown(page: Page, locale: string, address: string): Promise<string> {
  await page.goto(`/${locale}`);
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(HOME_HEADING[locale]);

  await page.evaluate((wanted) => {
    history.pushState({}, "", wanted);
    dispatchEvent(new PopStateEvent("popstate"));
  }, address);

  await expect(heading).not.toHaveText(HOME_HEADING[locale]);
  expect(new URL(page.url()).pathname).toBe(address);
  return (await heading.innerText()).trim();
}

test.describe("l'adresse que le site ne publie pas", () => {
  test("rend la page introuvable, et plus le gabarit du framework", async ({ page }) => {
    const heading = await reachUnknown(page, "fr", "/fr/inconnu");

    expect(heading).not.toBe("");
    expect(await page.locator("body").innerText()).not.toContain(DEMONSTRATION);
  });

  test("parle la langue de l'adresse", async ({ page }) => {
    const french = await reachUnknown(page, "fr", "/fr/inconnu");
    const english = await reachUnknown(page, "en", "/en/whatever");

    expect(french).not.toBe("");
    expect(english).not.toBe("");
    expect(english).not.toBe(french);
  });

  test("ramène à l'accueil de la langue en cours", async ({ page }) => {
    await reachUnknown(page, "fr", "/fr/inconnu");
    await expect(page.locator('main a[href="/fr"]')).toHaveCount(1);

    await reachUnknown(page, "en", "/en/whatever");
    await expect(page.locator('main a[href="/en"]')).toHaveCount(1);
  });
});

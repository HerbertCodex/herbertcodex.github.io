import { test, expect, type Page } from "@playwright/test";

const PAIRS = [
  { fr: "/fr", en: "/en" },
  { fr: "/fr/realisations", en: "/en/work" },
  { fr: "/fr/parcours", en: "/en/about" },
  { fr: "/fr/contact", en: "/en/contact" },
];

const ADDRESSES = [...PAIRS.map((pair) => pair.fr), ...PAIRS.map((pair) => pair.en)];

/*
 * Le budget de tabulations. La barre porte au plus sept arrêts : l'évitement,
 * quatre pages, deux langues. L'accueil en ajoute trois. Quatorze fait donc un
 * tour complet, ce qui prouve une absence plutôt que de la mesurer trop tôt.
 */
const TAB_BUDGET = 14;

async function tabUntil(page: Page, href: string): Promise<boolean> {
  for (let step = 0; step < TAB_BUDGET; step += 1) {
    await page.keyboard.press("Tab");
    const reached = await page.evaluate((wanted) => document.activeElement?.getAttribute("href") === wanted, href);
    if (reached) return true;
  }
  return false;
}

test.describe("changer de langue conduit à la même page", () => {
  test("depuis /fr/realisations, l'anglais conduit à /en/work", async ({ page }) => {
    await page.goto("/fr/realisations");
    await page.locator('a[hreflang="en"]').click();

    await page.waitForURL(/\/en\/work$/);
    expect(new URL(page.url()).pathname).toBe("/en/work");
  });

  test("depuis l'accueil /fr, l'anglais conduit à /en", async ({ page }) => {
    await page.goto("/fr");
    await page.locator('a[hreflang="en"]').click();

    await page.waitForURL(/\/en$/);
    expect(new URL(page.url()).pathname).toBe("/en");
  });

  test("le sélecteur est atteint et actionné au clavier seul", async ({ page }) => {
    await page.goto("/fr/parcours");

    expect(await tabUntil(page, "/en/about"), "aucun arrêt de tabulation ne porte /en/about").toBe(true);
    await page.keyboard.press("Enter");

    await page.waitForURL(/\/en\/about$/);
    expect(new URL(page.url()).pathname).toBe("/en/about");
  });

  test("la langue en cours est annoncée et marquée autrement que par la couleur", async ({ page }) => {
    await page.goto("/fr/contact");
    const inForce = page.locator('a[hreflang="fr"]');
    const other = page.locator('a[hreflang="en"]');

    await expect(inForce).toHaveAttribute("aria-current", "true");
    expect(await other.getAttribute("aria-current")).toBeNull();

    const weightInForce = await inForce.evaluate((node) => getComputedStyle(node).fontWeight);
    const weightOther = await other.evaluate((node) => getComputedStyle(node).fontWeight);
    expect(Number(weightInForce), "la langue en cours ne se distingue que par la couleur").toBeGreaterThan(
      Number(weightOther),
    );
  });
});

test.describe("la barre que porte chaque page", () => {
  test("chaque page ouvre sur un lien d'évitement dont la cible existe sur elle", async ({ page }) => {
    const verdicts: string[] = [];
    for (const address of ADDRESSES) {
      await page.goto(address);
      await page.keyboard.press("Tab");
      verdicts.push(
        await page.evaluate((path) => {
          const active = document.activeElement;
          if (!(active instanceof HTMLAnchorElement)) {
            return `${path}: le premier arrêt est ${active?.tagName ?? "rien"}`;
          }
          const href = active.getAttribute("href") ?? "";
          if (!href.startsWith("#")) return `${path}: le premier arrêt conduit à ${href}`;
          if (document.getElementById(href.slice(1)) == null) return `${path}: ${href} ne désigne rien ici`;
          return `${path}: ok`;
        }, address),
      );
    }

    expect(verdicts).toEqual(ADDRESSES.map((address) => `${address}: ok`));
  });

  test("la barre donne accès aux quatre pages depuis n'importe quelle page", async ({ page }) => {
    const verdicts: string[] = [];
    for (const address of ADDRESSES) {
      const locale = address.startsWith("/en") ? "en" : "fr";
      const expected = PAIRS.map((pair) => pair[locale]);
      await page.goto(address);
      const reached = new Set<string>();
      for (let step = 0; step < TAB_BUDGET; step += 1) {
        await page.keyboard.press("Tab");
        const href = await page.evaluate(() => {
          const active = document.activeElement;
          const inBar = active instanceof HTMLAnchorElement && active.closest("header") != null;
          return inBar ? active.getAttribute("href") : null;
        });
        if (href != null) reached.add(href);
      }
      const missing = expected.filter((path) => !reached.has(path));
      verdicts.push(`${address}: ${missing.length === 0 ? "ok" : `manque ${missing.join(", ")}`}`);
    }

    expect(verdicts).toEqual(ADDRESSES.map((address) => `${address}: ok`));

    await page.goto("/en/work");
    expect(await tabUntil(page, "/en/contact"), "aucun arrêt de tabulation ne porte /en/contact").toBe(true);
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/en\/contact$/);
    expect(new URL(page.url()).pathname).toBe("/en/contact");
  });
});

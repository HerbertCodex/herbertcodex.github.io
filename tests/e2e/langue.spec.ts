import { test, expect, type Page } from "@playwright/test";

import { LOCALES } from "../../src/shared/i18n";
import { PAGES, SECTIONS, addressOfSection, publishedAddresses } from "../../src/shared/pages";

const ADDRESSES = publishedAddresses(PAGES);

/*
 * Le budget de tabulations. La barre porte huit arrêts : l'évitement, trois
 * sections, deux langues, le thème. Douze fait donc un tour complet de la
 * barre, ce qui prouve une absence plutôt que de la mesurer trop tôt.
 */
const TAB_BUDGET = 12;

async function tabUntil(page: Page, href: string): Promise<boolean> {
  for (let step = 0; step < TAB_BUDGET; step += 1) {
    await page.keyboard.press("Tab");
    const reached = await page.evaluate((wanted) => document.activeElement?.getAttribute("href") === wanted, href);
    if (reached) return true;
  }
  return false;
}

test.describe("changer de langue conduit à l'autre page", () => {
  /*
   * Le sélecteur conduisait à la MÊME page dans l'autre langue quand il y en
   * avait quatre. Il n'y en a plus qu'une, et il ne reporte pas l'endroit où le
   * lecteur a défilé : le document prérendu ne peut pas le savoir, et l'y
   * renvoyer au hasard serait pire que de l'accueillir en haut.
   */
  test("depuis /fr, l'anglais conduit à /en", async ({ page }) => {
    await page.goto("/fr");
    await page.locator('a[hreflang="en"]').click();

    await page.waitForURL(/\/en$/);
    expect(new URL(page.url()).pathname).toBe("/en");
  });

  test("le sélecteur est atteint et actionné au clavier seul", async ({ page }) => {
    await page.goto("/fr");

    expect(await tabUntil(page, "/en"), "aucun arrêt de tabulation ne porte /en").toBe(true);
    await page.keyboard.press("Enter");

    await page.waitForURL(/\/en$/);
    expect(new URL(page.url()).pathname).toBe("/en");
  });

  test("la langue en cours est annoncée et marquée autrement que par la couleur", async ({ page }) => {
    await page.goto("/fr");
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

  test("la barre donne accès à chaque section depuis chaque page", async ({ page }) => {
    const verdicts: string[] = [];
    for (const locale of LOCALES) {
      const address = `/${locale}`;
      const expected = SECTIONS.map((section) => addressOfSection(section, locale));
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

    // Et l'ancre conduit bien au contenu qu'elle nomme, pas seulement à une
    // adresse : le clavier seul, depuis le haut de la page anglaise.
    await page.goto("/en");
    expect(await tabUntil(page, "/en#contact"), "aucun arrêt de tabulation ne porte /en#contact").toBe(true);
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/en#contact$/);
    await expect(page.locator("#contact")).toBeVisible();
  });
});

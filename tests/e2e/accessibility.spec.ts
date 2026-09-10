import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PAGES as PARTS, publishedAddresses } from "../../src/shared/pages";

/*
 * Les pages publiees, lues dans la table plutot que recopiees : depuis que le
 * site en publie UNE par langue, une liste ecrite ici aurait continue a nommer
 * six adresses devenues des documents de renvoi, que le balayage aurait quittes
 * en cours de mesure.
 */
const PAGES = publishedAddresses(PARTS);

for (const path of PAGES) {
  test(`${path} has no detectable accessibility violation @a11y`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  });

  test(`${path} reaches every interactive element by keyboard @a11y`, async ({ page }) => {
    await page.goto(path);
    const interactive = await page.locator("a[href], button, input, select, textarea").count();
    const reached = new Set<string>();
    for (let step = 0; step < interactive + 3; step += 1) {
      await page.keyboard.press("Tab");
      const marker = await page.evaluate(() => {
        const active = document.activeElement;
        if (active == null || active === document.body) return null;
        return `${active.tagName}:${active.textContent?.trim().slice(0, 24) ?? ""}`;
      });
      if (marker != null) reached.add(marker);
    }
    expect(reached.size).toBeGreaterThanOrEqual(interactive);
  });
}

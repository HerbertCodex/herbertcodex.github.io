import { test, expect } from "@playwright/test";

const ADDRESS = "kraherbertdonatienkoffi@gmail.com";

const ADDRESSES = ["/fr/contact", "/en/contact"];

/*
 * La barre porte sept arrets — l'evitement, quatre pages, deux langues — avant
 * que le contenu commence. Seize fait donc un tour large de la page de contact
 * sans dependre du nombre exact de moyens affiches.
 */
const TAB_BUDGET = 16;

for (const address of ADDRESSES) {
  test(`${address} publie l'adresse en clair, sans obfuscation`, async ({ page }) => {
    const served = await page.request.get(address);

    expect(served.status()).toBe(200);
    expect(await served.text()).toContain(`mailto:${ADDRESS}`);

    await page.goto(address);
    await expect(page.locator(`a[href="mailto:${ADDRESS}"]`)).toHaveCount(1);
    await expect(page.getByText(ADDRESS, { exact: false })).toBeVisible();
  });

  test(`${address} ne porte aucun formulaire et n'envoie rien`, async ({ page }) => {
    await page.goto(address);

    expect(await page.locator("form, input, textarea, select, button").count()).toBe(0);
    const targets = await page
      .locator("main a[href]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));
    expect(targets.length).toBeGreaterThan(0);
    for (const href of targets) expect(href, href).toMatch(/^(?:mailto:|https:\/\/|\/)/);
  });

  test(`${address} atteint la messagerie au clavier avant les moyens secondaires`, async ({ page }) => {
    await page.goto(address);
    const reached: string[] = [];
    for (let step = 0; step < TAB_BUDGET; step += 1) {
      await page.keyboard.press("Tab");
      const href = await page.evaluate(() => {
        const active = document.activeElement;
        const inMain = active instanceof HTMLAnchorElement && active.closest("main") != null;
        return inMain ? active.getAttribute("href") : null;
      });
      if (href != null && !reached.includes(href)) reached.push(href);
    }

    expect(reached).toEqual([
      `mailto:${ADDRESS}`,
      "https://linkedin.com/in/donatien-koffi",
      "https://github.com/HerbertCodex",
    ]);
  });
}

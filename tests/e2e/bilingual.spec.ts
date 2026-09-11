import { test, expect } from "@playwright/test";

/* La page de chaque langue. Il y en avait quatre par langue jusqu'au 2026-09-10. */
const PAGES = [{ fr: "/fr", en: "/en" }];

test.describe("every page is addressed by its language", () => {
  for (const page_addresses of PAGES) {
    for (const [locale, address] of Object.entries(page_addresses)) {
      test(`${address} answers with its own page`, async ({ page }) => {
        const response = await page.goto(address);
        expect(response?.status()).toBe(200);
        expect(await page.locator("html").getAttribute("lang")).toBe(locale);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      });
    }
  }

  test("an address with no language prefix leads to the french version", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/fr$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("a shared link opens in the language it names", () => {
  test.use({ locale: "fr-FR", extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9" } });

  /*
   * /en/about est precisement un lien deja partage : il etait une page, il est
   * devenu un document de renvoi. Il doit donc rester anglais de bout en bout —
   * le document servi comme la page d'arrivee — pour un navigateur francais.
   */
  test("/en/about is english for a french browser that has stored nothing", async ({ page }) => {
    const served = await page.request.get("/en/about");
    expect(served.status()).toBe(200);
    expect(await served.text()).toContain('lang="en"');

    await page.goto("/en/about");
    await page.waitForURL(/\/en#about$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Experience" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  });
});

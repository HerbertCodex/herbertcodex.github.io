import { test, expect } from "@playwright/test";

const PAGES = [
  { fr: "/fr", en: "/en" },
  { fr: "/fr/realisations", en: "/en/work" },
  { fr: "/fr/parcours", en: "/en/about" },
  { fr: "/fr/contact", en: "/en/contact" },
];

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

  test("/en/about is english for a french browser that has stored nothing", async ({ page }) => {
    const served = await page.request.get("/en/about");
    expect(served.status()).toBe(200);
    expect(await served.text()).toContain('lang="en"');

    await page.goto("/en/about");
    await expect(page.getByRole("navigation").getByRole("link", { name: "About" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  });
});

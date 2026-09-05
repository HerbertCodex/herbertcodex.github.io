import { test, expect } from "@playwright/test";

const PAGES = ["", "/about"];

test.describe("every page is addressed by its language", () => {
  for (const page_path of PAGES) {
    for (const locale of ["fr", "en"]) {
      test(`/${locale}${page_path} answers with its own page`, async ({ page }) => {
        const response = await page.goto(`/${locale}${page_path}`);
        expect(response?.status()).toBe(200);
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
    await expect(page.getByRole("link", { name: "About" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  });
});

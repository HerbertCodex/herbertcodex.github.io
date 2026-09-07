import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const OUTPUT = ".output/public";

const ADDRESSES = [
  "/fr",
  "/en",
  "/fr/realisations",
  "/en/work",
  "/fr/parcours",
  "/en/about",
  "/fr/contact",
  "/en/contact",
];

const FACTS = ["CDI ou freelance", "Rennes", "Master MIAGE", "FR · EN"];

const ENTRIES = ["/fr/realisations", "/fr/parcours", "/fr/contact"];

test.describe("the addresses of the site", () => {
  test("the build writes the works page under both of its names", () => {
    const written = ["/fr/realisations", "/en/work"].filter((address) =>
      existsSync(join(OUTPUT, address, "index.html")),
    );

    expect(written).toEqual(["/fr/realisations", "/en/work"]);
  });

  test("home answers under the language prefix alone", async ({ page }) => {
    for (const [address, works] of [
      ["/fr", "/fr/realisations"],
      ["/en", "/en/work"],
    ]) {
      const response = await page.goto(address);
      expect(response?.status(), address).toBe(200);
      expect(new URL(page.url()).pathname, address).toBe(address);
      await expect(page.locator(`main a[href="${works}"]`), address).toHaveCount(1);
    }
  });

  test("the eight addresses answer", async ({ request }) => {
    const answered: string[] = [];
    for (const address of ADDRESSES) {
      const response = await request.get(address);
      if (response.status() === 200) answered.push(address);
    }

    expect(answered).toEqual(ADDRESSES);
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

  test("home carries the opening and a named entry to each of the three other pages", async ({ page }) => {
    await page.goto("/fr");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ingénieur logiciel");
    await expect(page.locator("main p").first()).not.toBeEmpty();
    for (const fact of FACTS) {
      await expect(page.locator("main").getByText(fact).first()).toBeVisible();
    }
    for (const entry of ENTRIES) {
      await expect(page.locator(`main a[href="${entry}"]`)).toHaveCount(1);
    }
    expect(await page.locator("main h2, main h3").count()).toBe(0);
    expect(await page.locator("main").innerText()).not.toContain("@");
  });
});

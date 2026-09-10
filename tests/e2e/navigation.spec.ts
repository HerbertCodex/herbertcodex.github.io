import { test, expect } from "@playwright/test";

/*
 * Le menu menait a une PAGE jusqu'au 2026-09-10 ; il mene desormais a une
 * section de la page unique. Ce qui doit rester vrai est ce que le lecteur
 * attend : il actionne « Parcours » et il se trouve devant le parcours.
 */
test("the journey is reached from the navigation, on the page itself", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("navigation").getByRole("link", { name: "Parcours" }).click();

  await expect(page).toHaveURL(/\/fr#parcours$/);
  await expect(page.locator("#parcours")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Expérience" })).toBeVisible();
});

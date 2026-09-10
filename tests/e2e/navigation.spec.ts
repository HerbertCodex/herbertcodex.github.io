import { test, expect } from "@playwright/test";

/*
 * Le menu menait a une PAGE jusqu'au 2026-09-10, puis a trois sections dont
 * une — « Parcours » — ne correspondait a aucun titre visible. Il nomme
 * desormais les sections que la page montre. Ce qui doit rester vrai est ce
 * que le lecteur attend : il actionne un nom, il se trouve devant ce nom.
 */
test("a section named by the menu is reached from it, on the page itself", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("navigation").getByRole("link", { name: "Expérience" }).click();

  await expect(page).toHaveURL(/\/fr#experience$/);
  await expect(page.getByRole("heading", { level: 2, name: "Expérience" })).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("the about page is reachable from the navigation", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "À propos" }).click();
  await expect(page).toHaveURL(/\/fr\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

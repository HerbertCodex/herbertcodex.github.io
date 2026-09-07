import { test, expect } from "@playwright/test";

test("the journey page is reachable from the navigation", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("navigation").getByRole("link", { name: "Parcours" }).click();
  await expect(page).toHaveURL(/\/fr\/parcours$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

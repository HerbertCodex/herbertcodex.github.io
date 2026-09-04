import { test, expect } from "@playwright/test";

test("the home page states what the site is", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the about page is reachable from the navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the counter answers a click", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button");
  await expect(button).toContainText("0");
  await button.click();
  await expect(button).toContainText("1");
});

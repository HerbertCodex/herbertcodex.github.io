import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ADDRESSES = [
  { path: "/fr/realisations", heading: "Réalisations" },
  { path: "/en/work", heading: "Work" },
];

const WORKS = 4;

/*
 * La longueur minimale d'un texte de remplacement. Un schema decrit ce que la
 * realisation FAIT ; une legende la nomme. Rien ne distingue les deux sinon
 * l'ampleur, et un titre de realisation de ce site tient sous cette barre.
 */
const DESCRIPTION = 40;

const animatedCount = (nodes: (SVGElement | HTMLElement)[]) =>
  nodes.filter((node) => getComputedStyle(node).animationName !== "none").length;

test.describe("la page des réalisations", () => {
  for (const { path, heading } of ADDRESSES) {
    test(`${path} présente les quatre réalisations sans violation d'accessibilité @a11y`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.locator("main article")).toHaveCount(WORKS);

      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(audit.violations.map((violation) => `${path} ${violation.id}: ${violation.help}`)).toEqual([]);
    });
  }

  test("chaque schéma porte un texte de remplacement décrivant ce que la réalisation fait", async ({ page }) => {
    await page.goto("/fr/realisations");
    const diagrams = page.locator("main article figure svg[role='img']");
    await expect(diagrams).toHaveCount(WORKS);

    const described = await diagrams.evaluateAll((nodes) =>
      nodes.map((node) => ({
        alt: node.getAttribute("aria-label") ?? "",
        title: node.closest("article")?.querySelector("h2")?.textContent ?? "",
      })),
    );

    for (const { alt, title } of described) {
      expect(alt.length, title).toBeGreaterThan(DESCRIPTION);
      expect(alt, title).not.toBe(title);
    }
  });

  test("le mouvement des schémas s'arrête lorsque le lecteur demande moins d'animation", async ({ page }) => {
    await page.goto("/fr/realisations");
    await expect(page.locator("main .packet").first()).toBeAttached();
    const running = await page.locator("main .packet").evaluateAll(animatedCount);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const stilled = await page.locator("main .packet").evaluateAll(animatedCount);

    expect(running).toBeGreaterThan(0);
    expect(stilled).toBe(0);
  });
});

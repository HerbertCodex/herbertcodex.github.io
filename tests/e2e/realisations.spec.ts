import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/*
 * Les realisations sont une SECTION de la page unique depuis le 2026-09-10, et
 * non plus une page. L'adresse est donc celle de la page, l'ancre nomme la
 * section, et son titre est un h2 — le h1 de la page appartient a l'ouverture.
 */
const ADDRESSES = [
  { path: "/fr#realisations", heading: "Réalisations" },
  { path: "/en#work", heading: "Work" },
];

const WORKS = 4;

/*
 * La longueur minimale d'un texte de remplacement. Un schema decrit ce que la
 * realisation FAIT ; une legende la nomme. Rien ne distingue les deux sinon
 * l'ampleur, et un titre de realisation de ce site tient sous cette barre.
 */
const DESCRIPTION = 40;

/*
 * Les largeurs auxquelles la page est mesuree. 320 px est la largeur normative
 * du critere WCAG 2.1 AA 1.4.10 : c'est ce dont dispose un contenu concu pour
 * 1280 px agrandi a 400 %. 768 est la bascule de la grille du schema, ou la
 * colonne de texte est la plus etroite qu'une deuxieme colonne la laisse.
 */
const REFLOW = [320, 768];

const animatedCount = (nodes: (SVGElement | HTMLElement)[]) =>
  nodes.filter((node) => getComputedStyle(node).animationName !== "none").length;

const geometry = (route: string) => route.replace(/["']/g, "").replace(/\s+/g, " ").trim();

test.describe("la page des réalisations", () => {
  for (const { path, heading } of ADDRESSES) {
    test(`${path} présente les quatre réalisations sans violation d'accessibilité @a11y`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
      await expect(page.locator("main article")).toHaveCount(WORKS);

      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(audit.violations.map((violation) => `${path} ${violation.id}: ${violation.help}`)).toEqual([]);
    });
  }

  for (const { path } of ADDRESSES) {
    test(`${path} se lit sans défilement horizontal jusqu'à 320 px @a11y`, async ({ page }) => {
      const overflowing: string[] = [];

      for (const width of REFLOW) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );

        if (overflow > 0) overflowing.push(`${path} à ${width} px déborde de ${overflow} px`);
      }

      expect(overflowing).toEqual([]);
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

  for (const { path } of ADDRESSES) {
    test(`${path} sert un HTML où aucun élément ne porte d'attribut style, avec un seul élément style en tête`, async ({
      page,
      request,
    }) => {
      const served = await request.get(path);
      expect(served.status()).toBe(200);

      const counted = await page.evaluate(
        (html) => {
          const parsed = new DOMParser().parseFromString(html, "text/html");
          return {
            styleAttributes: parsed.querySelectorAll("[style]").length,
            styleElementsInHead: parsed.head.querySelectorAll("style").length,
          };
        },
        await served.text(),
      );

      expect(counted).toEqual({ styleAttributes: 0, styleElementsInHead: 1 });
    });
  }

  for (const { path } of ADDRESSES) {
    test(`${path} : chaque point suit son trajet dès le rendu, sans attendre le script de la page`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const still = await context.newPage();
      await still.goto(path);

      const schemas = await still.locator("main article figure svg").evaluateAll((svgs) =>
        svgs.map((svg) => ({
          strokes: [...svg.querySelectorAll("path.edge")].map((stroke) => stroke.getAttribute("d") ?? ""),
          routes: [...svg.querySelectorAll(".packet")].map((packet) => getComputedStyle(packet).offsetPath),
        })),
      );

      expect(schemas.length).toBeGreaterThan(0);
      for (const { strokes, routes } of schemas) {
        expect(routes.length).toBeGreaterThan(0);
        expect(routes.filter((route) => route.startsWith("path("))).toEqual(routes);
        expect(routes.map(geometry)).toEqual(strokes.map((stroke) => geometry(`path("${stroke}")`)));
      }
      await context.close();
    });
  }

  test("le mouvement des schémas s'arrête lorsque le lecteur demande moins d'animation", async ({ page }) => {
    await page.goto("/fr/realisations");
    await expect(page.locator("main .packet").first()).toBeAttached();
    const running = await page.locator("main .packet").evaluateAll(animatedCount);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const stilled = await page.locator("main .packet").evaluateAll(animatedCount);
    const kept = await page
      .locator("main .packet")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).offsetPath));

    expect(running).toBeGreaterThan(0);
    expect(stilled).toBe(0);
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.filter((route) => route !== "none")).toEqual(kept);
  });
});

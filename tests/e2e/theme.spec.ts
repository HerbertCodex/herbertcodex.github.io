import { test, expect, type Page } from "@playwright/test";

const PATHS = ["/fr", "/en", "/fr/realisations", "/en/work", "/fr/parcours", "/en/about", "/fr/contact", "/en/contact"];

/*
 * Vingt tabulations font largement le tour de la barre, qui porte huit arrêts
 * au plus, et de l'accueil, qui en ajoute trois. Le budget sert à conclure à
 * une absence plutôt qu'à la déclarer trop tôt.
 */
const TAB_BUDGET = 20;

const TOGGLE = "header button";

async function background(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/*
 * Comparer deux thèmes sans écrire aucune valeur de couleur : la clarté est
 * calculée sur ce que le navigateur rend, donc une couleur changée dans les
 * jetons ne casse pas ce fichier.
 */
function lightness(colour: string): number {
  const [red = 0, green = 0, blue = 0] = (colour.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

async function focusToggle(page: Page): Promise<boolean> {
  for (let step = 0; step < TAB_BUDGET; step += 1) {
    await page.keyboard.press("Tab");
    const onToggle = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLButtonElement && active.closest("header") != null;
    });
    if (onToggle) return true;
  }
  return false;
}

test.describe("sans choix enregistré, le thème est celui du système", () => {
  test("la racine ne porte aucun attribut, et le sombre du système est plus sombre", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/fr");
    const dark = await background(page);
    const marked = await page.evaluate(() => document.documentElement.hasAttribute("data-theme"));

    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    const light = await background(page);

    expect(marked, "la racine porte data-theme alors que le lecteur n'a rien choisi").toBe(false);
    expect(lightness(dark)).toBeLessThan(lightness(light));
  });

  test("un changement du système est suivi page ouverte, sans rechargement", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/fr/parcours");
    const before = await background(page);

    await page.emulateMedia({ colorScheme: "dark" });
    const dark = await background(page);

    await page.emulateMedia({ colorScheme: "light" });
    const after = await background(page);

    expect(lightness(dark)).toBeLessThan(lightness(before));
    expect(after).toBe(before);
  });
});

/*
 * Le chargement sous un système sombre est un chemin distinct de la bascule
 * page ouverte : le HTML prérendu est écrit sans connaître le lecteur, donc
 * l'annonce du bouton n'est juste qu'une fois l'hydratation passée dessus.
 * La bascule, elle, part d'une page déjà hydratée et ne prouve pas ce chemin.
 */
test.describe("sans choix enregistré, le bouton annonce le système dès le chargement", () => {
  for (const address of ["/fr", "/en"]) {
    test(`${address} : l'annonce est juste au chargement, et une activation la retourne`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(address);

      const toggle = page.locator(TOGGLE);
      await expect(toggle, "la page est sombre et le bouton annonce l'inverse").toHaveAttribute("aria-pressed", "true");
      const dark = await background(page);

      await toggle.click();
      const chosen = await background(page);

      expect(lightness(chosen)).toBeGreaterThan(lightness(dark));
      await expect(toggle, "l'annonce n'a pas changé alors que le thème a changé").toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  }
});

test.describe("le choix du lecteur", () => {
  test("l'emporte sur le système, survit à la navigation et au rechargement", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/fr");
    const system = await background(page);

    await page.locator(TOGGLE).click();
    const chosen = await background(page);
    expect(lightness(chosen)).toBeLessThan(lightness(system));

    await page.locator('header nav a[href="/fr/contact"]').click();
    await page.waitForURL(/\/fr\/contact$/);
    expect(await background(page)).toBe(chosen);

    await page.reload();
    expect(await background(page)).toBe(chosen);
  });

  test("est posé sur le document avant la première peinture", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/fr");
    await page.locator(TOGGLE).click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.addInitScript(() => {
      window.addEventListener("load", () => {
        requestAnimationFrame(() => {
          Object.assign(window, { firstFrameTheme: document.documentElement.getAttribute("data-theme") });
        });
      });
    });
    await page.reload();

    await page.waitForFunction(() => "firstFrameTheme" in window);
    const observed = await page.evaluate(
      () => (window as unknown as { firstFrameTheme: string | null }).firstFrameTheme,
    );
    expect(observed, "la page a été peinte une première fois sans le thème choisi").toBe("dark");
  });
});

test("le bouton est atteint et actionné au clavier seul, sur chacune des huit adresses", async ({ page }) => {
  const verdicts: string[] = [];
  for (const address of PATHS) {
    await page.goto(address);
    const before = await background(page);
    const reached = await focusToggle(page);
    if (!reached) {
      verdicts.push(`${address}: aucun arrêt de tabulation ne porte le bouton`);
      continue;
    }
    await page.keyboard.press("Enter");
    const after = await background(page);
    verdicts.push(`${address}: ${after === before ? "l'activation au clavier ne change rien" : "ok"}`);
  }

  expect(verdicts).toEqual(PATHS.map((address) => `${address}: ok`));
});

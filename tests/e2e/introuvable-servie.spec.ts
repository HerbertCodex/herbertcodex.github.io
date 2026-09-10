import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { PRERENDERED } from "../../scripts/routes.mjs";

/*
 * Ce que l'hebergeur sert a une adresse qu'il ne connait pas.
 *
 * GitHub Pages rend le fichier `404.html` place a la racine du dossier
 * publie, avec le statut 404. Tant que le build n'en ecrivait aucun, un
 * visiteur qui TAPAIT une adresse inconnue recevait la page generique de
 * GitHub — mesure le 2026-09-10 sur le site en ligne — et l'ecran bilingue du
 * site n'etait atteint que par navigation INTERNE, ce que
 * `tests/e2e/introuvable.spec.ts` disait deja depuis le 2026-09-07.
 *
 * Cette suite lit l'artefact construit plutot que le serveur : c'est le
 * document lui-meme que l'hebergeur servira, et aucun serveur local ne
 * reproduit la regle de GitHub Pages.
 */
const DOCUMENT = ".output/public/404.html";

test("le build ecrit le document introuvable a la racine du dossier publie", () => {
  const html = readFileSync(DOCUMENT, "utf8");

  expect(PRERENDERED).toContain("/404.html");
  expect(html).toContain("<!DOCTYPE html>");
});

test("son contenu vient de l'ecran introuvable, et dit les deux langues", () => {
  const html = readFileSync(DOCUMENT, "utf8");
  const fr = "Page introuvable";
  const en = "Page not found";

  expect(html).toContain(fr);
  expect(html).toContain(en);
  expect(html.indexOf(fr)).toBeLessThan(html.indexOf(en));
});

test("il porte la politique de contenu comme les autres pages", () => {
  const html = readFileSync(DOCUMENT, "utf8");

  expect(html).toMatch(/<meta http-equiv="Content-Security-Policy" content="[^"]*sha256-/);
  expect(html).toMatch(/<meta name="referrer" content="strict-origin-when-cross-origin">/);
});

test("le point d'entree le reconnait a une marque, nommee ici pour que la renommer rougisse", () => {
  const html = readFileSync(DOCUMENT, "utf8");
  const entry = readFileSync("src/entry-client.tsx", "utf8");

  expect(html).toContain('name="x-served" content="not-found"');
  expect(entry).toContain("x-served");
  expect(entry).toContain("not-found");
});

/*
 * GitHub Pages sert `404.html` pour toute adresse qu il ne connait pas. Aucun
 * serveur local ne reproduit cette regle, alors la suite la pose elle-meme :
 * ce que le visiteur recoit est le document, sous l adresse qu il a tapee.
 */
async function serveLikePages(context: BrowserContext): Promise<void> {
  const document = readFileSync(DOCUMENT, "utf8");
  await context.route("**/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().resourceType() !== "document" || PRERENDERED.includes(path) || path === "/") {
      return route.fallback();
    }
    await route.fulfill({ status: 404, contentType: "text/html; charset=utf-8", body: document });
  });
}

async function complaints(page: Page): Promise<() => string[]> {
  const said: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") said.push(message.text());
  });
  page.on("pageerror", (error) => said.push(error.message));
  return () => said;
}

for (const address of ["/fr/inconnu", "/en/unknown", "/de/x", "/nimportequoi"]) {
  test(`une adresse inconnue tapee, ${address}, atteint l'ecran sans une plainte`, async ({ context, page }) => {
    await serveLikePages(context);
    const said = await complaints(page);

    const response = await page.goto(address);
    await page.waitForLoadState("networkidle");

    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText("Page");
    // Le navigateur signale le statut du document lui-meme, et c'est ce qu'on
    // veut : l'hebergeur DOIT servir cet ecran en 404. Tout le reste est une
    // plainte : l'hydratation qui echouait sur « TypeError: t is not a
    // function », et la violation de politique qui suivait, mesurees le
    // 2026-09-10 avant que le point d'entree ne rende a neuf.
    expect(said().filter((line) => !line.startsWith("Failed to load resource:"))).toEqual([]);
  });
}

import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { PRERENDERED } from "../../scripts/routes.mjs";
import { collectPolicyReports } from "./politique";

const FRAME_ANCESTORS = "frame-ancestors";

const FRAMED = "/fr/parcours";

async function themeOf(page: Page): Promise<string | null> {
  return page.evaluate(() => document.documentElement.getAttribute("data-theme"));
}

/*
 * Recalculées ici avec node:crypto, et jamais importées du calcul du build :
 * le test vérifierait sinon ce calcul par lui-même.
 */
function hashesOf(texts: readonly string[]): string[] {
  const hashes = texts.map((text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`);
  return [...new Set(hashes)].sort();
}

function directivesOf(policy: string): string[] {
  return policy.split(";").map((directive) => directive.trim());
}

function allowedBy(policy: string, name: string): string[] {
  const directive = directivesOf(policy).find((entry) => entry.split(" ")[0] === name) ?? "";
  return [...new Set(directive.split(" ").filter((source) => source.startsWith("'sha256-")))].sort();
}

test("aucune violation ni aucun message de la politique, du chargement à la fin, sur chaque adresse du site", async ({
  page,
}) => {
  const reports = await collectPolicyReports(page);

  for (const address of PRERENDERED) {
    await page.goto(address);
    await page.waitForLoadState("networkidle");
  }

  expect(await reports()).toEqual({ violations: [], messages: [] });
});

test("sur /fr/realisations, le bouton de thème change le thème du document, et le choix survit au rechargement", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/fr/realisations");
  const before = await themeOf(page);

  await page.locator("header button").click();
  await expect.poll(() => themeOf(page), "le clic n'a pas changé le thème du document").not.toBe(before);
  const chosen = await themeOf(page);
  await page.reload();

  expect(await themeOf(page)).toBe(chosen);
});

test("depuis /fr/realisations, le sélecteur de langue conduit à /en/work", async ({ page }) => {
  await page.goto("/fr/realisations");
  await page.locator('header a[hreflang="en"]').click();

  await expect(page).toHaveURL(/\/en\/work$/);
});

test("la balise porte la politique de l'en-tête moins frame-ancestors, et les empreintes sont celles des pages servies", async ({
  page,
  request,
}) => {
  const served: { address: string; policy: string; html: string }[] = [];
  for (const address of PRERENDERED) {
    const response = await request.get(address);
    served.push({ address, policy: response.headers()["content-security-policy"] ?? "", html: await response.text() });
  }

  const read = await page.evaluate(
    (pages) =>
      pages.map((html) => {
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const textsOf = (selector: string) =>
          [...parsed.querySelectorAll(selector)].map((node) => node.textContent ?? "");
        const tags = parsed.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]');
        return {
          tags: [...tags].map((tag) => tag.getAttribute("content") ?? ""),
          scripts: textsOf("script:not([src])"),
          styles: textsOf("style"),
        };
      }),
    served.map((one) => one.html),
  );
  const scripts = hashesOf(read.flatMap((one) => one.scripts));
  const styles = hashesOf(read.flatMap((one) => one.styles));

  const seen = served.map(({ address, policy }, rank) => ({
    address,
    framed: directivesOf(policy).filter((directive) => directive.startsWith(FRAME_ANCESTORS)).length,
    tags: read[rank].tags,
    scripts: allowedBy(policy, "script-src"),
    styles: allowedBy(policy, "style-src"),
  }));
  const expected = served.map(({ address, policy }) => ({
    address,
    framed: 1,
    tags: [
      directivesOf(policy)
        .filter((directive) => !directive.startsWith(FRAME_ANCESTORS))
        .join("; "),
    ],
    scripts,
    styles,
  }));

  expect(seen).toEqual(expected);
});

test("une page du site mise en cadre par une page du site n'y est pas affichée", async ({ page }) => {
  await page.goto(FRAMED);
  const title = (await page.getByRole("heading", { level: 1 }).first().textContent())?.trim() ?? "";
  expect(title, `${FRAMED} ne porte aucun titre de niveau 1 à chercher dans le cadre`).not.toBe("");

  await page.goto("/fr");
  await page.evaluate(
    (address) =>
      new Promise<void>((loaded) => {
        const frame = document.createElement("iframe");
        frame.addEventListener("load", () => loaded(), { once: true });
        frame.src = address;
        document.body.append(frame);
      }),
    FRAMED,
  );

  await expect(
    page.frameLocator(`iframe[src="${FRAMED}"]`).getByRole("heading", { level: 1, name: title }),
  ).toHaveCount(0);
});

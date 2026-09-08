import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { PAGES, addressesToPrerender } from "../../src/shared/pages";

/*
 * L'adresse est ecrite ICI en toutes lettres, jamais importee du module qui la
 * portait : une constante partagee entre la source et son test disparait des
 * deux cotes en un seul remplacement, et le test suivrait le retrait au lieu
 * de le prouver. La partie locale est cherchee a part parce qu'une adresse
 * recollee par script — le nom d'un cote, le domaine de l'autre — laisse la
 * chaine entiere absente du fichier et l'adresse quand meme publiee.
 */
const ADDRESS = "kraherbertdonatienkoffi@gmail.com";
const LOCAL_PART = "kraherbertdonatienkoffi";

const OUTPUT = ".output/public";

const ADDRESSES = addressesToPrerender(PAGES);

const CONTACT = ["/fr/contact", "/en/contact"];

const LINKEDIN = "https://linkedin.com/in/donatien-koffi";
const GITHUB = "https://github.com/HerbertCodex";

/*
 * La barre porte huit arrets — l'evitement, quatre pages, deux langues, le
 * theme — avant que le contenu commence. Seize fait donc un tour large de la
 * page de contact sans dependre du nombre exact de moyens affiches.
 */
const TAB_BUDGET = 16;

function servedFiles(): string[] {
  return readdirSync(OUTPUT, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

test("aucun fichier de l'artefact déployé ne porte l'adresse, scripts de _build compris", () => {
  const files = servedFiles();
  /* latin1 plutot que utf8 : un octet d'image ne se decode pas, et un decodage qui echoue effacerait la recherche. */
  const carrying = files.filter((path) => {
    const body = readFileSync(path, "latin1");
    return body.includes(ADDRESS) || body.includes(LOCAL_PART);
  });

  expect(files.length).toBeGreaterThan(ADDRESSES.length);
  expect(carrying).toEqual([]);
});

test("aucune des huit adresses ne porte de lien de messagerie", async ({ page }) => {
  const carrying: string[] = [];
  for (const address of ADDRESSES) {
    await page.goto(address);
    const links = await page.locator('a[href^="mailto:"]').count();
    if (links > 0) carrying.push(`${address} : ${links}`);
  }

  expect(ADDRESSES).toHaveLength(8);
  expect(carrying).toEqual([]);
});

for (const address of CONTACT) {
  test(`${address} atteint LinkedIn au clavier, puis GitHub, et rien d'autre`, async ({ page }) => {
    await page.goto(address);
    const reached: string[] = [];
    for (let step = 0; step < TAB_BUDGET; step += 1) {
      await page.keyboard.press("Tab");
      const href = await page.evaluate(() => {
        const active = document.activeElement;
        const inMain = active instanceof HTMLAnchorElement && active.closest("main") != null;
        return inMain ? active.getAttribute("href") : null;
      });
      if (href != null && !reached.includes(href)) reached.push(href);
    }

    expect(reached).toEqual([LINKEDIN, GITHUB]);
  });

  test(`${address} ne porte aucun formulaire et n'envoie rien`, async ({ page }) => {
    await page.goto(address);

    /*
     * Le formulaire est refuse sur toute la page ; les autres controles ne le
     * sont que dans le contenu. La barre porte desormais le bouton de theme
     * sur les huit adresses, et compter les boutons du document entier
     * refusait cette commande d'interface au titre d'un envoi qu'elle ne fait
     * pas. Ce qui est en jeu ici est que la page n'envoie rien, pas qu'elle
     * n'ait aucun bouton.
     */
    expect(await page.locator("form, main input, main textarea, main select, main button").count()).toBe(0);
    const targets = await page
      .locator("main a[href]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));
    expect(targets.length).toBeGreaterThan(0);
    for (const href of targets) expect(href, href).toMatch(/^(?:https:\/\/|\/)/);
  });
}

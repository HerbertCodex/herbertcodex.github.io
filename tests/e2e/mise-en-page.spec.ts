import { test, expect, type Page } from "@playwright/test";
import { LOCALES } from "../../src/shared/i18n";
import { PAGES, publishedAddresses } from "../../src/shared/pages";

const ADDRESSES = publishedAddresses(PAGES);

/* La section contact, sur la page de chaque langue. */
const CONTACT = LOCALES.map((locale) => `/${locale}#contact`);

const WIDE = { width: 1440, height: 900 };

/* L'écran large sur lequel le vide latéral de 590 px avait été mesuré. */
const DESKTOP = { width: 1920, height: 900 };

/* Les largeurs auxquelles les cibles de la barre sont mesurées : le téléphone, la bascule, le bureau. */
const TAP_WIDTHS = [320, 768, 1440];

type Box = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly height: number;
  readonly width: number;
};

/*
 * Ce qu'un jeton vaut une fois calculé par le navigateur. La feuille écrit
 * `#b3271a` là où `getComputedStyle` rend `rgb(179, 39, 26)`, et une longueur
 * en `ch` ne devient des pixels qu'une fois posée sur un élément. Une sonde
 * porte donc la déclaration, et c'est ce que le navigateur en fait qui est lu :
 * une couleur changée dans les jetons ne casse pas ce fichier.
 */
async function resolved(page: Page, declaration: string, property: string): Promise<string> {
  return page.evaluate(
    ({ declaration: written, property: read }) => {
      const probe = document.createElement("div");
      probe.style.cssText = `position: fixed; left: 0; top: 0; visibility: hidden; ${written}`;
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(read);
      probe.remove();
      return value;
    },
    { declaration, property },
  );
}

async function boxesOf(page: Page, selector: string): Promise<Box[]> {
  return page.locator(selector).evaluateAll((nodes) =>
    nodes.map((node) => {
      const seen = node.getBoundingClientRect();
      return {
        top: Math.round(seen.top),
        right: Math.round(seen.right),
        bottom: Math.round(seen.bottom),
        left: Math.round(seen.left),
        height: Math.round(seen.height),
        width: Math.round(seen.width),
      };
    }),
  );
}

/* Les boîtes rangées de la gauche vers la droite, pour lire un recouvrement horizontal. */
function acrossThePage(boxes: readonly Box[]): Box[] {
  return [...boxes].sort((one, other) => one.left - other.left);
}

/*
 * Le bloc « l'accueil ouvre sur trois cellules » a été retiré le 2026-09-10
 * avec la liste qu'il mesurait. Cette liste conduisait aux trois autres pages ;
 * il n'y en a plus qu'une, et aucune des deux maquettes ne l'a jamais dessinée.
 * Ce que le menu de la barre offre désormais est mesuré par
 * tests/e2e/menu-ancres.spec.ts, et l'ordre des cinq sections par
 * tests/e2e/adressage.spec.ts.
 */
test.describe("le contact se lit comme une fiche", () => {
  test("l'appel et les conditions sont côte à côte à 1440 px, dans les deux langues", async ({ page }) => {
    const apart: string[] = [];
    await page.setViewportSize(WIDE);

    for (const address of CONTACT) {
      await page.goto(address);
      const [call] = await boxesOf(page, "main .reach");
      const [terms] = await boxesOf(page, "main .terms");

      if (call === undefined || terms === undefined) {
        apart.push(`${address} : l'appel ou les conditions manquent à la fiche`);
        continue;
      }
      if (call.top !== terms.top) {
        apart.push(`${address} : bords supérieurs à ${call.top} px et ${terms.top} px`);
      }
      const [first, second] = acrossThePage([call, terms]);
      if (second.left < first.right) {
        apart.push(`${address} : une boîte commence à ${second.left} px, l'autre finit à ${first.right} px`);
      }
    }

    expect(apart).toEqual([]);
  });

  test("la disponibilité est dite par une pastille en aplat, dans les deux langues", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(CONTACT[0]);
    const plate = await resolved(page, "background-color: var(--accent-plate)", "background-color");
    const onPlate = await resolved(page, "color: var(--on-accent)", "color");
    const absent: string[] = [];

    for (const address of CONTACT) {
      await page.goto(address);
      const worn = await page.evaluate(
        ({ plate: aplat, onPlate: over }) =>
          [...document.querySelectorAll("*")].filter((node) => {
            const style = getComputedStyle(node);
            return style.backgroundColor === aplat && style.color === over;
          }).length,
        { plate, onPlate },
      );

      if (worn === 0) absent.push(`${address} : aucun élément ne porte l'aplat ${plate} avec le texte ${onPlate}`);
    }

    expect(absent).toEqual([]);
  });

  test("plus aucun aplat vermillon ne fait un bandeau, à 1440 px dans les deux langues", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(CONTACT[0]);
    const vermillon = await resolved(page, "background-color: var(--accent-plate)", "background-color");
    const ceiling = Number.parseFloat(await resolved(page, "height: var(--space-5)", "height"));
    const banners: string[] = [];

    for (const address of CONTACT) {
      await page.goto(address);
      const tall = await page.evaluate(
        ({ vermillon: aplat, ceiling: limit }) =>
          [...document.querySelectorAll("*")]
            .filter((node) => getComputedStyle(node).backgroundColor === aplat)
            .map((node) => ({ tag: node.tagName, height: Math.round(node.getBoundingClientRect().height) }))
            .filter((seen) => seen.height >= limit),
        { vermillon, ceiling },
      );

      for (const seen of tall) {
        banners.push(`${address} : ${seen.tag} en aplat mesure ${seen.height} px, pour un plafond de ${ceiling} px`);
      }
    }

    expect(banners).toEqual([]);
  });
});

test.describe("la page prend la largeur de page", () => {
  test("main a la même largeur sur les pages publiées à 1920 px, et au moins la largeur de page", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(ADDRESSES[0]);
    const floor = Number.parseFloat(await resolved(page, "width: var(--page-max)", "width"));
    const widths = new Set<number>();
    const narrow: string[] = [];

    for (const address of ADDRESSES) {
      await page.goto(address);
      const [content] = await boxesOf(page, "main");

      if (content === undefined) {
        narrow.push(`${address} : aucun main à mesurer`);
        continue;
      }
      widths.add(content.width);
      if (content.width < floor) narrow.push(`${address} : main mesure ${content.width} px, moins que ${floor} px`);
    }
    if (widths.size > 1) narrow.push(`les pages publiées rendent main à ${[...widths].join(", ")} px`);

    expect(narrow).toEqual([]);
  });

  test("la ligne de lecture ne suit pas la page : le chapô de l'ouverture reste plus étroit", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(ADDRESSES[0]!);

    const measured = await page.evaluate(() => {
      const content = document.querySelector("main");
      const lede = document.querySelector("main .lede");
      if (content === null || lede === null) return null;
      const style = getComputedStyle(content);
      return {
        /*
         * La largeur que `main` OFFRE, ses remplissages retirés. Comparer à sa
         * boîte extérieure resterait vrai d'une ligne qui occupe toute la
         * colonne, ce qui est exactement le défaut mesuré.
         */
        offered: content.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight),
        line: Math.round(lede.getBoundingClientRect().width),
      };
    });

    expect(measured, "ni main ni chapô à mesurer sur la page").not.toBeNull();
    if (measured === null) return;
    expect(
      measured.line,
      `le chapô mesure ${measured.line} px pour une colonne de ${measured.offered} px`,
    ).toBeLessThan(measured.offered);
  });
});

test.describe("le filet du bandeau de section", () => {
  /*
   * L'exception qui retirait le filet au bandeau OUVRANT une page a été retirée
   * le 2026-09-10 : depuis que le site publie une page unique, aucun bandeau
   * n'ouvre plus rien — le premier suit la rangée de faits de l'ouverture, donc
   * la séparation qu'il annonce existe vraiment. Les cinq le portent, et c'est
   * ce que ce test dit.
   */
  test("les cinq bandeaux portent leur filet, sur chaque page", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(ADDRESSES[0]!);
    const heavy = await resolved(page, "border-top: var(--border-heavy) solid", "border-top-width");
    const lost: string[] = [];

    for (const address of ADDRESSES) {
      await page.goto(address);
      const widths = await page
        .locator("main .section-head")
        .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderTopWidth));

      if (widths.length !== 5) lost.push(`${address} : ${widths.length} bandeau(x) au lieu de cinq`);
      for (const [rank, width] of widths.entries()) {
        if (width !== heavy) lost.push(`${address} : le bandeau ${rank + 1} porte ${width} au lieu de ${heavy}`);
      }
    }

    expect(lost).toEqual([]);
  });
});

test.describe("les cibles de la barre", () => {
  test("le bouton de thème montre une icône, sur les pages publiées", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(ADDRESSES[0]);
    const ceiling = Number.parseFloat(await resolved(page, "width: var(--space-5)", "width"));
    const worded: string[] = [];

    for (const address of ADDRESSES) {
      await page.goto(address);
      const [button] = await boxesOf(page, "header button");
      const [icon] = await boxesOf(page, "header button svg");

      if (button === undefined) {
        worded.push(`${address} : la barre ne porte aucun bouton`);
        continue;
      }
      if (icon === undefined) {
        worded.push(`${address} : le bouton ne contient aucun svg`);
        continue;
      }
      if (icon.width <= 0 || icon.height <= 0) {
        worded.push(`${address} : l'icône mesure ${icon.width} × ${icon.height} px`);
      }
      if (button.width > ceiling) {
        worded.push(`${address} : le bouton mesure ${button.width} px de large, pour un plafond de ${ceiling} px`);
      }
    }

    expect(worded).toEqual([]);
  });

  test("aucune cible ne descend sous la cible tactile minimale, aux trois largeurs", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(ADDRESSES[0]);
    const floor = Number.parseFloat(await resolved(page, "width: var(--tap-min)", "width"));
    const small: string[] = [];

    for (const width of TAP_WIDTHS) {
      await page.setViewportSize({ width, height: WIDE.height });

      for (const address of ADDRESSES) {
        await page.goto(address);
        const targets = await page.locator("header a[href], header button").evaluateAll((nodes) =>
          nodes.map((node) => {
            const seen = node.getBoundingClientRect();
            const named = `${node.tagName} « ${node.textContent?.trim().slice(0, 12) ?? ""} »`;
            return { name: named, across: seen.width, down: seen.height };
          }),
        );

        if (targets.length === 0) small.push(`${address} à ${width} px : aucune cible dans la barre`);
        for (const target of targets) {
          if (target.across < floor || target.down < floor) {
            small.push(
              `${address} à ${width} px : ${target.name} mesure ` +
                `${Math.round(target.across)} × ${Math.round(target.down)} px, pour un plancher de ${floor} px`,
            );
          }
        }
      }
    }

    expect(small).toEqual([]);
  });
});

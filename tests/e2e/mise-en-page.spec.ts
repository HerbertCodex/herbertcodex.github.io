import { test, expect, type Page } from "@playwright/test";
import { LOCALES } from "../../src/shared/i18n";
import { NAMED_PAGES, PAGES, addressOf, addressesToPrerender } from "../../src/shared/pages";

const ADDRESSES = addressesToPrerender(PAGES);

const HOME = LOCALES.map((locale) => ({
  address: `/${locale}`,
  entries: NAMED_PAGES.map((page) => addressOf(page, locale)),
}));

const CONTACT = ["/fr/contact", "/en/contact"];

/* Les deux pages dont un bandeau de section est le PREMIER contenu. */
const OPENING = ["/fr/realisations", "/en/work"];

/* Les deux pages dont le premier bandeau de section suit un titre et un chapô. */
const FOLLOWING = ["/fr/parcours", "/en/about"];

const WIDE = { width: 1440, height: 900 };

const NARROW = { width: 375, height: 900 };

/* L'écran large sur lequel le vide latéral de 590 px avait été mesuré. */
const DESKTOP = { width: 1920, height: 900 };

/* Les largeurs auxquelles les cibles de la barre sont mesurées : le téléphone, la bascule, le bureau. */
const TAP_WIDTHS = [320, 768, 1440];

/*
 * Le rang de chaque entrée, écrit plutôt que recalculé. Le dériver de
 * NAMED_PAGES par la même expression que le composant ferait un test qui
 * répète le code au lieu de le contredire.
 */
const RANKS = ["01", "02", "03"];

/*
 * La hauteur à partir de laquelle une cellule de l'accueil réserve de la place
 * au lieu de la prendre. La maquette en a d'abord porté une de 260 px, et elle
 * refabriquait exactement le vide que cette grille corrige.
 */
const RESERVED = 260;

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
      probe.setAttribute("style", `position: fixed; left: 0; top: 0; visibility: hidden; ${written}`);
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

test.describe("l'accueil ouvre sur trois cellules", () => {
  test("les trois sont sur une seule rangée à 1440 px, dans les deux langues", async ({ page }) => {
    const faults: string[] = [];
    await page.setViewportSize(WIDE);

    for (const { address } of HOME) {
      await page.goto(address);
      const cells = await boxesOf(page, "main .entries > li");

      if (cells.length !== NAMED_PAGES.length) {
        faults.push(`${address} : ${cells.length} cellule(s) au lieu de ${NAMED_PAGES.length}`);
        continue;
      }
      const tops = new Set(cells.map((cell) => cell.top));
      if (tops.size !== 1) faults.push(`${address} : les bords supérieurs sont à ${[...tops].join(", ")} px`);

      const ordered = acrossThePage(cells);
      for (let rank = 1; rank < ordered.length; rank += 1) {
        const before = ordered[rank - 1];
        const cell = ordered[rank];
        if (cell.left < before.right) {
          faults.push(`${address} : une cellule commence à ${cell.left} px, la précédente finit à ${before.right} px`);
        }
      }
    }

    expect(faults).toEqual([]);
  });

  test("les trois sont l'une sous l'autre à 375 px, dans les deux langues", async ({ page }) => {
    const stacked: string[] = [];
    await page.setViewportSize(NARROW);

    for (const { address } of HOME) {
      await page.goto(address);
      const cells = await boxesOf(page, "main .entries > li");

      if (cells.length !== NAMED_PAGES.length) {
        stacked.push(`${address} : ${cells.length} cellule(s) au lieu de ${NAMED_PAGES.length}`);
        continue;
      }
      for (let rank = 1; rank < cells.length; rank += 1) {
        const above = cells[rank - 1];
        const cell = cells[rank];
        if (cell.top < above.bottom) {
          stacked.push(`${address} : une cellule commence à ${cell.top} px, la précédente finit à ${above.bottom} px`);
        }
      }
    }

    expect(stacked).toEqual([]);
  });

  test("aucune hauteur ne leur est réservée à 1440 px, dans les deux langues", async ({ page }) => {
    const reserved: string[] = [];
    await page.setViewportSize(WIDE);

    for (const { address } of HOME) {
      await page.goto(address);
      const measured = await boxesOf(page, "main .entries > li");
      const tallest = Math.max(0, ...measured.map((cell) => cell.height));

      if (tallest >= RESERVED) reserved.push(`${address} : la plus haute cellule mesure ${tallest} px`);
    }

    expect(reserved).toEqual([]);
  });

  test("chaque entrée porte son rang, le nom de la page et une ligne de description", async ({ page }) => {
    const missing: string[] = [];
    await page.setViewportSize(WIDE);

    for (const { address, entries } of HOME) {
      await page.goto(address);
      const read = await page.locator("main .entries > li").evaluateAll((nodes) => {
        const said = (cell: Element, selector: string) => cell.querySelector(selector)?.textContent?.trim() ?? "";
        return nodes.map((node) => ({
          rank: said(node, ".entry-rank"),
          name: said(node, ".entry-name"),
          line: said(node, ".entry-line"),
          href: node.querySelector("a[href]")?.getAttribute("href") ?? "",
        }));
      });

      if (read.map((entry) => entry.href).join(" ") !== entries.join(" ")) {
        missing.push(`${address} : les entrées mènent à ${read.map((entry) => entry.href).join(", ")}`);
        continue;
      }
      if (read.map((entry) => entry.rank).join(" ") !== RANKS.join(" ")) {
        missing.push(`${address} : les rangs lus sont « ${read.map((entry) => entry.rank).join(" ")} »`);
      }
      for (const entry of read) {
        if (entry.name.length === 0) missing.push(`${address} ${entry.href} : aucun nom de page`);
        if (entry.line.length === 0) missing.push(`${address} ${entry.href} : aucune ligne de description`);
        if (entry.name === entry.line) missing.push(`${address} ${entry.href} : le nom et la ligne sont le même texte`);
      }
    }

    expect(missing).toEqual([]);
  });
});

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
  test("main a la même largeur sur les huit adresses à 1920 px, et au moins la largeur de page", async ({ page }) => {
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
    if (widths.size > 1) narrow.push(`les huit adresses rendent main à ${[...widths].join(", ")} px`);

    expect(narrow).toEqual([]);
  });

  test("la ligne de lecture ne suit pas la page : le chapô de l'accueil reste plus étroit", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(HOME[0].address);

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

    expect(measured, "ni main ni chapô à mesurer sur l'accueil").not.toBeNull();
    if (measured === null) return;
    expect(
      measured.line,
      `le chapô mesure ${measured.line} px pour une colonne de ${measured.offered} px`,
    ).toBeLessThan(measured.offered);
  });
});

test.describe("le filet du bandeau de section", () => {
  test("le bandeau qui ouvre une page n'en porte pas", async ({ page }) => {
    const doubled: string[] = [];
    await page.setViewportSize(WIDE);

    for (const address of OPENING) {
      await page.goto(address);
      const width = await page.evaluate(() => {
        const first = document.querySelector("main")?.firstElementChild;
        return first == null ? null : getComputedStyle(first).borderTopWidth;
      });

      if (width !== "0px") doubled.push(`${address} : le premier enfant de main porte un filet de ${width}`);
    }

    expect(doubled).toEqual([]);
  });

  test("un bandeau qui suit du contenu garde le sien", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(FOLLOWING[0]);
    const heavy = await resolved(page, "border-top: var(--border-heavy) solid", "border-top-width");
    const lost: string[] = [];

    for (const address of FOLLOWING) {
      await page.goto(address);
      const width = await page.evaluate(() => {
        const head = document.querySelector("main .section-head");
        return head === null ? null : getComputedStyle(head).borderTopWidth;
      });

      if (width !== heavy) lost.push(`${address} : le premier bandeau porte ${width} au lieu de ${heavy}`);
    }

    expect(lost).toEqual([]);
  });
});

test.describe("les cibles de la barre", () => {
  test("le bouton de thème montre une icône, sur les huit adresses", async ({ page }) => {
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

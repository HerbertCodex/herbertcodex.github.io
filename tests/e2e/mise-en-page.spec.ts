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

/*
 * Le bloc « l'accueil ouvre sur trois cellules » a été retiré le 2026-09-10
 * avec la liste qu'il mesurait. Cette liste conduisait aux trois autres pages ;
 * il n'y en a plus qu'une, et aucune des deux maquettes ne l'a jamais dessinée.
 * Ce que le menu de la barre offre désormais est mesuré par
 * tests/e2e/menu-ancres.spec.ts, et l'ordre des cinq sections par
 * tests/e2e/adressage.spec.ts.
 */
test.describe("le contact ferme la page sur un aplat", () => {
  /*
   * Il se lisait comme une FICHE posée sur le papier depuis le round 9 de
   * s-5bjp, qui avait fait disparaître l'aplat plein. L'opérateur est revenu
   * dessus le 2026-09-11 : la raison écrite au round 9 — « un aplat qui couvre
   * les deux tiers de la page » — portait sur une page de contact, et le
   * contact est depuis la dernière SECTION d'une page unique. Le périmètre
   * signé porte l'amendement, et la décision 0021 le consigne.
   *
   * Ces trois critères sont l'exact retournement de ceux qu'ils remplacent, et
   * c'est voulu : ce qui était interdit est maintenant exigé, à l'endroit même
   * où l'interdiction était écrite.
   */
  test("la section entière porte l'aplat et l'encre inverse, dans les deux langues", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(CONTACT[0]!);
    const plate = await resolved(page, "background-color: var(--accent-plate)", "background-color");
    const onPlate = await resolved(page, "color: var(--on-accent)", "color");
    const wrong: string[] = [];

    for (const address of CONTACT) {
      await page.goto(address);
      const worn = await page.evaluate(() => {
        const section = document.querySelector("main section.contact");
        if (section === null) return null;
        const style = getComputedStyle(section);
        return {
          background: style.backgroundColor,
          color: style.color,
          height: section.getBoundingClientRect().height,
        };
      });

      if (worn === null) wrong.push(`${address} : aucune section de contact`);
      else if (worn.background !== plate) wrong.push(`${address} : fond ${worn.background} au lieu de ${plate}`);
      else if (worn.color !== onPlate) wrong.push(`${address} : encre ${worn.color} au lieu de ${onPlate}`);
      else if (worn.height < 200) wrong.push(`${address} : l'aplat ne mesure que ${Math.round(worn.height)} px`);
    }

    expect(wrong).toEqual([]);
  });

  /*
   * Rien de ce qui est posé SUR l'aplat ne doit garder une couleur pensée pour
   * le papier. Les libellés des conditions sont le cas mesuré : `src/app.css`
   * les compose en gris, et ce gris disparaissait dans le fond.
   */
  test("rien de ce qui est posé dessus ne garde une couleur de papier, dans les deux langues", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(CONTACT[0]!);
    const onPlate = await resolved(page, "color: var(--on-accent)", "color");
    const muted = await resolved(page, "color: var(--ink-muted)", "color");
    const ink = await resolved(page, "color: var(--ink)", "color");
    const wrong: string[] = [];

    for (const address of CONTACT) {
      await page.goto(address);
      const worn = await page.evaluate(
        ({ paper }) =>
          [...document.querySelectorAll("main section.contact *")]
            .filter((node) => node.textContent !== null && node.textContent.trim().length > 0)
            .map((node) => ({ tag: node.tagName, color: getComputedStyle(node).color }))
            .filter((seen) => paper.includes(seen.color)),
        { paper: [muted, ink] },
      );

      for (const seen of worn) wrong.push(`${address} : ${seen.tag} écrit en ${seen.color}, pas en ${onPlate}`);
    }

    expect(wrong).toEqual([]);
  });

  test("le filet des liens se voit sur l'aplat, dans les deux langues", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(CONTACT[0]!);
    const onPlate = await resolved(page, "color: var(--on-accent)", "color");
    const wrong: string[] = [];

    for (const address of CONTACT) {
      await page.goto(address);
      const rules = await page
        .locator("main section.contact .links a")
        .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderBottomColor));

      if (rules.length === 0) wrong.push(`${address} : aucun lien dans la rangée`);
      for (const rule of rules) {
        if (rule !== onPlate) wrong.push(`${address} : un filet en ${rule}, invisible sur l'aplat`);
      }
    }

    expect(wrong).toEqual([]);
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

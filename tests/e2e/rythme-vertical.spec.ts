import { test, expect, type Page } from "@playwright/test";
import { PAGES, addressesToPrerender } from "../../src/shared/pages";

const ADDRESSES = addressesToPrerender(PAGES);

const HOMES = ["/fr", "/en"];

const CONTACT = ["/fr/contact", "/en/contact"];

/* Les deux pages plus longues que toute fenêtre, dont un bandeau de section ouvre le contenu. */
const WORKS = ["/fr/realisations", "/en/work"];

/* Les quatre adresses dont le titre est suivi d'un bloc qui pose lui-même sa respiration. */
const BLOCKED = ["/fr/parcours", "/en/about", ...CONTACT];

/*
 * Une fenêtre plus COURTE que la plus courte des huit pages — la fiche de
 * contact, mesurée à 570 px. Le rythme naturel du cadre ne se lit que là : dès
 * que la fenêtre dépasse la page, le pied descend la fermer et la distance
 * entre le dernier contenu et son filet cesse d'être celle que les règles
 * posent. Les critères qui portent sur cette descente la mesurent à part.
 */
const SHORT = { width: 1440, height: 500 };

const WIDE = { width: 1440, height: 900 };

/*
 * Plus courte encore : l'écran introuvable est la page la plus courte du site,
 * et son rythme ne se lit que dans une fenêtre qu'il dépasse — sans quoi c'est
 * la descente du pied qu'on mesure, et non l'espace que les règles posent.
 */
const CRAMPED = { width: 1440, height: 400 };

/* Les trois hauteurs auxquelles le pied doit fermer une page courte. */
const HEIGHTS = [640, 900, 1200];

/* Les quatre largeurs auxquelles les hauteurs de page sont plafonnées. */
const WIDTHS = [1278, 1440, 1704, 1920];

/*
 * Le plafond de chaque page, largeur par largeur, dans l'ordre de WIDTHS.
 * Ces nombres sont des MESURES du 2026-09-08 diminuées de ce que cette issue
 * retire, écrites en clair : les recalculer ici par la même soustraction que
 * la feuille ferait un test qui répète le code au lieu de le contredire.
 */
const CEILINGS: Readonly<Record<string, readonly number[]>> = {
  "/fr": [640, 640, 640, 640],
  "/en": [640, 640, 640, 640],
  "/fr/realisations": [2538, 2464, 2451, 2451],
  "/en/work": [2540, 2438, 2425, 2425],
  "/fr/parcours": [1848, 1760, 1760, 1760],
  "/en/about": [1822, 1760, 1760, 1760],
  "/fr/contact": [570, 570, 570, 570],
  "/en/contact": [570, 570, 570, 570],
};

/* L'écran introuvable sous un préfixe de langue publié, puis hors de tout préfixe. */
const UNKNOWN = { under: "/fr/inconnu", outside: "/nawak" };

type Edges = {
  readonly top: number;
  readonly bottom: number;
};

type Frame = {
  readonly bar: Edges | null;
  readonly first: Edges | null;
  readonly last: Edges | null;
  readonly foot: Edges | null;
  readonly lastLine: number | null;
  readonly padding: string;
  readonly scrollHeight: number;
  readonly clientHeight: number;
};

/*
 * Ce que l'échelle d'espacement vaut une fois calculée par le navigateur. Les
 * distances sont comparées à ces pas plutôt qu'à des nombres écrits ici : un
 * pas déplacé dans les jetons doit déplacer le cadre, pas casser ce fichier.
 * Les plafonds de hauteur, eux, sont des mesures et restent en clair.
 */
async function stepsOf(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const step = (name: string) => Number.parseFloat(root.getPropertyValue(name));
    return { three: step("--space-3"), four: step("--space-4"), five: step("--space-5"), six: step("--space-6") };
  });
}

/* Les bords du cadre partagé, lus dans la fenêtre : le pied descendu y est descendu. */
async function frameOf(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const edges = (node: Element | null) => {
      if (node === null) return null;
      const seen = node.getBoundingClientRect();
      return { top: seen.top, bottom: seen.bottom };
    };
    const main = document.querySelector("main");
    const foot = document.querySelector("footer");
    const lines = [...(foot?.children ?? [])].map((line) => line.getBoundingClientRect().bottom);
    const style = main === null ? null : getComputedStyle(main);
    return {
      bar: edges(document.querySelector("header")),
      first: edges(main?.firstElementChild ?? null),
      last: edges(main?.lastElementChild ?? null),
      foot: edges(foot),
      lastLine: lines.length === 0 ? null : Math.max(...lines),
      padding: style === null ? "aucun corps de page" : `${style.paddingTop} / ${style.paddingBottom}`,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    };
  });
}

/* La distance entre le bas d'un élément et le haut d'un autre, tous deux pris au premier trouvé. */
async function gapBetween(page: Page, above: string, below: string): Promise<number | null> {
  return page.evaluate(
    ([up, down]) => {
      const first = document.querySelector(up);
      const second = document.querySelector(down);
      if (first === null || second === null) return null;
      return Math.round(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom);
    },
    [above, below],
  );
}

/*
 * Les huit adresses parcourues dans la même fenêtre, et ce que le juge trouve
 * de fautif sur chacune. Trois critères lisent le même cadre dans la même
 * fenêtre et ne diffèrent que par la distance qu'ils y prennent : leur
 * préambule écrit trois fois est exactement ce que la porte `duplication`
 * refuse, et une porte contournée est une porte éteinte pour tout le monde.
 */
async function acrossAddresses(
  page: Page,
  judge: (frame: Frame, address: string, steps: Record<string, number>) => readonly string[],
): Promise<string[]> {
  await page.setViewportSize(SHORT);
  await page.goto(ADDRESSES[0]);
  const steps = await stepsOf(page);
  const faults: string[] = [];

  for (const address of ADDRESSES) {
    await page.goto(address);
    faults.push(...judge(await frameOf(page), address, steps));
  }
  return faults;
}

/*
 * L'écran introuvable ne se rend que par navigation INTERNE : l'artefact ne
 * publie aucun document pour une adresse qu'il ignore, donc un `goto` direct
 * reçoit le 404 en texte brut du serveur statique, jamais l'écran.
 */
async function reachUnknown(page: Page, address: string): Promise<void> {
  await page.goto(HOMES[0]);
  await page.evaluate((wanted) => {
    history.pushState({}, "", wanted);
    dispatchEvent(new PopStateEvent("popstate"));
  }, address);
  await page.locator("main.not-found h1").waitFor();
}

test.describe("le cadre ne compte plus l'espace deux fois", () => {
  test("le filet du haut de page ouvre sur le premier contenu, et le corps de page n'ajoute rien", async ({ page }) => {
    const faults = await acrossAddresses(page, (frame, address, { five }) => {
      if (frame.bar === null || frame.first === null)
        return [`${address} : le haut de page ou le premier contenu manque`];
      const gap = Math.round(frame.first.top - frame.bar.bottom);
      const said: string[] = [];

      if (gap !== five) said.push(`${address} : ${gap} px sous le filet du haut de page, au lieu de ${five}`);
      if (frame.padding !== "0px / 0px") {
        said.push(`${address} : le corps de page déclare ${frame.padding} de marge intérieure verticale`);
      }
      return said;
    });

    expect(faults).toEqual([]);
  });

  test("le dernier contenu ferme sur le filet du pied", async ({ page }) => {
    const faults = await acrossAddresses(page, (frame, address, { five }) => {
      if (frame.last === null || frame.foot === null) return [`${address} : le dernier contenu ou le pied manque`];
      const gap = Math.round(frame.foot.top - frame.last.bottom);

      if (gap === five) return [];
      return [`${address} : ${gap} px entre le dernier contenu et le filet du pied, au lieu de ${five}`];
    });

    expect(faults).toEqual([]);
  });

  test("le pied respire sous sa dernière ligne, sans creuser un huitième d'écran", async ({ page }) => {
    const faults = await acrossAddresses(page, (frame, address, { four }) => {
      if (frame.foot === null || frame.lastLine === null) return [`${address} : le pied ou sa dernière ligne manque`];
      const gap = Math.round(frame.foot.bottom - frame.lastLine);

      if (gap === four) return [];
      return [`${address} : ${gap} px sous la dernière ligne du pied, au lieu de ${four}`];
    });

    expect(faults).toEqual([]);
  });

  test("le titre appelle son chapô de près, et laisse les blocs poser leur propre respiration", async ({ page }) => {
    const faults: string[] = [];
    await page.setViewportSize(SHORT);
    await page.goto(ADDRESSES[0]);
    const { three, five, six } = await stepsOf(page);

    for (const address of HOMES) {
      await page.goto(address);
      const gap = await gapBetween(page, "main h1", "main h1 + *");
      if (gap !== three) faults.push(`${address} : ${gap} px entre le titre et le chapô, au lieu de ${three}`);
    }
    for (const address of BLOCKED) {
      await page.goto(address);
      const gap = await gapBetween(page, "main h1", "main h1 + *");
      if (gap !== six) faults.push(`${address} : ${gap} px sous le titre, au lieu des ${six} que le bloc pose`);
    }
    for (const address of WORKS) {
      await page.goto(address);
      const gap = await gapBetween(page, "main .section-head", "main .work");
      if (gap !== five) faults.push(`${address} : ${gap} px sous le bandeau de section, au lieu de ${five}`);
    }

    expect(faults).toEqual([]);
  });
});

test.describe("le pied ferme la page", () => {
  test("il se pose au bas de la fenêtre sur les quatre pages courtes, aux trois hauteurs", async ({ page }) => {
    const faults: string[] = [];

    for (const height of HEIGHTS) {
      await page.setViewportSize({ width: WIDE.width, height });

      for (const address of [...HOMES, ...CONTACT]) {
        await page.goto(address);
        const frame = await frameOf(page);

        if (frame.foot === null) {
          faults.push(`${address} à ${height} px : aucun pied à mesurer`);
          continue;
        }
        const bottom = Math.round(frame.foot.bottom);
        if (bottom !== frame.clientHeight) {
          faults.push(
            `${address} à ${height} px : le pied finit à ${bottom} px, la fenêtre à ${frame.clientHeight} px`,
          );
        }
      }
    }

    expect(faults).toEqual([]);
  });

  test("et la page ne défile pas pour autant, aux trois mêmes hauteurs", async ({ page }) => {
    const scrolling: string[] = [];

    for (const height of HEIGHTS) {
      await page.setViewportSize({ width: WIDE.width, height });

      for (const address of [...HOMES, ...CONTACT]) {
        await page.goto(address);
        const frame = await frameOf(page);

        if (frame.scrollHeight !== frame.clientHeight) {
          scrolling.push(
            `${address} à ${height} px : ${frame.scrollHeight - frame.clientHeight} px de défilement ` +
              `(${frame.scrollHeight} px de page pour ${frame.clientHeight} px de fenêtre)`,
          );
        }
      }
    }

    expect(scrolling).toEqual([]);
  });

  test("une page plus longue que la fenêtre garde son pied à sa suite, et son défilement", async ({ page }) => {
    const faults: string[] = [];
    await page.setViewportSize(WIDE);

    for (const address of WORKS) {
      await page.goto(address);
      const frame = await frameOf(page);

      if (frame.foot === null) {
        faults.push(`${address} : aucun pied à mesurer`);
        continue;
      }
      const bottom = Math.round(frame.foot.bottom);
      if (frame.scrollHeight <= frame.clientHeight) {
        faults.push(`${address} : la page ne défile plus (${frame.scrollHeight} px pour ${frame.clientHeight} px)`);
      }
      if (bottom <= frame.clientHeight) {
        faults.push(`${address} : le pied s'est posé à ${bottom} px, dans une fenêtre de ${frame.clientHeight} px`);
      }
      if (Math.abs(frame.scrollHeight - bottom) > 1) {
        faults.push(`${address} : le pied finit à ${bottom} px pour une page de ${frame.scrollHeight} px`);
      }
    }

    expect(faults).toEqual([]);
  });

  test("aucune des huit pages ne dépasse la hauteur annoncée, aux quatre largeurs", async ({ page }) => {
    const tall: string[] = [];

    for (const [rank, width] of WIDTHS.entries()) {
      await page.setViewportSize({ width, height: SHORT.height });

      for (const address of ADDRESSES) {
        await page.goto(address);
        const frame = await frameOf(page);
        const ceiling = CEILINGS[address][rank];

        if (frame.foot === null) {
          tall.push(`${address} à ${width} px : aucun pied à mesurer`);
          continue;
        }
        const bottom = Math.round(frame.foot.bottom);
        if (bottom > ceiling)
          tall.push(`${address} à ${width} px : le pied finit à ${bottom} px, plafond ${ceiling} px`);
      }
    }

    expect(tall).toEqual([]);
  });
});

/* Sous un préfixe publié, l'écran porte le cadre : le vide qu'il pose lui-même s'ajoute à celui du cadre. */
function framedFaults(frame: Frame, gap: number): string[] {
  if (frame.bar === null || frame.foot === null || frame.first === null || frame.last === null) {
    return [`${UNKNOWN.under} : le haut de page ou le pied manque à l'écran qui les porte`];
  }
  const above = Math.round(frame.first.top - frame.bar.bottom);
  const below = Math.round(frame.foot.top - frame.last.bottom);
  const said: string[] = [];

  if (above !== gap) said.push(`${UNKNOWN.under} : ${above} px au-dessus du titre, au lieu de ${gap}`);
  if (below !== gap) said.push(`${UNKNOWN.under} : ${below} px sous le dernier contenu, au lieu de ${gap}`);
  return said;
}

/* Hors de tout préfixe, il ne porte rien du cadre : le vide au-dessus de son titre est le sien seul. */
function bareFaults(frame: Frame, gap: number): string[] {
  const said: string[] = [];

  if (frame.bar !== null || frame.foot !== null) {
    said.push(`${UNKNOWN.outside} : l'écran hors préfixe porte le haut de page ou le pied`);
  }
  if (frame.first === null) return [...said, `${UNKNOWN.outside} : aucun contenu à mesurer`];

  const above = Math.round(frame.first.top);
  if (above !== gap) said.push(`${UNKNOWN.outside} : ${above} px au-dessus du titre, au lieu de ${gap}`);
  return said;
}

test.describe("l'écran introuvable garde son rythme", () => {
  test("sous un préfixe publié il porte le cadre, hors de tout préfixe il n'en porte aucun", async ({ page }) => {
    await page.setViewportSize(CRAMPED);
    await page.goto(HOMES[0]);
    const { five, six } = await stepsOf(page);

    await reachUnknown(page, UNKNOWN.under);
    const framed = framedFaults(await frameOf(page), six + five);

    await reachUnknown(page, UNKNOWN.outside);
    const bare = bareFaults(await frameOf(page), six);

    expect([...framed, ...bare]).toEqual([]);
  });
});

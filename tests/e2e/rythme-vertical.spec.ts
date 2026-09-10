import { test, expect, type Page } from "@playwright/test";
import { PAGES, publishedAddresses } from "../../src/shared/pages";

const ADDRESSES = publishedAddresses(PAGES);

/*
 * Le site publiait huit pages jusqu'au 2026-09-10 : quatre par langue, dont
 * quatre tenaient dans une fenêtre. Il en publie deux, chacune portant toutes
 * les sections, et chacune plus longue que toute fenêtre.
 */
const HOMES = ADDRESSES;

/*
 * Une fenêtre plus COURTE que la page. Le rythme naturel du cadre ne se lit que
 * là : dès que la fenêtre dépasse la page, le pied descend la fermer et la
 * distance entre le dernier contenu et son filet cesse d'être celle que les
 * règles posent. Depuis que le site publie une page unique, toute fenêtre est
 * plus courte qu'elle — cette hauteur reste écrite pour que la mesure ne
 * dépende pas de ce fait.
 */
const SHORT = { width: 1440, height: 500 };

const WIDE = { width: 1440, height: 900 };

/*
 * Plus courte encore : l'écran introuvable est la page la plus courte du site,
 * et son rythme ne se lit que dans une fenêtre qu'il dépasse — sans quoi c'est
 * la descente du pied qu'on mesure, et non l'espace que les règles posent.
 */
const CRAMPED = { width: 1440, height: 400 };

/* Les trois hauteurs de fenêtre auxquelles le pied est mesuré. */
const HEIGHTS = [640, 900, 1200];

/*
 * Le tableau des plafonds de hauteur a été retiré le 2026-09-10, et son retrait
 * est une décision plutôt qu'un oubli. Il donnait une hauteur mesurée par page
 * et par largeur ; les huit pages qu'il nommait sont devenues deux, et la
 * hauteur d'une page qui porte TOUT ne peut pas être remesurée ici : cette
 * station ne résout aucune des quatre faces de `--font-grotesk` et sert le site
 * en DejaVu Sans, plus large. Un plafond mesuré ici contredirait la CI et le
 * visiteur, ce qui est exactement l'erreur des 606 px du round 2.
 *
 * Ce qui garde l'intention sans dépendre d'une police : le pied reste à la
 * suite du contenu et la page défile, mesurés plus bas ; et 640 px de fenêtre
 * suffisent à voir le premier bandeau de section, mesuré par
 * tests/e2e/rythme-accueil.spec.ts.
 */

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

  test("le titre appelle son chapô de près, et chaque bandeau laisse son bloc respirer", async ({ page }) => {
    const faults: string[] = [];
    await page.setViewportSize(SHORT);
    await page.goto(ADDRESSES[0]!);
    const { three, five } = await stepsOf(page);

    for (const address of ADDRESSES) {
      await page.goto(address);

      const underTitle = await gapBetween(page, "main h1", "main h1 + *");
      if (underTitle !== three)
        faults.push(`${address} : ${underTitle} px entre le titre et le chapô, au lieu de ${three}`);

      const underHead = await gapBetween(page, "main .section-head", "main .work");
      if (underHead !== five) faults.push(`${address} : ${underHead} px sous le premier bandeau, au lieu de ${five}`);
    }

    expect(faults).toEqual([]);
  });
});

test.describe("le pied ferme la page", () => {
  /*
   * Deux critères ont été retirés ici le 2026-09-10, et le document signé
   * docs/decisions/perimetre-approuve-rythme-vertical-round2.json porte
   * l'amendement qui le dit : « le pied se pose au bas de la fenêtre sur les
   * quatre pages courtes » et « la page ne défile pas pour autant » portaient
   * sur des pages qui n'existent plus. Une page unique défile par construction,
   * et un critère qu'aucune page ne peut satisfaire se lit comme une régression.
   */
  test("la page garde son pied à sa suite, et son défilement, aux trois hauteurs", async ({ page }) => {
    const faults: string[] = [];

    for (const height of HEIGHTS) {
      await page.setViewportSize({ width: WIDE.width, height });

      for (const address of HOMES) {
        await page.goto(address);
        const frame = await frameOf(page);

        if (frame.foot === null) {
          faults.push(`${address} à ${height} px : aucun pied à mesurer`);
          continue;
        }
        const bottom = Math.round(frame.foot.bottom);

        if (frame.scrollHeight <= frame.clientHeight) {
          faults.push(
            `${address} à ${height} px : la page ne défile pas (${frame.scrollHeight} px pour ${frame.clientHeight} px)`,
          );
        }
        if (bottom <= frame.clientHeight) {
          faults.push(
            `${address} à ${height} px : le pied s'est posé à ${bottom} px dans une fenêtre de ${frame.clientHeight} px`,
          );
        }
        if (Math.abs(frame.scrollHeight - bottom) > 1) {
          faults.push(
            `${address} à ${height} px : le pied finit à ${bottom} px pour une page de ${frame.scrollHeight} px`,
          );
        }
      }
    }

    expect(faults).toEqual([]);
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

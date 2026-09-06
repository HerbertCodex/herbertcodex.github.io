import { test, expect, type Page } from "@playwright/test";
import { PAGES, addressesToPrerender } from "../../src/shared/pages";

const ADDRESSES = addressesToPrerender(PAGES);

/*
 * La fenêtre de référence. La barre y tient sur une seule ligne, donc rien
 * dans sa hauteur ne masque un défaut de position.
 */
const WIDE = { width: 1440, height: 900 };

/*
 * Un téléphone tenu en paysage. La barre y mesure plus du quart de la
 * hauteur : c'est la fenêtre où elle doit rendre sa place au texte.
 */
const SHORT = { width: 740, height: 360 };

/* Ce qu'un lecteur fait défiler avant de vouloir changer de page. */
const READING = 800;

const SHORT_READING = 300;

/* Les huit largeurs de référence auxquelles le site est mesuré. */
const WIDTHS = [320, 360, 375, 480, 768, 900, 1100, 1440];

/* Celles auxquelles le lien d'évitement est vérifié, de la plus étroite au bureau. */
const SKIP_WIDTHS = [320, 375, 768, 1440];

const TALL = 900;

type Placement = {
  readonly top: number;
  readonly bottom: number;
  readonly viewport: number;
  readonly scrolled: number;
};

/*
 * La barre est le repère de bannière de la page, et il n'y en a qu'un. Elle
 * est lue par son élément plutôt que par son rôle parce que la mesure a
 * besoin du même instant pour la barre et pour ce qu'elle recouvre.
 */
async function barPlacement(page: Page): Promise<Placement | null> {
  return page.evaluate(() => {
    const bar = document.querySelector("header");
    if (bar === null) return null;
    const box = bar.getBoundingClientRect();
    return {
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      viewport: window.innerHeight,
      scrolled: Math.round(window.scrollY),
    };
  });
}

async function readDown(page: Page, distance: number): Promise<void> {
  await page.evaluate((y) => window.scrollTo(0, y), distance);
}

type Stop = {
  readonly name: string;
  readonly top: number;
  readonly bar: number;
};

/*
 * L'arrêt de tabulation en cours, quand il est situé SOUS la barre. Ce qu'elle
 * contient est en elle, et le lien d'évitement — le seul lien vers un fragment
 * de la page — est posé par-dessus elle, puisqu'il mène hors d'elle.
 */
async function focusedStop(page: Page): Promise<Stop | null> {
  return page.evaluate(() => {
    const active = document.activeElement;
    const bar = document.querySelector("header");
    if (bar === null || active === null || active === document.body) return null;
    if (bar.contains(active) || active.matches('a[href^="#"]')) return null;
    return {
      name: `${active.tagName} « ${active.textContent?.trim().slice(0, 24) ?? ""} »`,
      top: Math.round(active.getBoundingClientRect().top),
      bar: Math.round(bar.getBoundingClientRect().bottom),
    };
  });
}

test.describe("la barre du site", () => {
  test("reste entièrement visible en haut après un défilement de lecture, sur les huit adresses", async ({ page }) => {
    const faults: string[] = [];
    await page.setViewportSize(WIDE);

    for (const address of ADDRESSES) {
      await page.goto(address);
      await readDown(page, READING);
      const placement = await barPlacement(page);

      if (placement === null) {
        faults.push(`${address} : aucune barre à mesurer`);
        continue;
      }
      if (placement.top < 0) {
        faults.push(`${address} : la barre est remontée à ${placement.top} px après ${placement.scrolled} px lus`);
      }
      if (placement.bottom > placement.viewport) {
        faults.push(
          `${address} : son bord inférieur est à ${placement.bottom} px, hors d'une fenêtre de ${placement.viewport} px`,
        );
      }
    }

    expect(faults).toEqual([]);
  });

  test("est opaque une fois restée en haut, sur les huit adresses", async ({ page }) => {
    const seen: string[] = [];
    await page.setViewportSize(WIDE);

    for (const address of ADDRESSES) {
      await page.goto(address);
      await readDown(page, READING);
      const alpha = await page.evaluate(() => {
        const bar = document.querySelector("header");
        if (bar === null) return null;
        const parts = getComputedStyle(bar).backgroundColor.match(/[\d.]+/g) ?? [];
        return parts.length < 4 ? 1 : Number(parts[3]);
      });

      if (alpha !== 1) seen.push(`${address} : fond de composante alpha ${alpha}`);
    }

    expect(seen).toEqual([]);
  });

  test("ne recouvre jamais la cible du lien d'évitement, aux quatre largeurs", async ({ page }) => {
    const hidden: string[] = [];

    for (const width of SKIP_WIDTHS) {
      await page.setViewportSize({ width, height: TALL });

      for (const address of ADDRESSES) {
        await page.goto(address);
        const skip = page.getByRole("link").first();
        const fragment = (await skip.getAttribute("href")) ?? "";
        await readDown(page, READING);
        await skip.focus();
        await page.keyboard.press("Enter");
        await page.waitForFunction((hash) => window.location.hash === hash, fragment);

        const placed = await page.evaluate((selector) => {
          const bar = document.querySelector("header");
          const target = document.querySelector(selector);
          if (bar === null || target === null) return null;
          return {
            target: Math.round(target.getBoundingClientRect().top),
            bar: Math.round(bar.getBoundingClientRect().bottom),
          };
        }, fragment);

        if (placed === null) {
          hidden.push(`${address} à ${width} px : ni barre ni cible « ${fragment} » à mesurer`);
          continue;
        }
        if (placed.target < placed.bar) {
          hidden.push(
            `${address} à ${width} px : la cible est à ${placed.target} px, la barre descend à ${placed.bar} px`,
          );
        }
      }
    }

    expect(hidden).toEqual([]);
  });

  test("ne recouvre aucun arrêt de tabulation situé sous elle", async ({ page }) => {
    const covered: string[] = [];
    await page.setViewportSize(WIDE);
    await page.goto("/fr/realisations");
    const stops = await page.locator("a[href], button, input, select, textarea").count();

    /*
     * Les deux sens de parcours comptent, et le second est celui qui découvre
     * le défaut : en avant, le navigateur centre l'élément qu'il amène ; en
     * arrière, il laisse en place celui qu'il croit déjà visible, la barre
     * fût-elle par-dessus.
     */
    for (const key of ["Tab", "Shift+Tab"]) {
      for (let step = 0; step < stops; step += 1) {
        await page.keyboard.press(key);
        const stop = await focusedStop(page);

        if (stop !== null && stop.top < stop.bar) {
          covered.push(`${stop.name} reçoit le focus à ${stop.top} px, sous une barre qui descend à ${stop.bar} px`);
        }
      }
    }

    expect(covered).toEqual([]);
  });

  test("rend sa hauteur au contenu sur une fenêtre courte, sur les huit adresses", async ({ page }) => {
    const kept: string[] = [];
    await page.setViewportSize(SHORT);

    for (const address of ADDRESSES) {
      await page.goto(address);
      await readDown(page, SHORT_READING);
      const placement = await barPlacement(page);

      if (placement === null) {
        kept.push(`${address} : aucune barre à mesurer`);
        continue;
      }
      if (placement.bottom > 0) {
        kept.push(
          `${address} : la barre occupe encore jusqu'à ${placement.bottom} px après ${placement.scrolled} px lus`,
        );
      }
    }

    expect(kept).toEqual([]);
  });

  test("laisse les huit adresses sans débordement horizontal, aux huit largeurs @a11y", async ({ page }) => {
    const overflowing: string[] = [];

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: TALL });

      for (const address of ADDRESSES) {
        await page.goto(address);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );

        if (overflow > 0) overflowing.push(`${address} à ${width} px déborde de ${overflow} px`);
      }
    }

    expect(overflowing).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { MetaProvider } from "@solidjs/meta";
import { cleanup, render } from "@solidjs/testing-library";
import WorksSection from "~/features/works/WorksSection";
import { contentFor, type Work } from "~/shared/content";
import { createI18n, I18nContext, LOCALES, type Locale } from "~/shared/i18n";

const FRENCH = contentFor("fr").works;

function bannerOf(work: Work): string {
  const from = work.provenance;
  if (from.kind === "employer") return `En entreprise, ${from.employer}`;
  return from.openSource ? "Projet personnel, open source" : "Projet personnel";
}

function shown(locale: Locale = "fr") {
  return render(() => (
    <MetaProvider>
      <I18nContext.Provider value={createI18n(() => locale)}>
        <WorksSection rank={1} anchor="realisations" />
      </I18nContext.Provider>
    </MetaProvider>
  ));
}

function cardOf(root: HTMLElement, work: Work): HTMLElement {
  const found = [...root.querySelectorAll("article")].find(
    (card) => card.querySelector("h3")?.textContent === work.title,
  );
  if (found === undefined) throw new Error(`aucune réalisation intitulée « ${work.title} » n'est rendue`);
  return found;
}

/*
 * Le trajet d'une arete ne depend que de la place de ses deux boites dans la
 * grille : compter les couples de places distincts, c'est compter les trajets
 * distincts sans reprendre la geometrie que le composant calcule.
 */
function distinctFlowRoutes(works: readonly Work[]): number {
  const couples = works.flatMap((work) => {
    if (work.diagram === undefined) return [];
    const places = new Map(work.diagram.nodes.map((box) => [box.id, `${box.column}:${box.row}`]));
    return work.diagram.edges.flatMap((edge) => {
      const from = places.get(edge.from);
      const to = places.get(edge.to);
      return edge.kind === "flow" && from !== undefined && to !== undefined ? [`${from}>${to}`] : [];
    });
  });
  return new Set(couples).size;
}

const headSheets = () => [...document.head.querySelectorAll("style")];

const flattened = (css: string) => css.replace(/'/g, '"').replace(/\s*([:;(){}])\s*/g, "$1");

describe("la page des réalisations", () => {
  it("présente les quatre réalisations dans l'ordre déclaré par le contenu, jamais dans un ordre calculé", () => {
    const { container } = shown();

    const titles = [...container.querySelectorAll("article h3")].map((node) => node.textContent);

    expect(titles).toEqual(FRENCH.map((work) => work.title));
    expect(titles).not.toEqual([...titles].sort());
    cleanup();
  });

  it("donne à chaque réalisation son bandeau de provenance", () => {
    const { getByText } = shown();

    for (const work of FRENCH) expect(getByText(bannerOf(work)), work.title).toBeTruthy();
    cleanup();
  });

  it("n'affiche ni ligne de résultat ni ordre de grandeur là où aucun résultat réel n'existe", () => {
    const { container } = shown();
    const silent = FRENCH.filter((work) => work.result === undefined);
    const speaking = FRENCH.filter((work) => work.result !== undefined);

    expect(silent.length).toBeGreaterThan(0);
    expect(speaking.length).toBeGreaterThan(0);
    for (const work of silent) {
      const card = cardOf(container, work);
      expect(card.textContent, work.title).not.toContain("Le résultat");
      expect(card.textContent ?? "", work.title).not.toMatch(/\d/);
    }
    for (const work of speaking) {
      const card = cardOf(container, work);
      expect(card.textContent, work.title).toContain("Le résultat");
      expect(card.textContent, work.title).toContain(String(work.result));
    }
    cleanup();
  });

  it("ne rend aucun lien quand ni la démonstration ni le code ne sont consultables", () => {
    const { container } = shown();

    expect(FRENCH.some((work) => work.links.length === 0)).toBe(true);
    expect(FRENCH.some((work) => work.links.length > 0)).toBe(true);
    for (const work of FRENCH) {
      const hrefs = [...cardOf(container, work).querySelectorAll("a")].map((link) => link.getAttribute("href"));
      expect(hrefs, work.title).toEqual(work.links.map((link) => link.href));
    }
    cleanup();
  });

  for (const locale of LOCALES) {
    it(`écrit en ${locale} un seul élément style en tête, une règle par trajet distinct des arêtes de flux`, () => {
      expect(headSheets(), "la tête garde un élément style d'un rendu précédent").toHaveLength(0);
      const { container } = shown(locale);
      const sheets = headSheets();

      expect(sheets).toHaveLength(1);
      const rules = (sheets[0].textContent ?? "")
        .split("}")
        .filter((rule) => rule.trim() !== "")
        .map((rule) => rule.split("{").map((part) => part.trim()));
      expect(rules).toHaveLength(distinctFlowRoutes(contentFor(locale).works));

      const governing = new Set<string>();
      for (const schema of container.querySelectorAll("figure svg")) {
        const strokes = [...schema.querySelectorAll("path.edge")].map((stroke) => stroke.getAttribute("d") ?? "");
        const packets = [...schema.querySelectorAll(".packet")];
        expect(packets).toHaveLength(strokes.length);
        packets.forEach((packet, rank) => {
          const matching = rules.filter(([selector]) => packet.matches(selector));
          expect(matching.map(([, declaration]) => flattened(declaration))).toEqual([
            flattened(`offset-path: path("${strokes[rank]}")`),
          ]);
          for (const [selector] of matching) governing.add(selector);
        });
      }
      expect(governing.size).toBe(rules.length);
      cleanup();
    });
  }

  it("écrit le même élément style, octet pour octet, en français et en anglais", () => {
    const texts = LOCALES.map((locale) => {
      expect(headSheets(), locale).toHaveLength(0);
      const view = shown(locale);
      const sheets = headSheets();
      expect(sheets, locale).toHaveLength(1);
      const text = sheets[0].textContent;
      view.unmount();
      return text;
    });

    expect(texts[0]?.length ?? 0).toBeGreaterThan(0);
    expect(new Set(texts).size).toBe(1);
    cleanup();
  });
});

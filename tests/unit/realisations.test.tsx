import { describe, expect, it } from "vitest";
import { MetaProvider } from "@solidjs/meta";
import { cleanup, render } from "@solidjs/testing-library";
import WorksPage from "~/features/works/WorksPage";
import { contentFor, type Work } from "~/shared/content";
import { createI18n, I18nContext } from "~/shared/i18n";

const FRENCH = contentFor("fr").works;

function bannerOf(work: Work): string {
  const from = work.provenance;
  if (from.kind === "employer") return `En entreprise, ${from.employer}`;
  return from.openSource ? "Projet personnel, open source" : "Projet personnel";
}

function shown() {
  return render(() => (
    <MetaProvider>
      <I18nContext.Provider value={createI18n(() => "fr")}>
        <WorksPage />
      </I18nContext.Provider>
    </MetaProvider>
  ));
}

function cardOf(root: HTMLElement, work: Work): HTMLElement {
  const found = [...root.querySelectorAll("article")].find(
    (card) => card.querySelector("h2")?.textContent === work.title,
  );
  if (found === undefined) throw new Error(`aucune réalisation intitulée « ${work.title} » n'est rendue`);
  return found;
}

describe("la page des réalisations", () => {
  it("présente les quatre réalisations dans l'ordre déclaré par le contenu, jamais dans un ordre calculé", () => {
    const { container } = shown();

    const titles = [...container.querySelectorAll("article h2")].map((node) => node.textContent);

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
});
